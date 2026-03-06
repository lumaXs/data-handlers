import http from "http";

/**
 * @param {string} path
 * @returns {{ regex: RegExp, keys: string[] }}
 */
function parseRoute(path) {
   const keys = [];
   const pattern = path
      .replace(/\/\*/g, "(?:/.*)?")
      .replace(/:([a-zA-Z_]+)/g, (_, key) => {
         keys.push(key);
         return "([^/]+)";
      });
   return { regex: new RegExp(`^${pattern}$`), keys };
}

/**
 * @param {Record<string, unknown>} routes
 * @returns {Array<{ path: string, regex: RegExp, keys: string[], handler: unknown }>}
 */
function buildRouter(routes) {
   return Object.entries(routes).map(([path, handler]) => ({
      path,
      ...parseRoute(path),
      handler,
   }));
}

/**
 * @param {RegExpMatchArray} match
 * @param {string[]} keys
 * @returns {Record<string, string>}
 */
function extractParams(match, keys) {
   return keys.reduce((acc, key, i) => {
      acc[key] = match[i + 1];
      return acc;
   }, {});
}

/**
 * @param {import('http').IncomingMessage} nodeReq
 * @returns {Promise<Buffer>}
 */
function readBody(nodeReq) {
   return new Promise((resolve) => {
      const chunks = [];
      nodeReq.on("data", (chunk) => chunks.push(chunk));
      nodeReq.on("end", () => resolve(Buffer.concat(chunks)));
   });
}

/**
 * @param {import('http').ServerResponse} nodeRes
 * @param {Response} response
 * @returns {Promise<void>}
 */
async function sendResponse(nodeRes, response) {
   nodeRes.writeHead(response.status, Object.fromEntries(response.headers));
   const body = await response.arrayBuffer();
   nodeRes.end(Buffer.from(body));
}

/**
 * Cria e inicia um servidor HTTP com roteamento estilo Bun.
 * Compatível com Node.js >= 18 (usa Web APIs: Request, Response, URL).
 *
 * @param {{
 *   port?:   number,
 *   routes?: Record<string, RouteHandler | MethodMap>,
 *   fetch?:  (req: Request) => Response | Promise<Response>,
 *   error?:  (err: unknown) => Response | Promise<Response>,
 * }} [options]
 * @returns {import('http').Server}
 *
 * @typedef {(req: Request & { params: Record<string, string> }) => Response | Promise<Response>} RouteHandler
 * @typedef {{ GET?: RouteHandler, POST?: RouteHandler, PUT?: RouteHandler, PATCH?: RouteHandler, DELETE?: RouteHandler }} MethodMap
 *
 * @example
 * import { serve } from 'data-handlers/serve'
 * import { schema } from 'data-handlers'
 *
 * const userSchema = schema({ name: 'name', email: 'email', cpf: 'cpf' })
 *
 * serve({
 *   port: 3000,
 *   routes: {
 *     '/': () => Response.json({ message: 'ok' }),
 *     '/users': {
 *       GET:  (req) => Response.json(users),
 *       POST: async (req) => {
 *         const body = userSchema.safeParse(await req.json())
 *         if (!body.success) return Response.json(body.errors, { status: 400 })
 *         return Response.json(body.data, { status: 201 })
 *       }
 *     },
 *     '/users/:id': {
 *       GET: (req) => Response.json(users.find(u => u.id === req.params.id))
 *     }
 *   },
 *   error: (err) => Response.json({ error: err.message }, { status: 500 })
 * })
 */
export function serve({ port = 3000, routes = {}, fetch: fallback, error: errorHandler } = {}) {
   const router = buildRouter(routes);

   const server = http.createServer(async (nodeReq, nodeRes) => {
      try {
         const host = nodeReq.headers.host ?? "localhost";
         const url = `http://${host}${nodeReq.url}`;
         const method = nodeReq.method.toUpperCase();
         const pathname = new URL(url).pathname;

         const bodyBuffer = await readBody(nodeReq);

         const request = new Request(url, {
            method,
            headers: nodeReq.headers,
            body: ["GET", "HEAD"].includes(method) ? undefined : bodyBuffer,
         });

         let response = null;

         for (const route of router) {
            const match = pathname.match(route.regex);
            if (!match) continue;

            const params = extractParams(match, route.keys);
            request.params = params;

            const handler = route.handler;

            if (typeof handler === "object" && !Array.isArray(handler)) {
               const methodHandler = handler[method];
               response = methodHandler
                  ? await methodHandler(request)
                  : new Response("Method Not Allowed", { status: 405 });
               break;
            }

            if (typeof handler === "function") {
               response = await handler(request);
               break;
            }
         }

         if (!response && fallback) response = await fallback(request);
         if (!response) response = new Response("Not Found", { status: 404 });

         await sendResponse(nodeRes, response);
      } catch (err) {
         if (errorHandler) {
            try {
               await sendResponse(nodeRes, await errorHandler(err));
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

   server.url = new URL(`http://localhost:${port}`);
   server.listen(port, () => console.log(`Rodando em http://localhost:${port}`));

   return server;
}

