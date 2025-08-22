import { ProjectCreator } from '../../features/project-manager/project-creator';
import { Router } from 'express';

const router: Router = Router();

/**
 * @openapi
 * /v1/project-options/app-types:
 *   get:
 *     summary: Get list of supported application types
 *     tags:
 *       - Project Options
 *     responses:
 *       200:
 *         description: List of available app types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       500:
 *         description: Failed to retrieve app types
 */
router.get('/project-options/app-types', (req, res) => {
  try {
    const appTypes = ProjectCreator.getAppTypeList();
    res.json(appTypes); // ex: ['web', 'native', 'dotnet']
  } catch (err) {
    console.error('[GET /project-options/app-types]', err);
    res.status(500).json({ error: 'Failed to retrieve app types' });
  }
});

/**
 * @openapi
 * /v1/project-options/platform-versions:
 *   get:
 *     summary: Get list of supported platform versions
 *     tags:
 *       - Project Options
 *     responses:
 *       200:
 *         description: List of platform versions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       500:
 *         description: Failed to retrieve platform versions
 */
router.get('/project-options/platform-versions', (req, res) => {
  try {
    const { appType } = req.query;

    if (typeof appType !== 'string') {
      res.status(400).json({
        status: 'error',
        errorCode: 'INVALID_PARAMETERS',
        message: 'Missing or invalid appType',
      });
      return;
    }

    //    let versions: string[];

    switch (appType) {
      case 'native':
      case 'dotnet':
      case 'web':
        const versions = ProjectCreator.getAvailablePlatformVersionList(appType);
        res.json(versions);
        break;
      default:
        res.status(400).json({
          status: 'error',
          errorCode: 'UNSUPPORTED_APP_TYPE',
          message: `Unsupported appType: ${appType}`,
        });
        return;
    }
  } catch (err) {
    console.error('[GET /project-options/platform-versions]', err);
    res.status(500).json({ error: 'Failed to retrieve platform versions' });
  }
});

/**
 * @openapi
 * /v1/project-options/templates:
 *   get:
 *     summary: Get available templates based on appType, deviceType, and platformVersion
 *     tags:
 *       - Project Options
 *     parameters:
 *       - name: appType
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *       - name: platformVersion
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of matching templates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       400:
 *         description: Missing or invalid query parameters
 *       500:
 *         description: Failed to retrieve template list
 */
router.get('/project-options/templates', (req, res) => {
  try {
    const { appType, profile, platformVersion } = req.query;
    if (
      typeof appType !== 'string' ||
      typeof profile !== 'string' ||
      typeof platformVersion !== 'string'
    ) {
      res.status(400).json({
        status: 'error',
        errorCode: 'INVALID_PARAMETERS',
        message: 'Given Params are missing or invalid types',
      });
      return;
    }

    const templates = ProjectCreator.getAvailableTemplateList(appType, profile, platformVersion);
    res.json(templates);
  } catch (err) {
    console.error('[GET /project-options/templates]', err);
    res.status(500).json({ error: 'Failed to retrieve template list' });
  }
});

export default router;
