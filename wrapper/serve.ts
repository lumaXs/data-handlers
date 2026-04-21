import http from 'http'
import crypto from 'crypto'

// ─── Utilitários de segurança ──────────────────────────────────────────────────

/**
 * Compara duas strings de forma segura contra timing attacks.
 * Sempre leva o mesmo tempo independente de onde a string difere.
 */
export function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) {
    // Executa a comparação mesmo assim pra não vazar o tamanho via timing
    crypto.timingSafeEqual(bufA, bufA)
    return false
  }
  return crypto.timingSafeEqual(bufA, bufB)
}

// ─── System Responses ─────────────────────────────────────────────────────────

export type SystemResponseBody = {
  statusCode: number
  error: string
  message: string
  path: string
  timestamp: string
}

type SystemResponseFactory = (
  req: { url: string },
  message?: string,
) => Response

export const systemResponses: Record<number, SystemResponseFactory> = {
  400: (req, message = 'Invalid request body') =>
    Response.json(
      {
        statusCode: 400,
        error: 'Bad Request',
        message,
        path: new URL(req.url).pathname,
        timestamp: new Date().toISOString(),
      } satisfies SystemResponseBody,
      { status: 400 },
    ),

  401: (req, message = 'Access not allowed') =>
    Response.json(
      {
        statusCode: 401,
        error: 'Unauthorized',
        message,
        path: new URL(req.url).pathname,
        timestamp: new Date().toISOString(),
      } satisfies SystemResponseBody,
      { status: 401 },
    ),

  403: (req, message = 'Forbidden') =>
    Response.json(
      {
        statusCode: 403,
        error: 'Forbidden',
        message,
        path: new URL(req.url).pathname,
        timestamp: new Date().toISOString(),
      } satisfies SystemResponseBody,
      { status: 403 },
    ),

  404: (req, message = 'Not Found') =>
    Response.json(
      {
        statusCode: 404,
        error: 'Not Found',
        message,
        path: new URL(req.url).pathname,
        timestamp: new Date().toISOString(),
      } satisfies SystemResponseBody,
      { status: 404 },
    ),

  405: (req, message = 'Method Not Allowed') =>
    Response.json(
      {
        statusCode: 405,
        error: 'Method Not Allowed',
        message,
        path: new URL(req.url).pathname,
        timestamp: new Date().toISOString(),
      } satisfies SystemResponseBody,
      { status: 405 },
    ),

  429: (req, message = 'Too Many Requests') =>
    Response.json(
      {
        statusCode: 429,
        error: 'Too Many Requests',
        message,
        path: new URL(req.url).pathname,
        timestamp: new Date().toISOString(),
      } satisfies SystemResponseBody,
      { status: 429 },
    ),

  500: (req, message = 'Internal Server Error') =>
    Response.json(
      {
        statusCode: 500,
        error: 'Internal Server Error',
        message,
        path: new URL(req.url).pathname,
        timestamp: new Date().toISOString(),
      } satisfies SystemResponseBody,
      { status: 500 },
    ),
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type BunLikeRequest<TUser = unknown> = Request & {
  params: Record<string, string>
  user: TUser | null
  /** Faz upgrade para WebSocket. Só funciona em rotas GET. */
  upgrade: (data?: unknown) => Response
}

export type Middleware<TUser = unknown> = (
  req: BunLikeRequest<TUser>,
) => Response | null | Promise<Response | null>

export type RouteHandler<TUser = unknown> = (
  req: BunLikeRequest<TUser>,
) => Response | Promise<Response>

export type MethodMap<TUser = unknown> = Partial<
  Record<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', RouteHandler<TUser>>
> & {
  middleware?: Middleware<TUser>[]
}

export type Routes<TUser = unknown> = Record<
  string,
  RouteHandler<TUser> | MethodMap<TUser>
>

export type RateLimitResult = {
  allowed: boolean
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

// ─── Logger ───────────────────────────────────────────────────────────────────

export type LogLevel = 'minimal' | 'standard' | 'verbose'

export type LoggerOptions = {
  /**
   * Nível de detalhe do logger.
   * - `minimal`  — método, path, status e tempo
   * - `standard` — + headers da request (default)
   * - `verbose`  — + body da response (se JSON)
   */
  level?: LogLevel
  /**
   * Prefixo exibido em cada linha de log.
   * Default: nenhum.
   */
  prefix?: string
  /**
   * Rotas que não devem ser logadas. Aceita strings exatas ou RegExp.
   * Útil pra suprimir health checks e afins.
   * @example ['/health', /\/metrics/]
   */
  ignore?: Array<string | RegExp>
  /**
   * Callback customizado — se fornecido, substitui o logger padrão.
   * Recebe todas as informações da requisição e pode fazer qualquer coisa.
   */
  onLog?: (entry: LogEntry) => void
}

export type LogEntry = {
  method: string
  pathname: string
  status: number
  durationMs: number
  requestHeaders: Record<string, string>
  responseBody: string | null
  timestamp: string
  ip: string
}

// ─── WebSocket ───────────────────────────────────────────────────────────────

export type WSContext<TData = unknown> = {
  /** Envia dados para o cliente. */
  send: (data: string | Buffer) => void
  /** Fecha a conexão. */
  close: (code?: number, reason?: string) => void
  /** Contexto injetado no upgrade (ex: user autenticado). */
  data: TData
  readyState: number
}

export type WSHandlers<TData = unknown> = {
  open?: (ws: WSContext<TData>) => void
  message?: (ws: WSContext<TData>, data: string | Buffer) => void
  close?: (ws: WSContext<TData>, code: number, reason: string) => void
  error?: (ws: WSContext<TData>, err: Error) => void
  /** Tamanho máximo de payload em bytes. Default: 64KB. */
  maxPayload?: number
  /** Intervalo de heartbeat em ms. Default: 30s. 0 = desativado. */
  heartbeat?: number
  /** Origens permitidas. Default: qualquer origem. */
  allowedOrigins?: string[]
}

// ─── Rate Limit ───────────────────────────────────────────────────────────────

export type RateLimitOptions = {
  /** Janela de tempo em ms. Default: 60000 (1 min). */
  windowMs?: number
  /** Máximo de requests por janela. Default: 100. */
  max?: number
  /** Mensagem customizada no 429. */
  message?: string
  /**
   * Se true, usa o header X-Forwarded-For pra extrair o IP real.
   * ATENÇÃO: só ative se você confia no proxy. Default: false.
   */
  trustProxy?: boolean
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type AuthFunction<TUser> = (
  req: BunLikeRequest<TUser>,
) => TUser | null | Promise<TUser | null>

// ─── Listen Options ───────────────────────────────────────────────────────────

export type ListenOptions = {
  port?: number
  host?: string
  /**
   * Se true, habilita o logger com nível `standard`.
   * Pode também ser um objeto `LoggerOptions` para controle fino.
   */
  logger?: boolean | LoggerOptions
  /**
   * Exibe um banner customizado ao iniciar. Se omitido, exibe a URL padrão.
   * Recebe a URL do servidor como argumento.
   */
  banner?: (url: string) => void
  /**
   * Callback chamado quando o servidor está pronto para receber conexões.
   */
  onReady?: (url: string) => void
}

// ─── Serve Options ────────────────────────────────────────────────────────────

export interface ServeOptions<TUser = unknown> {
  port?: number
  host?: string
  /**
   * Se true, habilita o logger com nível `standard`.
   * Pode também ser um objeto `LoggerOptions` para controle fino.
   */
  logger?: boolean | LoggerOptions
  routes?: Routes<TUser>
  /** Middlewares globais — rodam em toda request, em ordem. */
  middleware?: Middleware<TUser>[]
  /** Fallback quando nenhuma rota casa. */
  fetch?: RouteHandler<TUser>
  /** Handler de erros não tratados. */
  error?: (err: unknown) => Response | Promise<Response>
  /** Função de autenticação — injetada como req.user. */
  auth?: AuthFunction<TUser>
  rateLimit?: RateLimitOptions
  websocket?: WSHandlers
}

// ─── Internal ─────────────────────────────────────────────────────────────────

interface ParsedRoute<TUser> {
  path: string
  regex: RegExp
  keys: string[]
  dynamic: boolean
  handler: RouteHandler<TUser> | MethodMap<TUser>
}

interface RateLimitEntry {
  timestamps: number[]
}

// ─── Middleware helpers ────────────────────────────────────────────────────────

/**
 * Middleware pronto pra usar: bloqueia requests sem req.user com 401.
 * @example
 * routes: { '/admin': { middleware: [requireAuth], GET: handler } }
 */
export function requireAuth<TUser = unknown>(
  req: BunLikeRequest<TUser>,
): Response | null {
  if (!req.user) return systemResponses[401]!(req)
  return null
}

// ─── Logger helpers ───────────────────────────────────────────────────────────

const ANSI = {
  reset: '\x1b[0m',
  dim: '\x1b[90m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  bold: '\x1b[1m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
} as const

function statusColor(status: number): string {
  if (status >= 500) return ANSI.red
  if (status >= 400) return ANSI.yellow
  if (status >= 300) return ANSI.cyan
  return ANSI.green
}

function methodColor(method: string): string {
  switch (method) {
    case 'GET':
      return ANSI.green
    case 'POST':
      return ANSI.cyan
    case 'PUT':
      return ANSI.yellow
    case 'PATCH':
      return ANSI.magenta
    case 'DELETE':
      return ANSI.red
    default:
      return ANSI.dim
  }
}

function formatDuration(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function isIgnored(pathname: string, ignore: Array<string | RegExp>): boolean {
  return ignore.some(pattern =>
    typeof pattern === 'string' ? pattern === pathname : pattern.test(pathname),
  )
}

async function runLogger(entry: LogEntry, opts: LoggerOptions): Promise<void> {
  const level = opts.level ?? 'standard'

  if (opts.onLog) {
    opts.onLog(entry)
    return
  }

  const prefix = opts.prefix ? `${ANSI.dim}[${opts.prefix}]${ANSI.reset} ` : ''
  const ts = `${ANSI.dim}${entry.timestamp}${ANSI.reset}`
  const method = `${methodColor(entry.method)}${entry.method.padEnd(7)}${ANSI.reset}`
  const path = entry.pathname
  const status = `${statusColor(entry.status)}${ANSI.bold}${entry.status}${ANSI.reset}`
  const dur = `${ANSI.dim}${formatDuration(entry.durationMs)}${ANSI.reset}`
  const ip = `${ANSI.dim}${entry.ip}${ANSI.reset}`

  // linha principal — sempre exibida
  console.info(
    `${prefix}${ts} ${method} ${path} ${ANSI.dim}→${ANSI.reset} ${status} ${dur} ${ip}`,
  )

  if (level === 'minimal') return

  // standard: headers da request
  if (level === 'standard' || level === 'verbose') {
    const headers = entry.requestHeaders
    const relevant: Record<string, string> = {}
    const keep = [
      'content-type',
      'authorization',
      'accept',
      'user-agent',
      'x-request-id',
      'x-forwarded-for',
      'origin',
      'referer',
    ]
    for (const k of keep) {
      if (headers[k]) relevant[k] = headers[k]!
    }
    if (Object.keys(relevant).length > 0) {
      console.info(
        `${ANSI.dim}  headers ${JSON.stringify(relevant)}${ANSI.reset}`,
      )
    }
  }

  // verbose: body da response (se JSON)
  if (level === 'verbose' && entry.responseBody) {
    try {
      const parsed = JSON.parse(entry.responseBody)
      console.info(
        `${ANSI.dim}  body    ${JSON.stringify(parsed)}${ANSI.reset}`,
      )
    } catch {
      // não é JSON, ignora
    }
  }
}

// ─── Server ───────────────────────────────────────────────────────────────────

class Server<TUser = unknown> {
  #port: number
  #host: string
  #loggerOpts: LoggerOptions | null
  #routes: ParsedRoute<TUser>[]
  #globalMiddleware: Middleware<TUser>[]
  #fallback: RouteHandler<TUser> | undefined
  #errorHandler: ((err: unknown) => Response | Promise<Response>) | undefined
  #auth: AuthFunction<TUser> | undefined
  #rateLimitOptions: Required<RateLimitOptions> | undefined
  #rateLimitStore: Map<string, RateLimitEntry>
  #wsHandlers: WSHandlers | undefined
  #server: http.Server

  constructor({
    port = 3000,
    host = '0.0.0.0',
    logger = false,
    routes = {},
    middleware = [],
    fetch: fallback,
    error: errorHandler,
    auth,
    rateLimit,
    websocket,
  }: ServeOptions<TUser> = {}) {
    this.#port = port
    this.#host = host
    this.#loggerOpts = this.#resolveLogger(logger)
    this.#routes = this.#buildRouter(routes)
    this.#globalMiddleware = middleware
    this.#fallback = fallback
    this.#errorHandler = errorHandler
    this.#auth = auth
    this.#rateLimitOptions = rateLimit
      ? {
          windowMs: rateLimit.windowMs ?? 60_000,
          max: rateLimit.max ?? 100,
          message: rateLimit.message ?? 'Too Many Requests',
          trustProxy: rateLimit.trustProxy ?? false,
        }
      : undefined
    this.#rateLimitStore = new Map()
    this.#wsHandlers = websocket
    this.#server = this.#createServer()
  }

  // ── Logger resolver ─────────────────────────────────────────────────────────

  #resolveLogger(logger: boolean | LoggerOptions): LoggerOptions | null {
    if (logger === false) return null
    if (logger === true) return { level: 'standard' }
    return logger
  }

  // ── Roteamento ──────────────────────────────────────────────────────────────

  #parseRoute(path: string): { regex: RegExp; keys: string[] } {
    const keys: string[] = []
    const pattern = path
      .replace(/\/\*/g, '(?:/.*)?')
      .replace(/:([a-zA-Z_]+)/g, (_, key: string) => {
        keys.push(key)
        return '([^/]+)'
      })
    return { regex: new RegExp(`^${pattern}$`), keys }
  }

  #buildRouter(routes: Routes<TUser>): ParsedRoute<TUser>[] {
    return Object.entries(routes)
      .map(([path, handler]) => ({
        path,
        dynamic: path.includes(':') || path.includes('*'),
        ...this.#parseRoute(path),
        handler,
      }))
      .sort((a, b) => Number(a.dynamic) - Number(b.dynamic))
  }

  #extractParams(
    match: RegExpMatchArray,
    keys: string[],
  ): Record<string, string> {
    return keys.reduce<Record<string, string>>((acc, key, i) => {
      acc[key] = match[i + 1]!
      return acc
    }, {})
  }

  // ── Rate Limit (Sliding Window) ─────────────────────────────────────────────

  #extractIp(nodeReq: http.IncomingMessage): string {
    if (this.#rateLimitOptions?.trustProxy) {
      const forwarded = nodeReq.headers['x-forwarded-for']
      if (forwarded) {
        const ip = Array.isArray(forwarded)
          ? forwarded[0]
          : forwarded.split(',')[0]
        if (ip) return ip.trim()
      }
    }
    return nodeReq.socket.remoteAddress ?? 'unknown'
  }

  #checkRateLimit(ip: string): RateLimitResult {
    const opts = this.#rateLimitOptions!
    const now = Date.now()
    const windowStart = now - opts.windowMs

    const entry = this.#rateLimitStore.get(ip) ?? { timestamps: [] }

    entry.timestamps = entry.timestamps.filter(t => t > windowStart)

    const remaining = Math.max(0, opts.max - entry.timestamps.length)
    const oldestTimestamp = entry.timestamps[0]
    const reset = oldestTimestamp
      ? Math.ceil((oldestTimestamp + opts.windowMs) / 1000)
      : Math.ceil((now + opts.windowMs) / 1000)

    if (entry.timestamps.length >= opts.max) {
      this.#rateLimitStore.set(ip, entry)
      return {
        allowed: false,
        limit: opts.max,
        remaining: 0,
        reset,
        retryAfter: Math.ceil((oldestTimestamp! + opts.windowMs - now) / 1000),
      }
    }

    entry.timestamps.push(now)
    this.#rateLimitStore.set(ip, entry)

    return { allowed: true, limit: opts.max, remaining: remaining - 1, reset }
  }

  #applyRateLimitHeaders(
    nodeRes: http.ServerResponse,
    info: RateLimitResult,
  ): void {
    nodeRes.setHeader('X-RateLimit-Limit', info.limit)
    nodeRes.setHeader('X-RateLimit-Remaining', info.remaining)
    nodeRes.setHeader('X-RateLimit-Reset', info.reset)
    if (info.retryAfter !== undefined) {
      nodeRes.setHeader('Retry-After', info.retryAfter)
    }
  }

  // ── Middleware Chain ────────────────────────────────────────────────────────

  async #runMiddlewareChain(
    middlewares: Middleware<TUser>[],
    req: BunLikeRequest<TUser>,
  ): Promise<Response | null> {
    for (const mw of middlewares) {
      const result = await mw(req)
      if (result !== null) return result
    }
    return null
  }

  // ── I/O ────────────────────────────────────────────────────────────────────

  #readBody(nodeReq: http.IncomingMessage, limit = 1e6): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      let size = 0

      nodeReq.on('data', (chunk: Buffer) => {
        size += chunk.length
        if (size > limit) {
          reject(new Error('Payload too large'))
          nodeReq.destroy()
          return
        }
        chunks.push(chunk)
      })

      nodeReq.on('end', () => resolve(Buffer.concat(chunks)))
    })
  }

  async #sendResponse(
    nodeRes: http.ServerResponse,
    response: Response,
  ): Promise<void> {
    const headers: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      headers[key] = value
    })
    nodeRes.writeHead(response.status, headers)
    const body = await response.arrayBuffer()
    nodeRes.end(Buffer.from(body))
  }

  // ── WebSocket ───────────────────────────────────────────────────────────────

  #handleWebSocketUpgrade(
    nodeReq: http.IncomingMessage,
    socket: import('net').Socket,
    head: Buffer,
    upgradeData: unknown,
  ): void {
    const handlers = this.#wsHandlers!
    const maxPayload = handlers.maxPayload ?? 64 * 1024
    const heartbeatInterval = handlers.heartbeat ?? 30_000

    // ── Handshake ────────────────────────────────────────────────────────────
    const key = nodeReq.headers['sec-websocket-key']
    if (!key) {
      socket.destroy()
      return
    }

    const acceptKey = crypto
      .createHash('sha1')
      .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
      .digest('base64')

    socket.write(
      'HTTP/1.1 101 Switching Protocols\r\n' +
        'Upgrade: websocket\r\n' +
        'Connection: Upgrade\r\n' +
        `Sec-WebSocket-Accept: ${acceptKey}\r\n` +
        '\r\n',
    )

    // ── Contexto da conexão ──────────────────────────────────────────────────
    const ws: WSContext<unknown> = {
      data: upgradeData,
      readyState: 1,
      send(data) {
        if (ws.readyState !== 1 || !socket.writable) return
        const payload = Buffer.isBuffer(data) ? data : Buffer.from(data)
        const frame = encodeWSFrame(
          payload,
          typeof data === 'string' ? 0x1 : 0x2,
        )
        try {
          socket.write(frame)
        } catch {
          /* socket destruído */
        }
      },
      close(code = 1000, reason = '') {
        if (ws.readyState !== 1 || !socket.writable) return
        ws.readyState = 2
        const payload = Buffer.alloc(2 + Buffer.byteLength(reason))
        payload.writeUInt16BE(code, 0)
        Buffer.from(reason).copy(payload, 2)
        try {
          socket.write(encodeWSFrame(payload, 0x8))
        } catch {
          /* socket destruído */
        }
        socket.end()
      },
    }

    handlers.open?.(ws)

    // ── Heartbeat ────────────────────────────────────────────────────────────
    let heartbeatTimer: NodeJS.Timeout | undefined
    let missedPong = false

    if (heartbeatInterval > 0) {
      heartbeatTimer = setInterval(() => {
        if (missedPong) {
          ws.readyState = 3
          socket.destroy()
          return
        }
        missedPong = true
        if (socket.writable) {
          try {
            socket.write(encodeWSFrame(Buffer.alloc(0), 0x9))
          } catch {
            /* socket destruído */
          }
        }
      }, heartbeatInterval)
    }

    // ── Parser de frames ─────────────────────────────────────────────────────
    let buffer = Buffer.alloc(0)

    socket.on('data', (chunk: Buffer) => {
      buffer = Buffer.concat([buffer, chunk])

      while (buffer.length >= 2) {
        const firstByte = buffer[0]!
        const secondByte = buffer[1]!

        const opcode = firstByte & 0x0f
        const masked = (secondByte & 0x80) !== 0
        let payloadLength = secondByte & 0x7f
        let headerLength = 2

        if (payloadLength === 126) {
          if (buffer.length < 4) return
          payloadLength = buffer.readUInt16BE(2)
          headerLength = 4
        } else if (payloadLength === 127) {
          if (buffer.length < 10) return
          payloadLength = buffer.readUInt32BE(6)
          headerLength = 10
        }

        if (payloadLength > maxPayload) {
          handlers.error?.(
            ws,
            new Error(`Payload excede o limite de ${maxPayload} bytes`),
          )
          ws.close(1009, 'Message too big')
          return
        }

        const maskLength = masked ? 4 : 0
        const totalLength = headerLength + maskLength + payloadLength
        if (buffer.length < totalLength) return

        const maskKey = masked
          ? buffer.slice(headerLength, headerLength + 4)
          : null
        let payload = buffer.slice(headerLength + maskLength, totalLength)

        if (masked && maskKey) {
          payload = Buffer.from(payload)
          for (let i = 0; i < payload.length; i++) {
            payload[i] = payload[i]! ^ maskKey[i % 4]!
          }
        }

        buffer = buffer.slice(totalLength)

        switch (opcode) {
          case 0x1:
            handlers.message?.(ws, payload.toString('utf8'))
            break
          case 0x2:
            handlers.message?.(ws, payload)
            break
          case 0x8: {
            const code = payload.length >= 2 ? payload.readUInt16BE(0) : 1000
            const reason = payload.length > 2 ? payload.slice(2).toString() : ''
            ws.readyState = 3
            clearInterval(heartbeatTimer)
            handlers.close?.(ws, code, reason)
            socket.end()
            break
          }
          case 0x9:
            if (socket.writable) {
              try {
                socket.write(encodeWSFrame(payload, 0xa))
              } catch {
                /* socket destruído */
              }
            }
            break
          case 0xa:
            missedPong = false
            break
        }
      }
    })

    socket.on('error', err => {
      clearInterval(heartbeatTimer)
      ws.readyState = 3
      handlers.error?.(ws, err)
    })

    socket.on('close', () => {
      clearInterval(heartbeatTimer)
      if (ws.readyState !== 3) {
        ws.readyState = 3
        handlers.close?.(ws, 1006, 'Connection lost')
      }
    })
  }

  // ── Request Handler ─────────────────────────────────────────────────────────

  #createServer(): http.Server {
    const server = http.createServer(
      async (nodeReq: http.IncomingMessage, nodeRes: http.ServerResponse) => {
        const start = Date.now()
        const host = nodeReq.headers.host ?? 'localhost'
        const url = `http://${host}${nodeReq.url}`
        const method = nodeReq.method!.toUpperCase()
        const pathname = new URL(url).pathname
        const ip = nodeReq.socket.remoteAddress ?? 'unknown'

        // ── Logger helper local ────────────────────────────────────────────
        const log = async (response: Response): Promise<void> => {
          if (!this.#loggerOpts) return
          if (
            this.#loggerOpts.ignore &&
            isIgnored(pathname, this.#loggerOpts.ignore)
          )
            return

          const durationMs = Date.now() - start

          const requestHeaders: Record<string, string> = {}
          nodeReq.headers &&
            Object.entries(nodeReq.headers).forEach(([k, v]) => {
              if (typeof v === 'string') requestHeaders[k] = v
              else if (Array.isArray(v)) requestHeaders[k] = v.join(', ')
            })

          let responseBody: string | null = null
          const level = this.#loggerOpts.level ?? 'standard'
          if (level === 'verbose') {
            try {
              responseBody = await response.clone().text()
            } catch {
              responseBody = null
            }
          }

          const entry: LogEntry = {
            method,
            pathname,
            status: response.status,
            durationMs,
            requestHeaders,
            responseBody,
            timestamp: new Date().toISOString(),
            ip,
          }

          await runLogger(entry, this.#loggerOpts!)
        }

        try {
          // ── Rate Limit ───────────────────────────────────────────────────
          if (this.#rateLimitOptions) {
            const rl = this.#checkRateLimit(ip)
            this.#applyRateLimitHeaders(nodeRes, rl)

            if (!rl.allowed) {
              const res = systemResponses[429]!(
                { url },
                this.#rateLimitOptions.message,
              )
              await this.#sendResponse(nodeRes, res)
              await log(res)
              return
            }
          }

          // ── Body ─────────────────────────────────────────────────────────
          const bodyBuffer = await this.#readBody(nodeReq)
          const hasBody =
            !['GET', 'HEAD'].includes(method) && bodyBuffer.length > 0
          const init: RequestInit = {
            method,
            headers: nodeReq.headers as HeadersInit,
          }
          if (hasBody) init.body = new Uint8Array(bodyBuffer)

          // ── Request object ────────────────────────────────────────────────
          let upgradeData: unknown = undefined
          let upgradeRequested = false

          const request = new Request(url, init) as BunLikeRequest<TUser>
          request.params = {}
          request.user = null

          request.upgrade = (data?: unknown): Response => {
            upgradeData = data
            upgradeRequested = true
            return new Response(null, { status: 200 })
          }

          // ── Auth ──────────────────────────────────────────────────────────
          if (this.#auth) {
            request.user = await this.#auth(request)
          }

          // ── Global Middlewares ─────────────────────────────────────────────
          const globalResult = await this.#runMiddlewareChain(
            this.#globalMiddleware,
            request,
          )
          if (globalResult) {
            await this.#sendResponse(nodeRes, globalResult)
            await log(globalResult)
            return
          }

          // ── Routing ───────────────────────────────────────────────────────
          let response: Response | null = null

          for (const route of this.#routes) {
            const match = pathname.match(route.regex)
            if (!match) continue

            request.params = this.#extractParams(match, route.keys)
            const { handler } = route

            if (typeof handler === 'object') {
              const routeMiddleware = handler.middleware ?? []
              const routeResult = await this.#runMiddlewareChain(
                routeMiddleware,
                request,
              )
              if (routeResult) {
                await this.#sendResponse(nodeRes, routeResult)
                await log(routeResult)
                return
              }

              const methodHandler = (handler as MethodMap<TUser>)[
                method as keyof MethodMap<TUser>
              ]

              if (typeof methodHandler === 'function') {
                response = await methodHandler(request)
              } else {
                response = systemResponses[405]!(request)
              }

              break
            }

            response = await handler(request)
            break
          }

          // ── WebSocket Upgrade ─────────────────────────────────────────────
          if (upgradeRequested) return

          // ── Fallback ──────────────────────────────────────────────────────
          if (!response && this.#fallback)
            response = await this.#fallback(request)
          response ??= systemResponses[404]!(request)

          await this.#sendResponse(nodeRes, response)
          await log(response)
        } catch (err) {
          try {
            const errResponse =
              (await this.#errorHandler?.(err)) ??
              systemResponses[500]!({
                url: `http://${nodeReq.headers.host ?? 'localhost'}${nodeReq.url}`,
              })
            await this.#sendResponse(nodeRes, errResponse)
            await log(errResponse)
          } catch {
            nodeRes.writeHead(500)
            nodeRes.end('Internal Server Error')
          }
        }
      },
    )

    // ── WebSocket upgrade event ───────────────────────────────────────────────
    if (this.#wsHandlers) {
      server.on(
        'upgrade',
        async (
          nodeReq: http.IncomingMessage,
          socket: import('net').Socket,
          head: Buffer,
        ) => {
          try {
            const allowedOrigins = this.#wsHandlers!.allowedOrigins
            if (allowedOrigins && allowedOrigins.length > 0) {
              const origin = nodeReq.headers['origin'] ?? ''
              if (!allowedOrigins.includes(origin)) {
                socket.write('HTTP/1.1 403 Forbidden\r\n\r\n')
                socket.destroy()
                return
              }
            }

            if (this.#rateLimitOptions) {
              const ip = this.#extractIp(nodeReq)
              const rl = this.#checkRateLimit(ip)
              if (!rl.allowed) {
                socket.write('HTTP/1.1 429 Too Many Requests\r\n\r\n')
                socket.destroy()
                return
              }
            }

            const host = nodeReq.headers.host ?? 'localhost'
            const url = `http://${host}${nodeReq.url}`
            const pathname = new URL(url).pathname

            const request = new Request(url, {
              method: 'GET',
              headers: nodeReq.headers as HeadersInit,
            }) as BunLikeRequest<TUser>

            request.params = {}
            request.user = null

            let upgradeData: unknown = undefined
            request.upgrade = (data?: unknown): Response => {
              upgradeData = data
              return new Response(null, { status: 200 })
            }

            if (this.#auth) {
              request.user = await this.#auth(request)
            }

            const globalResult = await this.#runMiddlewareChain(
              this.#globalMiddleware,
              request,
            )
            if (globalResult) {
              socket.write(`HTTP/1.1 ${globalResult.status} Error\r\n\r\n`)
              socket.destroy()
              return
            }

            let routed = false

            for (const route of this.#routes) {
              const match = pathname.match(route.regex)
              if (!match) continue

              request.params = this.#extractParams(match, route.keys)
              const { handler } = route
              routed = true

              if (typeof handler === 'object') {
                const routeMiddleware = handler.middleware ?? []
                const routeResult = await this.#runMiddlewareChain(
                  routeMiddleware,
                  request,
                )
                if (routeResult) {
                  socket.write(`HTTP/1.1 ${routeResult.status} Error\r\n\r\n`)
                  socket.destroy()
                  return
                }

                const getHandler = (handler as MethodMap<TUser>)['GET']
                if (typeof getHandler === 'function') {
                  await getHandler(request)
                }
              } else {
                await handler(request)
              }

              break
            }

            if (!routed) {
              socket.write('HTTP/1.1 404 Not Found\r\n\r\n')
              socket.destroy()
              return
            }

            this.#handleWebSocketUpgrade(nodeReq, socket, head, upgradeData)
          } catch (err) {
            console.error('[WS upgrade error]', err)
            try {
              socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n')
            } catch {
              /* já destruído */
            }
            socket.destroy()
          }
        },
      )
    }

    return server
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  get url(): URL {
    return new URL(`http://localhost:${this.#port}`)
  }

  /**
   * Inicia o servidor.
   *
   * Aceita três formas de chamada:
   * ```ts
   * server.listen()
   * server.listen(() => console.log('ready'))
   * server.listen({ port: 4000, host: '127.0.0.1', logger: true }, () => console.log('ready'))
   * server.listen({ port: 4000, banner: (url) => console.log(`up at ${url}`) })
   * ```
   */
  listen(
    optionsOrCallback?: ListenOptions | (() => void),
    maybeCallback?: () => void,
  ): this {
    let port = this.#port
    let host = this.#host
    let logger = this.#loggerOpts
    let banner: ((url: string) => void) | undefined
    let onReady: ((url: string) => void) | undefined
    let callback: (() => void) | undefined

    if (typeof optionsOrCallback === 'function') {
      callback = optionsOrCallback
    } else if (
      typeof optionsOrCallback === 'object' &&
      optionsOrCallback !== null
    ) {
      port = optionsOrCallback.port ?? port
      host = optionsOrCallback.host ?? host
      logger =
        optionsOrCallback.logger !== undefined
          ? this.#resolveLogger(optionsOrCallback.logger)
          : logger
      banner = optionsOrCallback.banner
      onReady = optionsOrCallback.onReady
      if (typeof maybeCallback === 'function') callback = maybeCallback
    }

    this.#port = port
    this.#host = host
    this.#loggerOpts = logger

    this.#server.listen(this.#port, this.#host, () => {
      const href = `http://${this.#host}:${this.#port}`

      if (banner) {
        banner(href)
      } else if (this.#loggerOpts) {
        console.info(
          `${ANSI.dim}server${ANSI.reset} ${ANSI.cyan}${href}${ANSI.reset}`,
        )
      }

      onReady?.(href)
      callback?.()
    })

    return this
  }

  stop(): Promise<void> {
    return new Promise((resolve, reject) =>
      this.#server.close((err?: Error) => (err ? reject(err) : resolve())),
    )
  }
}

// ─── WebSocket frame encoder ──────────────────────────────────────────────────

function encodeWSFrame(payload: Buffer, opcode: number): Buffer {
  const length = payload.length
  let header: Buffer

  if (length < 126) {
    header = Buffer.alloc(2)
    header[0] = 0x80 | opcode
    header[1] = length
  } else if (length < 65536) {
    header = Buffer.alloc(4)
    header[0] = 0x80 | opcode
    header[1] = 126
    header.writeUInt16BE(length, 2)
  } else {
    header = Buffer.alloc(10)
    header[0] = 0x80 | opcode
    header[1] = 127
    header.writeUInt32BE(0, 2)
    header.writeUInt32BE(length, 6)
  }

  return Buffer.concat([header, payload])
}

// ─── Export ───────────────────────────────────────────────────────────────────

/**
 * Cria e inicia um servidor HTTP com roteamento estilo Bun.
 * Compatível com Node.js >= 18 (usa Web APIs: Request, Response, URL).
 *
 * @example
 * import { serve } from 'data-handlers/serve'
 *
 * serve({
 *   port: 3000,
 *   logger: { level: 'verbose', prefix: 'api', ignore: ['/health'] },
 *   auth: async (req) => {
 *     const token = req.headers.get('authorization')?.replace('Bearer ', '')
 *     return token ? verifyToken(token) : null
 *   },
 *   rateLimit: { windowMs: 60_000, max: 100 },
 *   routes: {
 *     '/users': {
 *       GET:  (req) => Response.json(users),
 *       POST: async (req) => {
 *         const body = await req.json()
 *         return Response.json(body, { status: 201 })
 *       }
 *     },
 *     '/admin': {
 *       middleware: [requireAuth],
 *       GET: (req) => Response.json({ user: req.user })
 *     },
 *     '/chat': {
 *       GET: (req) => req.upgrade({ user: req.user })
 *     }
 *   },
 *   websocket: {
 *     allowedOrigins: ['https://meusite.com'],
 *     maxPayload: 64 * 1024,
 *     heartbeat: 30_000,
 *     open:    (ws) => console.log('conectou:', ws.data),
 *     message: (ws, data) => ws.send(`eco: ${data}`),
 *     close:   (ws, code) => console.log('desconectou:', code),
 *   },
 *   error: (err) => Response.json({ error: (err as Error).message }, { status: 500 })
 * }).listen({
 *   banner: (url) => console.log(`running at ${url}`),
 *   onReady: (url) => setupHealthCheck(url),
 * })
 */
export function serve<TUser = unknown>(
  options?: ServeOptions<TUser>,
): Server<TUser> {
  return new Server(options)
}
