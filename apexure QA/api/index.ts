import express, { type Request, type Response, type NextFunction } from 'express';
import { registerRoutes } from '../routes';

const app = express();

app.use(
  express.json({
    limit: '50mb',
    verify: (req: any, _res, buf) => { req.rawBody = buf; },
  })
);
app.use(express.urlencoded({ limit: '50mb', extended: false }));

// Health check
app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    await registerRoutes(app);
    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || 'Internal Server Error';
      console.error('[API Error]', err.stack || err);
      res.status(status).json({ message });
    });
    initialized = true;
  }
}

export default async function handler(req: Request, res: Response) {
  await ensureInitialized();
  return app(req, res);
}
