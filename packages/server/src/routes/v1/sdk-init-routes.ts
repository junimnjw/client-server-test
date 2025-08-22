import { Router } from 'express';
import { startSdkInitialization } from '../../core/sdk-init-status';
import { createApiError, ErrorCodes } from '../../shared/error-types';

const router = Router();

/**
 * @swagger
 * /api/v1/sdk-init:
 *   post:
 *     summary: Initialize Tizen SDK
 *     description: Initializes the Tizen SDK and checks if all required components are properly installed
 *     tags:
 *       - SDK Management
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: No request body required for SDK initialization
 *     responses:
 *       200:
 *         description: SDK initialization completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   description: Initialization status
 *                   example: "initialized"
 *       500:
 *         description: SDK initialization failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               sdkInitFailed:
 *                 summary: SDK initialization error
 *                 value:
 *                   code: "E_SDK_INIT_FAILED"
 *                   type: "internal"
 *                   userMessageKey: "error.sdk.init_failed"
 *                   timestamp: "2024-01-01T00:00:00.000Z"
 */
router.post('/sdk-init', async (req, res) => {
  try {
    const result = await startSdkInitialization();
    res.json({
      status: result,
    });
  } catch (error) {
    console.error('Error during SDK initialization:', error);
    const apiError = createApiError(
      ErrorCodes.SDK_INIT_FAILED,
      'internal',
      'error.sdk.init_failed',
      {
        originalError: error instanceof Error ? error.message : String(error),
        operation: 'sdk_initialization',
      }
    );
    res.status(500).json({ error: apiError });
  }
});

export default router;
