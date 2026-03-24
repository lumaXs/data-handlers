import http from "http";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BunLikeRequest = Request & { params: Record<string, string> };

export type RouteHandler = (req: BunLikeRequest) => Response | Promise<Response>;

export type MethodMap = Partial<Record<"GET" | "POST" | "PUT" | "PATCH" | "DELETE", RouteHandler>>;

export type Routes = Record<string, RouteHandler | MethodMap>;

export interface ServeOptions {
  port?: number;
  routes?: Routes;
  fetch?: RouteHandler;
  error?: (err: unknown) => Response | Promise<Response>;
}

// ─── Internal ─────────────────────────────────────────────────────────────────

interface ParsedRoute {
  path: string;
  regex: RegExp;
  keys: string[];
  dynamic: boolean;
  handler: RouteHandler | MethodMap;
}

// ─── Server ───────────────────────────────────────────────────────────────────

class Server {
  #port: number;
  #routes: ParsedRoute[];
  #fallback: RouteHandler | undefined;
  #errorHandler: ((err: unknown) => Response | Promise<Response>) | undefined;
  #server: http.Server;

  constructor({ port = 3000, routes = {}, fetch: fallback, error: errorHandler }: ServeOptions = {}) {
    this.#port = port;
    this.#routes = this.#buildRouter(routes);
    this.#fallback = fallback;
    this.#errorHandler = errorHandler;
    this.#server = this.#createServer();
  }

  #parseRoute(path: string): { regex: RegExp; keys: string[] } {
    const keys: string[] = [];
    const pattern = path
      .replace(/\/\*/g, "(?:/.*)?")
      .replace(/:([a-zA-Z_]+)/g, (_, key: string) => {
        keys.push(key);
        return "([^/]+)";
      });
    return { regex: new RegExp(`^${pattern}$`), keys };
  }

  #buildRouter(routes: Routes): ParsedRoute[] {
    return Object.entries(routes)
      .map(([path, handler]) => ({
        path,
        dynamic: path.includes(":") || path.includes("*"),
        ...this.#parseRoute(path),
        handler,
      }))
      .sort((a, b) => Number(a.dynamic) - Number(b.dynamic));
  }

  #extractParams(match: RegExpMatchArray, keys: string[]): Record<string, string> {
    return keys.reduce<Record<string, string>>((acc, key, i) => {
      acc[key] = match[i + 1]!;
      return acc;
    }, {});
  }

  #readBody(nodeReq: http.IncomingMessage, limit = 1e6): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let size = 0;

      nodeReq.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > limit) {
          reject(new Error("Payload too large"));
          nodeReq.destroy();
          return;
        }
        chunks.push(chunk);
      });

      nodeReq.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }

  async #sendResponse(nodeRes: http.ServerResponse, response: Response): Promise<void> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => { headers[key] = value; });
    nodeRes.writeHead(response.status, headers);
    const body = await response.arrayBuffer();
    nodeRes.end(Buffer.from(body));
  }

  #createServer(): http.Server {
    return http.createServer(async (nodeReq: http.IncomingMessage, nodeRes: http.ServerResponse) => {
      try {
        const host = nodeReq.headers.host ?? "localhost";
        const url = `http://${host}${nodeReq.url}`;
        const method = nodeReq.method!.toUpperCase();
        const pathname = new URL(url).pathname;

        const bodyBuffer = await this.#readBody(nodeReq);

        const hasBody = !["GET", "HEAD"].includes(method) && bodyBuffer.length > 0;
        const init: RequestInit = {
          method,
          headers: nodeReq.headers as HeadersInit,
        };

        if (hasBody) {
          init.body = new Uint8Array(bodyBuffer);
        }

        const request = new Request(url, init) as BunLikeRequest;

        request.params = {};

        let response: Response | null = null;

        for (const route of this.#routes) {
          const match = pathname.match(route.regex);
          if (!match) continue;

          request.params = this.#extractParams(match, route.keys);
          const { handler } = route;

          if (typeof handler === "object") {
            const methodHandler = (handler as MethodMap)[method as keyof MethodMap];
            response = methodHandler
              ? await methodHandler(request)
              : new Response("Method Not Allowed", { status: 405 });
            break;
          }

          response = await handler(request);
          break;
        }

        if (!response && this.#fallback) response = await this.#fallback(request);
        if (!response) response = new Response("Not Found", { status: 404 });

        await this.#sendResponse(nodeRes, response);
      } catch (err) {
        if (this.#errorHandler) {
          try {
            await this.#sendResponse(nodeRes, await this.#errorHandler(err));
          } catch {
            nodeRes.writeHead(500);
            nodeRes.end("Internal Server Error");
          }
        } else {
          nodeRes.writeHead(500);
          nodeRes.end("Internal Server Error");
        }
      }
    });
  }

  get url(): URL {
    return new URL(`http://localhost:${this.#port}`);
  }

  listen(): this {
    this.#server.listen(this.#port, () =>
      console.log(`Rodando em http://localhost:${this.#port}`)
    );
    return this;
  }

  stop(): Promise<void> {
    return new Promise((resolve, reject) =>
      this.#server.close((err?: Error) => (err ? reject(err) : resolve()))
    );
  }
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
export function serve(options?: ServeOptions): Server {
  return new Server(options).listen();
}

