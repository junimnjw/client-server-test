import { buildProject } from '../../features/project-manager/usecases/build-project';
import { createProject } from '../../features/project-manager/usecases/create-project';
import { runProject } from '../../features/project-manager/usecases/run-project';
import { Router } from 'express';

const router: Router = Router();

/**
 * @openapi
 * /project:
 *   post:
 *     summary: Create a new project
 *     description: Creates a new Tizen project using the provided parameters.
 *     tags:
 *       - Project
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectName
 *               - appType
 *               - template
 *               - platformVersion
 *               - workingDir
 *             properties:
 *               projectName:
 *                 type: string
 *                 example: HelloWorld
 *               appType:
 *                 type: string
 *                 example: web
 *               template:
 *                 type: string
 *                 example: BasicTemplate
 *               platformVersion:
 *                 type: string
 *                 example: 8.0
 *               workingDir:
 *                 type: string
 *                 example: /home/user/projects
 *     responses:
 *       200:
 *         description: Project successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 projectPath:
 *                   type: string
 *                   example: /home/user/projects/HelloWorld
 *       400:
 *         description: Invalid parameters or project creation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 errorCode:
 *                   type: string
 *                   example: INVALID_PARAMETERS
 *                 message:
 *                   type: string
 *                   example: All of projectName, appType, template, platformVersion, and workingDir are required.
 */

router.post('/project', async (req, res) => {
  const { projectName, appType, profile, template, platformVersion, workingDir } =
    req.body;

  if (
    !projectName ||
    !appType ||
    !profile ||
    !template ||
    !platformVersion ||
    !workingDir
  ) {
    res.status(400).json({
      status: 'error',
      errorCode: 'INVALID_PARAMETERS',
      message:
        'All of projectName, appType, template, platformVersion, and workingDir are required.',
    });
    return;
  }

  // Basic parameter validation
  try {
    const result = await createProject({
      projectName,
      appType,
      profile,
      template,
      platformVersion,
      workingDir,
    });
    res.status(200).json({
      status: 'success',
      projectPath: result.projectPath,
    });
  } catch (err) {
    //console.error('Create Project Error:', err); //remove console log
    res.status(400).json({
      status: 'error',
      errorCode: (err as any).errorCode || 'UNKNOWN',
      message: (err as Error).message || 'Project creation failed.',
    });
  }
});

router.post('/project/build', async (req, res) => {
  const { projectDir } = req.body;

  if (!projectDir) {
    res.status(400).json({
      status: 'error',
      errorCode: 'INVALID_PARAMETER',
      message:
        'Project path is missing or invalid.',
    });
    return;
  }

  const result = await buildProject({ projectPath: projectDir });
  if (result.status === 'success') {
    res.status(200).json({
      status: 'success',
      buildPath: result.buildPath,
    });
  } else {
    res.status(400).json({
      status: 'error',
      errorCode: 'BUILD_FAILED',
      message: result.message || 'Project build failed.',
    });
  }
});

router.post('/project/run', async (req, res) => {
  const { projectDir, deviceSerial } = req.body;

  if (!projectDir || !deviceSerial) {
    res.status(400).json({
      status: 'error',
      errorCode: 'INVALID_PARAMETER',
      message:
        'Both project path and device serial are required',
    });
    return;
  }

  const result = await runProject({ projectPath: projectDir, target: deviceSerial });
  if (result.status === 'success') {
    res.status(200).json({
      status: 'success',
      processId: result.processId,
    });
  } else {
    res.status(400).json({
      status: 'error',
      errorCode: 'RUN_FAILED',
      message: result.message || 'Project launch failed.',
    });
  }
});

export default router;
