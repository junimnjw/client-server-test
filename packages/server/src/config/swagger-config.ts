import { Options } from 'swagger-jsdoc';

/**
 * Swagger configuration options
 */
export const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tizen Extension Server API',
      version: '1.0.0',
      description: 'API documentation for Tizen Extension Server',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/**/*.ts'], // Path to the API docs
};


