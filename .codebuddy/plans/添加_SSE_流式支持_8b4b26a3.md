---
name: 添加 SSE 流式支持
overview: 参考 llm-route 项目的 SSE 流式实现，为 retry-model-request 项目添加流式请求支持，包括流式请求检测、流式响应转发和流式错误处理。
todos:
  - id: add-streaming-detection
    content: 添加 isStreamingRequest 函数检测流式请求
    status: completed
  - id: add-streaming-forward
    content: 添加 forwardStreamingRequest 函数实现流式转发
    status: completed
  - id: modify-main-handler
    content: 修改主请求处理逻辑，集成流式支持
    status: completed
    dependencies:
      - add-streaming-detection
      - add-streaming-forward
  - id: run-lint
    content: 执行 npm run lint 检查代码质量
    status: completed
    dependencies:
      - modify-main-handler
---

## 产品概述

为 retry-model-request 反向代理服务添加 SSE 流式支持，使其能够正确处理 LLM API 的流式响应请求。

## 核心功能

- 检测流式请求（通过 Accept 头或请求体中的 stream 字段）
- 流式转发上游响应到客户端
- 流式请求的日志记录
- 保持现有非流式请求的重试功能不变

## 技术栈

- 框架: Express.js (Node.js)
- HTTP 客户端: Axios (支持 stream 响应类型)
- 语言: TypeScript

## 实现方案

### 流式请求检测

参考 llm-route 的 `_is_streaming_request` 方法，检测两种情况：

1. `Accept` 请求头包含 `text/event-stream`
2. 请求体 JSON 中 `stream` 字段为 `true`

### 流式响应转发

使用 Axios 的 `responseType: 'stream'` 配置获取流式响应，通过 Express 的 `res.write()` 逐块转发到客户端。

### 关键技术点

1. **响应头设置**: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
2. **流式传输**: 使用 Node.js Stream API 进行数据管道传输
3. **错误处理**: 流式传输开始后无法重试，记录错误日志
4. **日志记录**: 收集完整响应体用于日志（可选，大响应时跳过）

### 架构设计

```
请求进入 → 流式检测 → 是 → 流式转发（无重试）
                    → 否 → 普通代理（支持重试）
```

## 目录结构

```
retry-model-request/
└── src/
    └── main.ts  # [MODIFY] 添加流式支持
        - isStreamingRequest(): 检测流式请求
        - forwardStreamingRequest(): 流式转发处理
        - 修改 app.all() 主处理逻辑
```

## 实现注意事项

- 流式请求不支持重试：一旦开始传输数据，无法回滚
- 使用 `pipeline()` 或事件监听处理流数据，确保正确处理背压
- 保持与现有代码风格一致，复用现有的 logger 和配置