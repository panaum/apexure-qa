import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import fs from "fs";

process.on('uncaughtException', (err) => {
  fs.appendFileSync('error_stack.txt', `\n\n[${new Date().toISOString()}] UNCAUGHT EXCEPTION:\n${err.stack}\n`);
  console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason: any) => {
  const stack = reason instanceof Error ? reason.stack : String(reason);
  fs.appendFileSync('error_stack.txt', `\n\n[${new Date().toISOString()}] UNHANDLED REJECTION:\n${stack}\n`);
  console.error('UNHANDLED REJECTION:', reason);
});

console.log('[STARTUP] PUPPETEER_EXECUTABLE_PATH:', process.env.PUPPETEER_EXECUTABLE_PATH);

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: '50mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ limit: '50mb', extended: false }));
app.use(cors());

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });
  next();
});

(async () => {
  // Health check endpoint — responds before any middleware can fail
  app.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  await registerRoutes(app).catch(err => { console.error('[STARTUP] registerRoutes failed:', err); process.exit(1); });


  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    const stack = err.stack || String(err);
    fs.appendFileSync('error_stack.txt', `\n\n[${new Date().toISOString()}] EXPRESS ERROR:\n${stack}\n`);
    console.error('Express error stack:', stack);

    res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    // Log whether dist/public exists and what it contains
    const path = await import("path");
    const { fileURLToPath } = await import("url");
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.default.dirname(__filename);
    const distPath = path.default.resolve(__dirname, "dist", "public");
    console.log(`[STARTUP] distPath: ${distPath}`);
    console.log(`[STARTUP] dist/public exists: ${fs.existsSync(distPath)}`);
    if (fs.existsSync(distPath)) {
      console.log(`[STARTUP] dist/public contents: ${fs.readdirSync(distPath).join(', ')}`);
      const indexPath = path.default.resolve(distPath, "index.html");
      console.log(`[STARTUP] index.html exists: ${fs.existsSync(indexPath)}`);
    }
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite-server");;
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  // Bind to 0.0.0.0 — Railway routes traffic over IPv4.
  // "::" (IPv6) can fail on containers where net.ipv6.bindv6only=1
  httpServer.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port} (0.0.0.0)`);
  });
})();