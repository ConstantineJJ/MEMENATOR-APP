import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { proxyExternalImage } from './server/imageProxy';
import { registerCompositionRoute } from './server/routes/composition';
import { registerEnglishMagicCaptionRoute } from './server/routes/magicCaptionEnglish';
import { registerMagicCaptionRoute } from './server/routes/magicCaption';
import { registerWebMemeRoutes } from './server/routes/webMemes';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  app.get('/api/proxy-image', proxyExternalImage);
  registerWebMemeRoutes(app);
  // English requests are handled first. Other languages fall through to the
  // existing Russian route, keeping the established RU behavior unchanged.
  registerEnglishMagicCaptionRoute(app);
  registerMagicCaptionRoute(app);
  registerCompositionRoute(app);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
