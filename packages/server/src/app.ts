// packages/server/src/app.ts
import express from 'express';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import registerRoutes from './routes';
import { swaggerOptions } from './config/swagger-config';
import { errorHandler } from './shared/error-handler';

const app = express();

// Swagger setup
const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Middleware & Routes
app.use(express.json());
registerRoutes(app);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
