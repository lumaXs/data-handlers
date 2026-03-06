export interface ServeOptions {
   port?: number
   routes?: Record<string, RouteHandler | MethodMap>
   fetch?: (req: Request) => Response | Promise<Response>
   error?: (err: unknown) => Response | Promise<Response>
}

export type RouteHandler = (req: Request & { params: Record<string, string> }) => Response | Promise<Response>

export type MethodMap = {
   GET?: RouteHandler
   POST?: RouteHandler
   PUT?: RouteHandler
   PATCH?: RouteHandler
   DELETE?: RouteHandler
}

export declare function serve(options?: ServeOptions): import('http').Server
