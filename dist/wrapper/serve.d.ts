export type BunLikeRequest = Request & {
    params: Record<string, string>;
};
export type RouteHandler = (req: BunLikeRequest) => Response | Promise<Response>;
export type MethodMap = Partial<Record<"GET" | "POST" | "PUT" | "PATCH" | "DELETE", RouteHandler>>;
export type Routes = Record<string, RouteHandler | MethodMap>;
export interface ServeOptions {
    port?: number;
    routes?: Routes;
    fetch?: RouteHandler;
    error?: (err: unknown) => Response | Promise<Response>;
}
declare class Server {
    #private;
    constructor({ port, routes, fetch: fallback, error: errorHandler }?: ServeOptions);
    get url(): URL;
    listen(): this;
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
 *   routes: {
 *     '/users': {
 *       GET:  (req) => Response.json(users),
 *       POST: async (req) => {
 *         const body = await req.json()
 *         return Response.json(body, { status: 201 })
 *       }
 *     },
 *     '/users/:id': {
 *       GET: (req) => Response.json({ id: req.params.id })
 *     }
 *   },
 *   error: (err) => Response.json({ error: (err as Error).message }, { status: 500 })
 * })
 */
export declare function serve(options?: ServeOptions): Server;
export {};
//# sourceMappingURL=serve.d.ts.map