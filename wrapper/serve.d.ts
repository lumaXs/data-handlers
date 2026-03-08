export type ServeRequest = Request & { params: Record<string, string> }

export type RouteHandler = (req: ServeRequest) => Response | Promise<Response>

export type MethodMap = {
   GET?: RouteHandler
   POST?: RouteHandler
   PUT?: RouteHandler
   PATCH?: RouteHandler
   DELETE?: RouteHandler
}

export interface ServeOptions {
   port?: number
   routes?: Record<string, RouteHandler | MethodMap>
   fetch?: (req: ServeRequest) => Response | Promise<Response>
   error?: (err: unknown) => Response | Promise<Response>
}

export declare function serve(options?: ServeOptions): import('http').Server

