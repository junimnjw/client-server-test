import { Router } from 'express';
import { ListProfilesUseCase } from '../../features/emulator-manager/application/usecase/list-profiles';
import { CreateProfileUseCase } from '../../features/emulator-manager/application/usecase/create-profile';
import { DeleteProfileUseCase } from '../../features/emulator-manager/application/usecase/delete-profile';
import { EditProfileUseCase } from '../../features/emulator-manager/application/usecase/edit-profile';
import { LaunchProfileUseCase } from '../../features/emulator-manager/application/usecase/launch-profile';
import { LocalProfileRepository } from '../../features/emulator-manager/infra/local-profile-repository';
import { EmulatorLauncher } from '../../features/emulator-manager/service/emulator-launcher';

const router: Router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     BasicResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: "success"
 *         message:
 *           type: string
 *           example: "Operation completed successfully"
 */

// Initialize use cases
const listProfilesUseCase = new ListProfilesUseCase();
const createProfileUseCase = new CreateProfileUseCase();
const deleteProfileUseCase = new DeleteProfileUseCase();
const editProfileUseCase = new EditProfileUseCase();
const launchProfileUseCase = new LaunchProfileUseCase();

/**
 * @openapi
 * /api/v1/emulator-manager/profiles:
 *   get:
 *     summary: List all emulator profiles
 *     description: Returns a list of all available emulator profiles
 *     tags: [Emulator]
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/BasicResponse"
 *       400:
 *         description: Error
 */
router.get('/emulator-manager/profiles', async (req, res) => {
  try {
    const result = await listProfilesUseCase.execute();
    if (result.status === 'success') {
      res.status(200).json({
        status: 'success',
        message: 'Profiles retrieved',
        data: result.profiles
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: result.message || 'Failed to list profiles',
      });
    }
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: (err as Error).message || 'Failed to list profiles',
    });
  }
});

/**
 * @openapi
 * /api/v1/emulator-manager/profiles:
 *   post:
 *     summary: Create a new emulator profile
 *     tags: [Emulator]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/BasicResponse"
 *       400:
 *         description: Error
 */
router.post('/emulator-manager/profiles', async (req, res) => {
  try {
    const result = await createProfileUseCase.execute(req.body);
    if (result.status === 'success') {
      res.status(200).json({
        status: 'success',
        message: 'Profile created',
        data: { profileId: result.profileId }
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: result.message || 'Failed to create profile',
      });
    }
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: (err as Error).message || 'Failed to create profile',
    });
  }
});

/**
 * @openapi
 * /api/v1/emulator-manager/profiles/{id}:
 *   put:
 *     summary: Update an emulator profile
 *     tags: [Emulator]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/BasicResponse"
 *       400:
 *         description: Error
 */
router.put('/emulator-manager/profiles/:id', async (req, res) => {
  try {
    //const updatedProfile = await editProfileUseCase.execute();
    // TODO: Implement profile update with req.params.id and req.body
    res.status(200).json({
      status: 'success',
      message: 'Profile updated',
      //data: updatedProfile
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: (err as Error).message || 'Failed to update profile',
    });
  }
});

/**
 * @openapi
 * /api/v1/emulator-manager/profiles/{id}:
 *   delete:
 *     summary: Delete an emulator profile
 *     tags: [Emulator]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/BasicResponse"
 *       400:
 *         description: Error
 */
router.delete('/emulator-manager/profiles/:id', async (req, res) => {
  try {
    //await deleteProfileUseCase.execute();
    // TODO: Implement profile deletion with req.params.id
    res.status(200).json({
      status: 'success',
      message: 'Profile deleted',
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: (err as Error).message || 'Failed to delete profile',
    });
  }
});

/**
 * @openapi
 * /api/v1/emulator-manager/profiles/{id}/launch:
 *   post:
 *     summary: Launch an emulator profile
 *     tags: [Emulator]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/BasicResponse"
 *       400:
 *         description: Error
 */
router.post('/emulator-manager/profiles/:id/launch', async (req, res) => {
  try {
    //await launchProfileUseCase.execute(req.params.id);
    res.status(200).json({
      status: 'success',
      message: 'Emulator launched',
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: (err as Error).message || 'Failed to launch emulator',
    });
  }
});

export default router;
