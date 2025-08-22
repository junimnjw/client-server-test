import { getSdkInstalledPath } from '../../core/sdk-path';
import { Router } from 'express';

const router = Router();

router.get('/sdk-path', (req, res) => {
  const sdkPath = getSdkInstalledPath();
  if (sdkPath === null) {
    return res.status(404).json({
      status: 'error',
      message: 'SDK installed path is null'
    });
  }
  res.status(200).json({
    status: 'success',
    sdkPath: sdkPath
  });
});

export default router;
