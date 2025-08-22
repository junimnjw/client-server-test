import { Router } from 'express';
import { getSdkInitStartResult } from '../../core/sdk-init-status';

const router = Router();

router.get('/sdk-init', (req, res) => {
  const result = getSdkInitStartResult();
  res.json({
    status: result === true ? 'completed' : 'pending',
    result,
  });
});

export default router;
