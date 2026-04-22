import express, { type Request, type Response } from 'express'
import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { CONFIG } from '#scripts/ConstantUtils.ts'
import { logger } from '#scripts/LogUtils.ts'

const app = express()
app.use(express.json({ limit: '100mb' }))
app.use(express.urlencoded({ limit: '100mb', extended: true }))

const wait = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const shouldRetry = (
  status: number | undefined,
  errorCode: string | undefined,
  retryConfig: RetryConfig
): boolean => {
  if (status && retryConfig.retryStatusCodes.includes(status)) return true
  if (errorCode === 'ECONNREFUSED' || errorCode === 'ETIMEDOUT') return true
  return false
}

/**
 * 检测是否为流式请求
 * @param headers 请求头
 * @param body 请求体
 * @returns 是否为流式请求
 */
const isStreamingRequest = (headers: Record<string, unknown>, body: unknown): boolean => {
  // 检查 Accept 头是否包含 text/event-stream
  const accept = headers['accept'] as string | undefined
  if (accept && accept.includes('text/event-stream')) {
    return true
  }

  // 检查请求体中 stream 字段是否为 true
  if (body && typeof body === 'object' && 'stream' in body) {
    if ((body as Record<string, unknown>).stream === true) {
      return true
    }
  }

  return false
}

/**
 * 转发流式请求
 * @param req Express 请求对象
 * @param res Express 响应对象
 * @param targetUrl 目标 URL
 */
const forwardStreamingRequest = async (
  req: Request,
  res: Response,
  targetUrl: string
): Promise<void> => {
  const startTime = Date.now()

  try {
    const requestConfig: AxiosRequestConfig = {
      method: req.method as AxiosRequestConfig['method'],
      url: targetUrl,
      data: req.body,
      headers: {
        ...req.headers,
        host: new URL(CONFIG.targetBaseUrl).host,
      },
      timeout: 60000,
      responseType: 'stream',
      validateStatus: () => true,
    }

    logger.info(`📤 流式请求 | ${targetUrl}`)
    logger.info(`   Method: ${requestConfig.method?.toUpperCase()}`)
    logger.info(`   Body: ${JSON.stringify(requestConfig.data, null, 2)}`)

    const response = await axios(requestConfig)

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    // 设置响应状态码
    res.status(response.status)

    // 流式转发响应数据
    const stream = response.data
    stream.on('data', (chunk: Buffer) => {
      res.write(chunk)
    })

    stream.on('end', () => {
      const elapsedMs = Date.now() - startTime
      logger.info(`✅ 流式请求完成 | ${targetUrl} | ${response.status} | ${elapsedMs}ms`)
      res.end()
    })

    stream.on('error', (err: Error) => {
      const elapsedMs = Date.now() - startTime
      logger.error(`❌ 流式传输错误 | ${targetUrl} | ${elapsedMs}ms | ${err.message}`)
      res.end()
    })
  } catch (err: unknown) {
    const elapsedMs = Date.now() - startTime
    const axiosError = err as { response?: { status?: number; data?: unknown }; code?: string }
    const status = axiosError.response?.status || 500

    logger.error(`❌ 流式请求失败 | ${targetUrl} | ${status} | ${elapsedMs}ms`)
    res.status(status).send(axiosError.response?.data || '流式请求失败')
  }
}

app.all('{*path}', async (req: Request, res: Response) => {
  const path = req.originalUrl
  const targetUrl = `${CONFIG.targetBaseUrl}${path}`

  // 检测是否为流式请求
  if (isStreamingRequest(req.headers, req.body)) {
    logger.info(`🌊 检测到流式请求 | ${targetUrl}`)
    return forwardStreamingRequest(req, res, targetUrl)
  }

  // 普通请求处理（支持重试）
  let attempt = 0

  while (attempt <= CONFIG.retry.maxRetries) {
    try {
      const requestConfig: AxiosRequestConfig = {
        method: req.method as AxiosRequestConfig['method'],
        url: targetUrl,
        data: req.body,
        headers: {
          ...req.headers,
          host: new URL(CONFIG.targetBaseUrl).host,
        },
        timeout: 60000,
        validateStatus: () => true,
      }

      logger.info(`📤 请求参数 | 第${attempt + 1}次 | ${targetUrl}`)
      logger.info(`   Method: ${requestConfig.method?.toUpperCase()}`)
      logger.info(`   Body: ${JSON.stringify(requestConfig.data, null, 2)}`)

      const response: AxiosResponse = await axios(requestConfig)

      logger.info(`📥 响应数据 | 第${attempt + 1}次 | ${targetUrl}`)
      logger.info(`   Status: ${response.status}`)
      logger.info(`   Data: ${JSON.stringify(response.data, null, 2)}`)
      logger.info(`✅ 请求成功 | 第${attempt + 1}次 | ${targetUrl}`)
      return res.status(response.status).send(response.data)
    } catch (err: unknown) {
      attempt++
      const axiosError = err as { response?: { status?: number; data?: unknown }; code?: string }
      const status = axiosError.response?.status
      const errorCode = axiosError.code

      if (!shouldRetry(status, errorCode, CONFIG.retry) || attempt > CONFIG.retry.maxRetries) {
        logger.error(`失败终止 | 状态: ${status || errorCode} | ${targetUrl}`)
        return res.status(status || 500).send(axiosError.response?.data || '服务请求失败')
      }

      logger.warn(`重试中 | 第${attempt}/${CONFIG.retry.maxRetries}次 | ${targetUrl}`)
      await wait(CONFIG.retry.delayMs)
    }
  }
})

app.listen(CONFIG.localPort, () => {
  logger.info(`🚀 TypeScript 本地代理服务已启动`)
  logger.info(`👉 本地地址：http://localhost:${CONFIG.localPort}`)
  logger.info(`🎯 目标接口：${CONFIG.targetBaseUrl}`)
  logger.info(`🔁 最大重试：${CONFIG.retry.maxRetries} 次`)
})
