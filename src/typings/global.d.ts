declare interface RetryConfig {
  maxRetries: number
  delayMs: number
  retryStatusCodes: number[]
}

declare interface Config {
  localPort: number
  targetBaseUrl: string
  retry: RetryConfig
}
