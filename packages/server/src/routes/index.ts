// server/src/routes/index.ts
import { Express } from 'express';
import healthRouter from './health-routes';
import projectRouter from './v1/project-routes';
import projectOptionRoutes from './v1/project-options-routes';
import certificateManagerRoutes from './v1/certificate-manager-routes';
import deviceManagerRoutes from './v1/device-manager-routes';
import emulatorManagerRoutes from './v1/emulator-manger-routes';
import sdkPathRoutes from './v1/sdk-path-routes';
import updateRoutes from './v1/update-routes';
import sdkInitRoutes from './v1/sdk-init-routes';
import pkgListRoutes from './v1/pkg-list-manager-routes';

export default function registerRoutes(app: Express) {
  app.use('/', healthRouter);
  app.use('/api/v1', projectRouter);
  app.use('/api/v1', projectOptionRoutes);
  app.use('/api/v1', certificateManagerRoutes);
  app.use('/api/v1', deviceManagerRoutes);
  app.use('/api/v1', emulatorManagerRoutes);
  app.use('/v1', deviceManagerRoutes);  // Add this line for backward compatibility
  app.use('/api/v1', sdkPathRoutes);
  app.use('/api/v1', updateRoutes);
  app.use('/api/v1', sdkInitRoutes);
  app.use('/api/v1/', pkgListRoutes);
}
