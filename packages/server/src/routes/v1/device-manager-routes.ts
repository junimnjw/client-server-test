import DeviceManager from "../../features/device-manager/device-manager";
import { IDeviceInfo } from "../../shared/device_info";
import { SDKPathManager } from "../../shared/sdkpath_manager";
import { Router } from 'express';
import type { Request, Response } from 'express';

const router: Router = Router();

/**
 * @openapi
 * /v1/devices:
 *   get:
 *     summary: Get list of connected devices
 *     description: Returns a map of all connected Tizen devices with their details
 *     tags:
 *       - Devices
 *     responses:
 *       200:
 *         description: Successfully retrieved device list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 devices:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       serial:
 *                         type: string
 *                         example: emulator-26101
 *                       name:
 *                         type: string
 *                         example: T-9.0-x86
 *                       status:
 *                         type: string
 *                         example: device
 *       500:
 *         description: Error retrieving device list
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
 *                   example: DEVICE_LIST_ERROR
 *                 message:
 *                   type: string
 *                   example: Failed to retrieve device list
 */

router.get('/devices', async (req: Request, res: Response) => {
  try {
    const sdkPath = SDKPathManager.getInstance().getTizenSdkToolsPath();
    console.log("sdkPath is "+sdkPath);
    const deviceManager = DeviceManager(sdkPath);
    const deviceMap = deviceManager.getDeviceInfoMap() || new Map();
    const devices = Array.from(deviceMap.entries()).map((entry) => {
      const [serial, deviceInfo] = entry as [string, IDeviceInfo];
      return {
        serial,
        name: deviceInfo.name,
        status: deviceInfo.status
      };
    });

    res.status(200).json({
      status: 'success',
      devices
    });
  } catch (err) {
    console.error('Get Devices Error:', err);
    res.status(500).json({
      status: 'error',
      errorCode: 'DEVICE_LIST_ERROR',
      message: 'Failed to retrieve device list'
    });
  }
});



/**
 * @openapi
 * /v1/devices/{name}:
 *   get:
 *     summary: Get details of a specific device by name
 *     description: Returns details of a connected Tizen device matching the given name
 *     tags:
 *       - Devices
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the device to retrieve
 *     responses:
 *       200:
 *         description: Successfully retrieved device details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 device:
 *                   type: object
 *                   properties:
 *                     serial:
 *                       type: string
 *                       example: emulator-26101
 *                     name:
 *                       type: string
 *                       example: T-9.0-x86
 *                     status:
 *                       type: string
 *                       example: device
 *       404:
 *         description: Device not found
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
 *                   example: DEVICE_NOT_FOUND
 *                 message:
 *                   type: string
 *                   example: Device with name T-9.0-x86 not found
 *       500:
 *         description: Error retrieving device details
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
 *                   example: DEVICE_DETAILS_ERROR
 *                 message:
 *                   type: string
 *                   example: Failed to retrieve device details
 */

router.get('/devices/:name', async (req: Request, res: Response) => {
  try {
    const sdkPath = SDKPathManager.getInstance().getTizenSdkToolsPath();
    const deviceManager = DeviceManager(sdkPath);
    const deviceMap = deviceManager.getDeviceInfoMap() || new Map();

    const deviceName = req.params.name;
    let foundDevice = null;

    for (const [serial, deviceInfo] of deviceMap.entries()) {
      if (deviceInfo.name === deviceName) {
        foundDevice = {
          serial,
          name: deviceInfo.name,
          status: deviceInfo.status
        };
        break;
      }
    }

    if (foundDevice) {
      res.status(200).json({
        status: 'success',
        device: foundDevice
      });
    } else {
      res.status(404).json({
        status: 'error',
        errorCode: 'DEVICE_NOT_FOUND',
        message: `Device with name ${deviceName} not found`
      });
    }
  } catch (err) {
    console.error('Get Device Details Error:', err);
    res.status(500).json({
      status: 'error',
      errorCode: 'DEVICE_DETAILS_ERROR',
      message: 'Failed to retrieve device details'
    });
  }
});

/**
 * @openapi
 * /v1/devices/{name}/logs:
 *   get:
 *     summary: Get logs for a specific device
 *     description: Returns logs from a connected Tizen device matching the given name
 *     tags:
 *       - Devices
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the device to get logs from
 *       - in: query
 *         name: maxLogs
 *         required: false
 *         schema:
 *           type: integer
 *         description: Maximum number of logs to return (no limit if not provided)
 *       - in: query
 *         name: filteredMessage
 *         required: false
 *         schema:
 *           type: string
 *         description: Only return logs containing this message (case sensitive)
 *     responses:
 *       200:
 *         description: Successfully retrieved device logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 logs:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["01-01 00:00:00.000  1000  1000 I Tag: Sample log message"]
 *       404:
 *         description: Device not found
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
 *                   example: DEVICE_NOT_FOUND
 *                 message:
 *                   type: string
 *                   example: Device with name T-9.0-x86 not found
 *       500:
 *         description: Error retrieving device logs
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
 *                   example: DEVICE_LOG_ERROR
 *                 message:
 *                   type: string
 *                   example: Failed to retrieve device logs
 */

router.get('/devices/:name/logs', async (req: Request, res: Response) => {
  try {
    const sdkPath = SDKPathManager.getInstance().getTizenSdkToolsPath();
    const deviceManager = DeviceManager(sdkPath);
    const deviceMap = deviceManager.getDeviceInfoMap() || new Map();

    const deviceName = req.params.name;
    let deviceSerial = null;

    // Find device by name
    for (const [serial, deviceInfo] of deviceMap.entries()) {
      if (deviceInfo.name === deviceName) {
        console.log("Got the device that you want");
        deviceSerial = serial;
        break;
      }
    }

    console.log("Device serial is " + deviceSerial);

    if (!deviceSerial) {
      return res.status(404).json({
        status: 'error',
        errorCode: 'DEVICE_NOT_FOUND',
        message: `Device with name ${deviceName} not found`
      });
    }

    const maxLogs = req.query.maxLogs ? parseInt(req.query.maxLogs as string) : undefined;
    const filteredMessage = req.query.filteredMessage as string | undefined;
    const logs = await deviceManager.startDeviceLog(deviceSerial);

    res.status(200).json({
      status: 'success',
      logs
    });
  } catch (err) {
    console.error('Get Device Logs Error:', err);
    res.status(500).json({
      status: 'error',
      errorCode: 'DEVICE_LOG_ERROR',
      message: 'Failed to retrieve device logs'
    });
  }
});

export default router;
