//! Request handler with retry logic
use axum::{
    body::{Body, Bytes},
    extract::{Request, State},
    http::{HeaderMap, Method, StatusCode},
    response::{IntoResponse, Response},
};
use reqwest::Client;
use std::{io, pin::Pin, time::Duration};
use tokio::sync::mpsc;
use tokio_stream::{wrappers::ReceiverStream, Stream, StreamExt};

use super::server::{LogEntry, ProxyState};

type UpstreamByteStream =
    Pin<Box<dyn Stream<Item = Result<Bytes, reqwest::Error>> + Send + 'static>>;

#[derive(Clone, Copy)]
enum RetryReason {
    StatusCode(u16),
    TransportError,
    FirstByteTimeout,
    FullResponseTimeout,
    StreamIdleTimeout,
}

impl RetryReason {
    fn detail_type(self) -> &'static str {
        match self {
            Self::StatusCode(_) => "retry_status_code",
            Self::TransportError => "retry_transport_error",
            Self::FirstByteTimeout => "retry_first_byte_timeout",
            Self::FullResponseTimeout => "retry_full_response_timeout",
            Self::StreamIdleTimeout => "retry_stream_idle_timeout",
        }
    }

    fn label(self) -> &'static str {
        match self {
            Self::StatusCode(_) => "status code",
            Self::TransportError => "transport error",
            Self::FirstByteTimeout => "first byte timeout",
            Self::FullResponseTimeout => "full response timeout",
            Self::StreamIdleTimeout => "stream idle timeout",
        }
    }
}

struct RequestTemplate {
    method: Method,
    headers: HeaderMap,
    body_bytes: Bytes,
}

impl RequestTemplate {
    fn new(parts: axum::http::request::Parts, body_bytes: Bytes) -> Self {
        Self {
            method: parts.method,
            headers: parts.headers,
            body_bytes,
        }
    }

    fn method(&self) -> Method {
        Method::from_bytes(self.method.as_str().as_bytes()).unwrap()
    }
}

struct StreamSession {
    status: reqwest::StatusCode,
    headers: HeaderMap,
    first_chunk: Bytes,
    stream: UpstreamByteStream,
}

struct RetryLogContext<'a> {
    path: &'a str,
    target_url: &'a str,
    timeout_ms: Option<u64>,
    error: Option<String>,
}

/// Main proxy handler
pub async fn proxy_handler(
    State(state): State<std::sync::Arc<ProxyState>>,
    request: Request,
) -> Response {
    let uri = request.uri().clone();
    let path = uri.path().to_string();
    let method = request.method().clone();
    let target_url = format!("{}{}", state.profile.target_base_url, path);

    let (parts, body) = request.into_parts();
    let body_bytes = match axum::body::to_bytes(body, 100 * 1024 * 1024).await {
        Ok(b) => b,
        Err(e) => {
            let _ = state.log_sender.send(LogEntry {
                timestamp: chrono::Local::now().to_rfc3339(),
                level: "ERROR".to_string(),
                message: format!("Failed to read request body: {}", e),
                details: None,
            });
            return (
                StatusCode::BAD_REQUEST,
                format!("Failed to read body: {}", e),
            )
                .into_response();
        }
    };

    let is_streaming =
        is_streaming_request_by_headers(&parts.headers) || is_streaming_body(&body_bytes);
    let request_template = RequestTemplate::new(parts, body_bytes);

    if is_streaming {
        handle_streaming_request_with_body(state, request_template, target_url, method, path).await
    } else {
        handle_regular_request_with_body(state, request_template, target_url, method, path).await
    }
}

fn is_streaming_request_by_headers(headers: &HeaderMap) -> bool {
    if let Some(accept) = headers.get("accept") {
        if let Ok(accept_str) = accept.to_str() {
            if accept_str.contains("text/event-stream") {
                return true;
            }
        }
    }
    false
}

fn is_streaming_body(body: &[u8]) -> bool {
    let body_str = String::from_utf8_lossy(body);
    body_str.contains("\"stream\":true") || body_str.contains("\"stream\": true")
}

fn truncate_string(s: &str, max_chars: usize) -> String {
    let char_count = s.chars().count();
    if char_count > max_chars {
        if let Some((idx, _)) = s.char_indices().nth(max_chars) {
            format!("{}... (truncated, {} chars total)", &s[..idx], char_count)
        } else {
            s.to_string()
        }
    } else {
        s.to_string()
    }
}

fn format_body(bytes: &[u8], max_len: usize) -> String {
    let s = String::from_utf8_lossy(bytes);
    if let Ok(json) = serde_json::from_str::<serde_json::Value>(&s) {
        let pretty = serde_json::to_string_pretty(&json).unwrap_or_else(|_| s.to_string());
        truncate_string(&pretty, max_len)
    } else {
        truncate_string(&s, max_len)
    }
}

fn timeout_duration(timeout_ms: u64) -> Option<Duration> {
    if timeout_ms > 0 {
        Some(Duration::from_millis(timeout_ms))
    } else {
        None
    }
}

fn create_client() -> Client {
    Client::builder().build().unwrap()
}

fn build_request(
    client: &Client,
    state: &std::sync::Arc<ProxyState>,
    request_template: &RequestTemplate,
    target_url: &str,
) -> reqwest::RequestBuilder {
    let mut req_builder = client.request(request_template.method(), target_url);

    for (name, value) in &request_template.headers {
        if name != "host" && name != "content-length" {
            req_builder = req_builder.header(name, value);
        }
    }

    if let Ok(url) = url::Url::parse(&state.profile.target_base_url) {
        if let Some(host) = url.host_str() {
            req_builder = req_builder.header("host", host);
        }
    }

    req_builder.body(request_template.body_bytes.clone())
}

fn request_headers_for_log(
    request_template: &RequestTemplate,
) -> serde_json::Map<String, serde_json::Value> {
    request_template
        .headers
        .iter()
        .filter_map(|(k, v)| {
            v.to_str()
                .ok()
                .map(|s| (k.to_string(), serde_json::Value::String(s.to_string())))
        })
        .collect()
}

fn response_headers_for_log(headers: &HeaderMap) -> serde_json::Map<String, serde_json::Value> {
    headers
        .iter()
        .filter_map(|(k, v)| {
            v.to_str()
                .ok()
                .map(|s| (k.to_string(), serde_json::Value::String(s.to_string())))
        })
        .collect()
}

fn clone_reqwest_headers(headers: &reqwest::header::HeaderMap) -> HeaderMap {
    let mut result = HeaderMap::new();
    for (name, value) in headers {
        result.append(name, value.clone());
    }
    result
}

fn log_request(
    state: &std::sync::Arc<ProxyState>,
    request_template: &RequestTemplate,
    method: &Method,
    path: &str,
    target_url: &str,
    streaming: bool,
) {
    let message = if streaming {
        format!(">>> {} {} [STREAMING]", method, path)
    } else {
        format!(">>> {} {}", method, path)
    };

    let _ = state.log_sender.send(LogEntry {
        timestamp: chrono::Local::now().to_rfc3339(),
        level: "INFO".to_string(),
        message,
        details: Some(serde_json::json!({
            "type": "request",
            "method": method.to_string(),
            "path": path,
            "target": target_url,
            "headers": request_headers_for_log(request_template),
            "body": format_body(&request_template.body_bytes, 2000),
        })),
    });
}

async fn log_retry(
    state: &std::sync::Arc<ProxyState>,
    reason: RetryReason,
    attempt: u32,
    max_retries: u32,
    context: RetryLogContext<'_>,
) {
    let mut details = serde_json::json!({
        "type": reason.detail_type(),
        "attempt": attempt,
        "maxRetries": max_retries,
        "path": context.path,
        "target": context.target_url,
    });

    if let RetryReason::StatusCode(status) = reason {
        details["status"] = serde_json::json!(status);
    }

    if let Some(timeout_ms) = context.timeout_ms {
        details["timeoutMs"] = serde_json::json!(timeout_ms);
    }

    if let Some(error) = context.error {
        details["error"] = serde_json::json!(error);
    }

    let _ = state.log_sender.send(LogEntry {
        timestamp: chrono::Local::now().to_rfc3339(),
        level: "WARN".to_string(),
        message: format!(
            "Retry {}/{}: {} {}",
            attempt,
            max_retries,
            reason.label(),
            context.target_url
        ),
        details: Some(details),
    });

    state.stats.record_retry();
    tokio::time::sleep(Duration::from_millis(state.profile.retry_delay_ms)).await;
}

async fn log_final_error(state: &std::sync::Arc<ProxyState>, reason: RetryReason, attempt: u32) {
    let _ = state.log_sender.send(LogEntry {
        timestamp: chrono::Local::now().to_rfc3339(),
        level: "ERROR".to_string(),
        message: format!("<<< Request failed: {}", reason.label()),
        details: Some(serde_json::json!({
            "type": "error",
            "reason": reason.detail_type(),
            "attempt": attempt,
        })),
    });
}

async fn send_upstream_request(
    client: &Client,
    state: &std::sync::Arc<ProxyState>,
    request_template: &RequestTemplate,
    target_url: &str,
) -> Result<reqwest::Response, RetryReason> {
    let send_future = build_request(client, state, request_template, target_url).send();

    if let Some(timeout) = timeout_duration(state.profile.first_byte_timeout_ms) {
        match tokio::time::timeout(timeout, send_future).await {
            Ok(Ok(response)) => Ok(response),
            Ok(Err(_)) => Err(RetryReason::TransportError),
            Err(_) => Err(RetryReason::FirstByteTimeout),
        }
    } else {
        send_future.await.map_err(|_| RetryReason::TransportError)
    }
}

async fn read_regular_body(
    response: reqwest::Response,
    full_response_timeout_ms: u64,
) -> Result<Bytes, RetryReason> {
    let body_future = response.bytes();

    if let Some(timeout) = timeout_duration(full_response_timeout_ms) {
        match tokio::time::timeout(timeout, body_future).await {
            Ok(Ok(body)) => Ok(body),
            Ok(Err(_)) => Err(RetryReason::TransportError),
            Err(_) => Err(RetryReason::FullResponseTimeout),
        }
    } else {
        body_future.await.map_err(|_| RetryReason::TransportError)
    }
}

async fn open_stream_session(
    client: &Client,
    state: &std::sync::Arc<ProxyState>,
    request_template: &RequestTemplate,
    target_url: &str,
) -> Result<StreamSession, RetryReason> {
    let response = send_upstream_request(client, state, request_template, target_url).await?;
    let status = response.status();
    let headers = clone_reqwest_headers(response.headers());
    let mut stream = Box::pin(response.bytes_stream()) as UpstreamByteStream;
    let first_chunk_future = stream.next();

    let first_chunk = if let Some(timeout) = timeout_duration(state.profile.first_byte_timeout_ms) {
        match tokio::time::timeout(timeout, first_chunk_future).await {
            Ok(Some(Ok(chunk))) => chunk,
            Ok(Some(Err(_))) | Ok(None) => return Err(RetryReason::TransportError),
            Err(_) => return Err(RetryReason::FirstByteTimeout),
        }
    } else {
        match first_chunk_future.await {
            Some(Ok(chunk)) => chunk,
            Some(Err(_)) | None => return Err(RetryReason::TransportError),
        }
    };

    Ok(StreamSession {
        status,
        headers,
        first_chunk,
        stream,
    })
}

async fn handle_regular_request_with_body(
    state: std::sync::Arc<ProxyState>,
    request_template: RequestTemplate,
    target_url: String,
    method: Method,
    path: String,
) -> Response {
    log_request(
        &state,
        &request_template,
        &method,
        &path,
        &target_url,
        false,
    );

    let client = create_client();
    let max_retries = state.profile.max_retries;
    let mut attempt = 0;

    loop {
        match send_upstream_request(&client, &state, &request_template, &target_url).await {
            Ok(response) => {
                let status = response.status();
                if state.profile.retry_status_codes.contains(&status.as_u16())
                    && attempt < max_retries
                {
                    attempt += 1;
                    log_retry(
                        &state,
                        RetryReason::StatusCode(status.as_u16()),
                        attempt,
                        max_retries,
                        RetryLogContext {
                            path: &path,
                            target_url: &target_url,
                            timeout_ms: None,
                            error: None,
                        },
                    )
                    .await;
                    continue;
                }

                let headers = clone_reqwest_headers(response.headers());
                let header_log = response_headers_for_log(&headers);
                let mut response_builder = Response::builder().status(status);
                for (name, value) in &headers {
                    response_builder = response_builder.header(name, value);
                }

                match read_regular_body(response, state.profile.full_response_timeout_ms).await {
                    Ok(resp_body) => {
                        let _ = state.log_sender.send(LogEntry {
                            timestamp: chrono::Local::now().to_rfc3339(),
                            level: if status.is_success() { "INFO" } else { "WARN" }.to_string(),
                            message: format!("<<< {} {} (attempt {})", status, path, attempt + 1),
                            details: Some(serde_json::json!({
                                "type": "response",
                                "status": status.as_u16(),
                                "headers": header_log,
                                "body": format_body(&resp_body, 2000),
                                "size": resp_body.len(),
                                "attempt": attempt + 1,
                            })),
                        });

                        state.stats.record_success();

                        return response_builder
                            .body(Body::from(resp_body))
                            .unwrap()
                            .into_response();
                    }
                    Err(reason) if attempt < max_retries => {
                        attempt += 1;
                        let timeout_ms = match reason {
                            RetryReason::FullResponseTimeout => {
                                Some(state.profile.full_response_timeout_ms)
                            }
                            _ => None,
                        };
                        log_retry(
                            &state,
                            reason,
                            attempt,
                            max_retries,
                            RetryLogContext {
                                path: &path,
                                target_url: &target_url,
                                timeout_ms,
                                error: None,
                            },
                        )
                        .await;
                    }
                    Err(reason) => {
                        log_final_error(&state, reason, attempt + 1).await;
                        state.stats.record_failure();
                        return (
                            StatusCode::BAD_GATEWAY,
                            format!("Proxy error: {}", reason.label()),
                        )
                            .into_response();
                    }
                }
            }
            Err(reason) if attempt < max_retries => {
                attempt += 1;
                let timeout_ms = match reason {
                    RetryReason::FirstByteTimeout => Some(state.profile.first_byte_timeout_ms),
                    _ => None,
                };
                log_retry(
                    &state,
                    reason,
                    attempt,
                    max_retries,
                    RetryLogContext {
                        path: &path,
                        target_url: &target_url,
                        timeout_ms,
                        error: None,
                    },
                )
                .await;
            }
            Err(reason) => {
                log_final_error(&state, reason, attempt + 1).await;
                state.stats.record_failure();
                return (
                    StatusCode::BAD_GATEWAY,
                    format!("Proxy error: {}", reason.label()),
                )
                    .into_response();
            }
        }
    }
}

async fn handle_streaming_request_with_body(
    state: std::sync::Arc<ProxyState>,
    request_template: RequestTemplate,
    target_url: String,
    method: Method,
    path: String,
) -> Response {
    log_request(&state, &request_template, &method, &path, &target_url, true);

    let client = create_client();
    let max_retries = state.profile.max_retries;
    let mut attempt = 0;

    let initial_session = loop {
        match open_stream_session(&client, &state, &request_template, &target_url).await {
            Ok(session) => break session,
            Err(reason) if attempt < max_retries => {
                attempt += 1;
                let timeout_ms = match reason {
                    RetryReason::FirstByteTimeout => Some(state.profile.first_byte_timeout_ms),
                    _ => None,
                };
                log_retry(
                    &state,
                    reason,
                    attempt,
                    max_retries,
                    RetryLogContext {
                        path: &path,
                        target_url: &target_url,
                        timeout_ms,
                        error: None,
                    },
                )
                .await;
            }
            Err(reason) => {
                let _ = state.log_sender.send(LogEntry {
                    timestamp: chrono::Local::now().to_rfc3339(),
                    level: "ERROR".to_string(),
                    message: format!("Streaming request failed: {}", reason.label()),
                    details: Some(serde_json::json!({
                        "type": "error",
                        "reason": reason.detail_type(),
                        "attempt": attempt + 1,
                    })),
                });
                state.stats.record_failure();
                return (
                    StatusCode::BAD_GATEWAY,
                    format!("Proxy error: {}", reason.label()),
                )
                    .into_response();
            }
        }
    };

    let _ = state.log_sender.send(LogEntry {
        timestamp: chrono::Local::now().to_rfc3339(),
        level: "INFO".to_string(),
        message: format!(
            "<<< {} {} [STREAMING STARTED]",
            initial_session.status, path
        ),
        details: Some(serde_json::json!({
            "type": "streaming_start",
            "status": initial_session.status.as_u16(),
            "attempt": attempt + 1,
        })),
    });

    let mut response_builder = Response::builder().status(initial_session.status);
    for (name, value) in &initial_session.headers {
        response_builder = response_builder.header(name, value);
    }

    let state_for_stream = state.clone();
    let target_for_stream = target_url.clone();
    let path_for_stream = path.clone();
    let request_for_stream = request_template;
    let stream_idle_timeout_ms = state.profile.stream_idle_timeout_ms;

    let (tx, rx) = mpsc::channel::<Result<Bytes, io::Error>>(64);
    tokio::spawn(async move {
        let mut current_stream = initial_session.stream;
        let mut idle_retry_count = 0;

        if tx.send(Ok(initial_session.first_chunk)).await.is_err() {
            return;
        }

        loop {
            let next_chunk = if let Some(timeout) = timeout_duration(stream_idle_timeout_ms) {
                match tokio::time::timeout(timeout, current_stream.next()).await {
                    Ok(chunk) => chunk,
                    Err(_) => {
                        if idle_retry_count >= max_retries {
                            let _ = state_for_stream.log_sender.send(LogEntry {
                                timestamp: chrono::Local::now().to_rfc3339(),
                                level: "ERROR".to_string(),
                                message: format!(
                                    "Streaming request failed: {}",
                                    RetryReason::StreamIdleTimeout.label()
                                ),
                                details: Some(serde_json::json!({
                                    "type": "error",
                                    "reason": RetryReason::StreamIdleTimeout.detail_type(),
                                    "attempt": idle_retry_count + 1,
                                })),
                            });
                            state_for_stream.stats.record_failure();
                            let _ = tx
                                .send(Err(io::Error::new(
                                    io::ErrorKind::TimedOut,
                                    RetryReason::StreamIdleTimeout.label(),
                                )))
                                .await;
                            return;
                        }

                        idle_retry_count += 1;
                        log_retry(
                            &state_for_stream,
                            RetryReason::StreamIdleTimeout,
                            idle_retry_count,
                            max_retries,
                            RetryLogContext {
                                path: &path_for_stream,
                                target_url: &target_for_stream,
                                timeout_ms: Some(stream_idle_timeout_ms),
                                error: None,
                            },
                        )
                        .await;

                        match open_stream_session(
                            &client,
                            &state_for_stream,
                            &request_for_stream,
                            &target_for_stream,
                        )
                        .await
                        {
                            Ok(session) => {
                                if tx.send(Ok(session.first_chunk)).await.is_err() {
                                    return;
                                }
                                current_stream = session.stream;
                                continue;
                            }
                            Err(reason) if idle_retry_count < max_retries => {
                                let timeout_ms = match reason {
                                    RetryReason::FirstByteTimeout => {
                                        Some(state_for_stream.profile.first_byte_timeout_ms)
                                    }
                                    _ => None,
                                };
                                log_retry(
                                    &state_for_stream,
                                    reason,
                                    idle_retry_count,
                                    max_retries,
                                    RetryLogContext {
                                        path: &path_for_stream,
                                        target_url: &target_for_stream,
                                        timeout_ms,
                                        error: None,
                                    },
                                )
                                .await;
                                continue;
                            }
                            Err(reason) => {
                                let _ = state_for_stream.log_sender.send(LogEntry {
                                    timestamp: chrono::Local::now().to_rfc3339(),
                                    level: "ERROR".to_string(),
                                    message: format!(
                                        "Streaming request failed: {}",
                                        reason.label()
                                    ),
                                    details: Some(serde_json::json!({
                                        "type": "error",
                                        "reason": reason.detail_type(),
                                        "attempt": idle_retry_count + 1,
                                    })),
                                });
                                state_for_stream.stats.record_failure();
                                let _ = tx.send(Err(io::Error::other(reason.label()))).await;
                                return;
                            }
                        }
                    }
                }
            } else {
                current_stream.next().await
            };

            match next_chunk {
                Some(Ok(chunk)) => {
                    if tx.send(Ok(chunk)).await.is_err() {
                        return;
                    }
                }
                Some(Err(_)) => {
                    let _ = state_for_stream.log_sender.send(LogEntry {
                        timestamp: chrono::Local::now().to_rfc3339(),
                        level: "ERROR".to_string(),
                        message: format!(
                            "Streaming request failed: {}",
                            RetryReason::TransportError.label()
                        ),
                        details: Some(serde_json::json!({
                            "type": "error",
                            "reason": RetryReason::TransportError.detail_type(),
                        })),
                    });
                    state_for_stream.stats.record_failure();
                    let _ = tx
                        .send(Err(io::Error::other(RetryReason::TransportError.label())))
                        .await;
                    return;
                }
                None => {
                    state_for_stream.stats.record_success();
                    return;
                }
            }
        }
    });

    let output_stream = ReceiverStream::new(rx);

    response_builder
        .body(Body::from_stream(output_stream))
        .unwrap()
        .into_response()
}
