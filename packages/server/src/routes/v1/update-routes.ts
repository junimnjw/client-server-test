import { Router } from 'express';
import { UpdateInstallerApi } from '../../features/package-manager/export-apis/update/update-installer-api';
import { createApiError, ErrorCodes } from '../../shared/error-types';

const router = Router();

/**
 * @swagger
 * /api/v1/available-update:
 *   get:
 *     summary: Check for available SDK updates
 *     description: Checks if there are any available updates for the Tizen SDK
 *     tags:
 *       - SDK Updates
 *     responses:
 *       200:
 *         description: Update check completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 updateAvailable:
 *                   type: number
 *                   description: Number of available updates
 *                   example: 2
 *       500:
 *         description: Update check failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               updateCheckFailed:
 *                 summary: Update check error
 *                 value:
 *                   code: "E_UPDATE_CHECK_FAILED"
 *                   type: "network"
 *                   userMessageKey: "error.update.check_failed"
 *                   timestamp: "2024-01-01T00:00:00.000Z"
 */
router.get('/available-update', (req, res) => {
  try {
    const updateAvailable = UpdateInstallerApi.getUpdate();
    res.json({ updateAvailable });
  } catch (error) {
    console.error('Error checking for updates:', error);
    const apiError = createApiError(
      ErrorCodes.UPDATE_CHECK_FAILED,
      'network',
      'error.update.check_failed',
      { originalError: error instanceof Error ? error.message : String(error) }
    );
    res.status(500).json({ error: apiError });
  }
});

/**
 * @swagger
 * /api/v1/update:
 *   post:
 *     summary: Install SDK updates
 *     description: Installs available updates for the Tizen SDK based on the current installation status
 *     tags:
 *       - SDK Updates
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: No request body required for update installation
 *     responses:
 *       200:
 *         description: Update installation completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   description: Installation result status
 *                   example: "success"
 *                   enum: ["success", "error"]
 *                 message:
 *                   type: string
 *                   description: Detailed result message
 *                   example: "Successfully updating sdk"
 *       500:
 *         description: Update installation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               updateInstallFailed:
 *                 summary: Update installation error
 *                 value:
 *                   code: "E_UPDATE_INSTALL_FAILED"
 *                   type: "internal"
 *                   userMessageKey: "error.update.install_failed"
 *                   timestamp: "2024-01-01T00:00:00.000Z"
 */
router.post('/update', async (req, res) => {
  try {
    const updateInstaller = new UpdateInstallerApi();
    const result = await updateInstaller.update();
    res.status(200).json({
      status: result.success ? 'success' : 'error',
      message: result.message,
    });
  } catch (error) {
    console.error('Error during SDK update installation:', error);
    const apiError = createApiError(
      ErrorCodes.UPDATE_INSTALL_FAILED,
      'internal',
      'error.update.install_failed',
      {
        originalError: error instanceof Error ? error.message : String(error),
        operation: 'update_installation',
      }
    );
    res.status(500).json({ error: apiError });
  }
});

export default router;
