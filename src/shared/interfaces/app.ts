import express from 'express';
import cors from 'cors';
import devicesRouter from '../../devices/interfaces/devices.controller';
import zonesRouter from '../../zones/interfaces/zones.controller';
import healthRouter from './health.controller';
import { setupSwagger } from './swagger';
import { logger } from '../utils/logger';
import { env } from '../config/environment';

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info('request', { method: req.method, path: req.path });
  next();
});

// Mount swagger UI (API documentation)
try {
  setupSwagger(app);
  const baseUrl = `http://localhost:${env.PORT}`;
  logger.info(`Swagger UI set up at ${baseUrl}/api-docs`);
} catch (error) {
  logger.error('Failed to set up Swagger UI', { err: String(error) });
}

const edgeRouter = express.Router();
edgeRouter.use('/devices', devicesRouter);
edgeRouter.use('/zones', zonesRouter);
edgeRouter.use('/health', healthRouter);

app.use('/edge', edgeRouter);

export default app;
