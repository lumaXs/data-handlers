/**
 * Compara duas strings de forma segura contra timing attacks.
 * Sempre leva o mesmo tempo independente de onde a string difere.
 */
export declare function safeCompare(a: string, b: string): boolean;
export type SystemResponseBody = {
    statusCode: number;
    error: string;
    message: string;
    path: string;
    timestamp: string;
};
type SystemResponseFactory = (req: {
    url: string;
}, message?: string) => Response;
export declare const systemResponses: Record<number, SystemResponseFactory>;
export type BunLikeRequest<TUser = unknown> = Request & {
    params: Record<string, string>;
    user: TUser | null;
    /** Faz upgrade para WebSocket. Só funciona em rotas GET. */
    upgrade: (data?: unknown) => Response;
};
export type Middleware<TUser = unknown> = (req: BunLikeRequest<TUser>) => Response | null | Promise<Response | null>;
export type RouteHandler<TUser = unknown> = (req: BunLikeRequest<TUser>) => Response | Promise<Response>;
export type MethodMap<TUser = unknown> = Partial<Record<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', RouteHandler<TUser>>> & {
    middleware?: Middleware<TUser>[];
};
export type Routes<TUser = unknown> = Record<string, RouteHandler<TUser> | MethodMap<TUser>>;
export type RateLimitResult = {
    allowed: boolean;
    limit: number;
    remaining: number;
    reset: number;
    retryAfter?: number;
};
export type LogLevel = 'minimal' | 'standard' | 'verbose';
export type LoggerOptions = {
    /**
     * Nível de detalhe do logger.
     * - `minimal`  — método, path, status e tempo
     * - `standard` — + headers da request (default)
     * - `verbose`  — + body da response (se JSON)
     */
    level?: LogLevel;
    /**
     * Prefixo exibido em cada linha de log.
     * Default: nenhum.
     */
    prefix?: string;
    /**
     * Rotas que não devem ser logadas. Aceita strings exatas ou RegExp.
     * Útil pra suprimir health checks e afins.
     * @example ['/health', /\/metrics/]
     */
    ignore?: Array<string | RegExp>;
    /**
     * Callback customizado — se fornecido, substitui o logger padrão.
     * Recebe todas as informações da requisição e pode fazer qualquer coisa.
     */
    onLog?: (entry: LogEntry) => void;
};
export type LogEntry = {
    method: string;
    pathname: string;
    status: number;
    durationMs: number;
    requestHeaders: Record<string, string>;
    responseBody: string | null;
    timestamp: string;
    ip: string;
};
export type WSContext<TData = unknown> = {
    /** Envia dados para o cliente. */
    send: (data: string | Buffer) => void;
    /** Fecha a conexão. */
    close: (code?: number, reason?: string) => void;
    /** Contexto injetado no upgrade (ex: user autenticado). */
    data: TData;
    readyState: number;
};
export type WSHandlers<TData = unknown> = {
    open?: (ws: WSContext<TData>) => void;
    message?: (ws: WSContext<TData>, data: string | Buffer) => void;
    close?: (ws: WSContext<TData>, code: number, reason: string) => void;
    error?: (ws: WSContext<TData>, err: Error) => void;
    /** Tamanho máximo de payload em bytes. Default: 64KB. */
    maxPayload?: number;
    /** Intervalo de heartbeat em ms. Default: 30s. 0 = desativado. */
    heartbeat?: number;
    /** Origens permitidas. Default: qualquer origem. */
    allowedOrigins?: string[];
};
export type RateLimitOptions = {
    /** Janela de tempo em ms. Default: 60000 (1 min). */
    windowMs?: number;
    /** Máximo de requests por janela. Default: 100. */
    max?: number;
    /** Mensagem customizada no 429. */
    message?: string;
    /**
     * Se true, usa o header X-Forwarded-For pra extrair o IP real.
     * ATENÇÃO: só ative se você confia no proxy. Default: false.
     */
    trustProxy?: boolean;
};
export type AuthFunction<TUser> = (req: BunLikeRequest<TUser>) => TUser | null | Promise<TUser | null>;
export type ListenOptions = {
    port?: number;
    host?: string;
    /**
     * Se true, habilita o logger com nível `standard`.
     * Pode também ser um objeto `LoggerOptions` para controle fino.
     */
    logger?: boolean | LoggerOptions;
    /**
     * Exibe um banner customizado ao iniciar. Se omitido, exibe a URL padrão.
     * Recebe a URL do servidor como argumento.
     */
    banner?: (url: string) => void;
    /**
     * Callback chamado quando o servidor está pronto para receber conexões.
     */
    onReady?: (url: string) => void;
};
export interface ServeOptions<TUser = unknown> {
    port?: number;
    host?: string;
    /**
     * Se true, habilita o logger com nível `standard`.
     * Pode também ser um objeto `LoggerOptions` para controle fino.
     */
    logger?: boolean | LoggerOptions;
    routes?: Routes<TUser>;
    /** Middlewares globais — rodam em toda request, em ordem. */
    middleware?: Middleware<TUser>[];
    /** Fallback quando nenhuma rota casa. */
    fetch?: RouteHandler<TUser>;
    /** Handler de erros não tratados. */
    error?: (err: unknown) => Response | Promise<Response>;
    /** Função de autenticação — injetada como req.user. */
    auth?: AuthFunction<TUser>;
    rateLimit?: RateLimitOptions;
    websocket?: WSHandlers;
}
/**
 * Middleware pronto pra usar: bloqueia requests sem req.user com 401.
 * @example
 * routes: { '/admin': { middleware: [requireAuth], GET: handler } }
 */
export declare function requireAuth<TUser = unknown>(req: BunLikeRequest<TUser>): Response | null;
declare class Server<TUser = unknown> {
    #private;
    constructor({ port, host, logger, routes, middleware, fetch: fallback, error: errorHandler, auth, rateLimit, websocket, }?: ServeOptions<TUser>);
    get url(): URL;
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
    listen(optionsOrCallback?: ListenOptions | (() => void), maybeCallback?: () => void): this;
    stop(): Promise<void>;
}
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
export declare function serve<TUser = unknown>(options?: ServeOptions<TUser>): Server<TUser>;
export {};
//# sourceMappingURL=serve.d.ts.map