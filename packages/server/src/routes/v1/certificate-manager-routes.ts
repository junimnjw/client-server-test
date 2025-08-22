import { generateTizenCertificate } from '../../features/certificate-manager/tizen-certificate/certificate-generator';
import { generateSamsungCertificate } from '../../features/certificate-manager/samsung-certificate/certificate-generator';
import { extractCertificateInfo } from '../../features/certificate-manager/common/meta-data-extractor';
import { importTizenCert } from '../../features/certificate-manager/tizen-certificate/certificate-import';
import { deleteTizenCert } from '../../features/certificate-manager/common/oprations';
import { Router } from 'express';

const router: Router = Router();

/**
 * @openapi
 * /api/v1/generateTizenCert:
 *   post:
 *     summary: Generate Tizen certificate and PKCS#12 keystore
 *     description: Generates a Tizen certificate and PKCS#12 keystore using the provided parameters.
 *     tags:
 *       - Certificate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - profileName
 *               - distributorVersion
 *               - distributorType
 *               - subject
 *               - issuerName
 *               - outputDir
 *               - authorPassword
 *               - commonName
 *               - alias
 *             properties:
 *               profileName:
 *                 type: string
 *                 example: TizenProfile
 *               distributorVersion:
 *                 type: string
 *                 example: old
 *               distributorType:
 *                 type: string
 *                 example: public
 *               subject:
 *                 type: string
 *                 example: CN=Test User
 *               issuerName:
 *                 type: string
 *                 example: Tizen Developer CA
 *               authorPassword:
 *                 type: string
 *                 example: password123
 *               commonName:
 *                 type: string
 *                 example: Test User
 *               alias:
 *                 type: string
 *                 example: test-cert
 *               country:
 *                 type: string
 *                 example: BD
 *               state:
 *                 type: string
 *                 example: Dacca
 *               city:
 *                 type: string
 *                 example: DhakaCity
 *               organization:
 *                 type: string
 *                 example: Samsung
 *               organizationalUnit:
 *                 type: string
 *                 example: ADG
 *
 *     responses:
 *       200:
 *         description: Certificate successfully generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 keystorePath:
 *                   type: string
 *                   example: /path/to/outputs/test-cert.p12
 *                 message:
 *                   type: string
 *                   example: Tizen certificate and keystore generated successfully
 *       400:
 *         description: Invalid parameters or certificate generation failed
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
 *                   example: All of subject, issuerName, outputDir, authorPassword, commonName, and alias are required.
 */

router.post('/generateTizenCert', async (req, res) => {
  const {
    profileName,
    distributorVersion,
    distributorType,
    subject,
    issuerName,
    authorPassword,
    commonName,
    alias,
    country,
    state,
    city,
    organization,
    organizationalUnit,
  } = req.body;

  if (
    !profileName ||
    !subject ||
    !issuerName ||
    !authorPassword ||
    !commonName ||
    !alias
  ) {
    res.status(400).json({
      status: 'error',
      errorCode: 'INVALID_PARAMETERS',
      message:
        'All of profileName, subject, issuerName, outputDir, authorPassword, commonName, and alias are required.',
    });
    return;
  }
  if (distributorVersion !== 'old' && distributorVersion !== 'new') {
    res.status(400).json({
      status: 'error',
      errorCode: 'INVALID_DISTRIBUTOR_VERSION',
      message: "Distributor version should be either 'old' or 'new'",
    });
    return;
  }
  if (distributorType !== 'public' && distributorType !== 'partner') {
    res.status(400).json({
      status: 'error',
      errorCode: 'INVALID_DISTRIBUTOR_TYPE',
      message: "Distributor type should be either 'public' or 'partner'",
    });
    return;
  }

  try {
    const result = await generateTizenCertificate({
      profileName,
      distributorVersion,
      distributorType,
      subject,
      issuerName,
      outputDir: req.body.outputDir || './outputs',
      authorPassword,
      commonName,
      alias,
      country,
      state,
      city,
      organization,
      organizationalUnit,
    });

    if (result.status === 'error') {
      res.status(400).json({
        status: 'error',
        errorCode: result.errorCode || 'CERTIFICATE_GENERATION_FAILED',
        message: result.message || 'Certificate generation failed.',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      keystorePath: result.keystorePath,
      message: 'Tizen certificate and keystore generated successfully',
    });
  } catch (err) {
    console.error('Generate Certificate Error:', err);
    res.status(400).json({
      status: 'error',
      errorCode: (err as any).errorCode || 'CERTIFICATE_GENERATION_FAILED',
      message: (err as Error).message || 'Certificate generation failed.',
    });
  }
});

/**
 * @openapi
 * /api/v1/getCertificateInfos:
 *   post:
 *     summary: Create Tizen certificate password file(.pwd)
 *     description: Generates a password file(.pwd) for Tizen certificate(.p12).
 *     tags:
 *       - Certificate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - certificatePath
 *               - password
 *             properties:
 *               certificatePath:
 *                 type: string
 *                 example: D:\Github\tizen.extension.v2\packages\server\src\features\certificate-manager\outputs\test-cert.p12
 *               password:
 *                 type: string
 *                 example: password123
 *
 *     responses:
 *       200:
 *         description: Password file successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Tizen certificate password file created successfully
 *       400:
 *         description: Invalid parameters or password file creation failed
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
 *                   example: Certificate path and password required.
 */

router.post('/getCertificateInfos', async (req, res) => {
  const { certificatePath, password } = req.body;

  if (!certificatePath || !password) {
    res.status(400).json({
      status: 'error',
      errorCode: 'INVALID_PARAMETERS',
      message: 'Certificate file path and password are required.',
    });
    return;
  }

  try {
    let certInfo = await extractCertificateInfo(certificatePath);

    res.status(200).json({
      // status: 'success',
      // message: 'Tizen certificate password file generated successfully',
      certInfo,
    });

    console.log('?? input object:', JSON.stringify(certInfo));
  } catch (err) {
    console.error('Generate Certificate Error:', err);
    res.status(400).json({
      status: 'error',
      errorCode: (err as any).errorCode || 'PASSWORDFILE_GENERATION_FAILED',
      message: (err as Error).message || 'Password file generation failed.',
    });
  }
});

/**
 * @openapi
 * /api/v1/importTizenCertificate:
 *   post:
 *     summary: import a tizen certificate
 *     description: import and registers tizen profile.
 *     tags:
 *       - Certificate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - profileName
 *               - certificatePath
 *             properties:
 *               profileName:
 *                 type: string
 *                 example: TizenImportedProfile
 *               authorPassword:
 *                 type: string
 *                 example: password123
 *               certificatePath:
 *                 type: string
 *                 example: D:\Github\tizen.extension.v2\packages\server\src\features\certificate-manager\outputs\test-cert.p12
 *               distributorVersion:
 *                 type: string
 *                 example: new
 *               distributorType:
 *                 type: string
 *                 example: public
 *
 *     responses:
 *       200:
 *         description: Password file successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Tizen certificate imported successfully
 *       400:
 *         description: Tizen certificate import fail
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
 *                   example: Profilename and certificate paths are required.
 */

router.post('/importTizenCertificate', async (req, res) => {
  const {
    profileName,
    distributorVersion,
    distributorType,
    authorPassword,
    certificatePath,
  } = req.body;

  if (!profileName || !certificatePath) {
    res.status(400).json({
      status: 'error',
      errorCode: 'INVALID_PARAMETERS',
      message: 'Profile name and certificate path are required.',
    });
    return;
  }

  try {
    const result = await importTizenCert({
      certificatePath,
      keystorePath: `./keystores/${profileName}.p12`,
      alias: profileName,
      password: authorPassword,
    });

    if (result.status === 'error') {
      res.status(400).json({
        status: 'error',
        errorCode: result.errorCode || 'IMPORT_FAILED',
        message: result.message || 'Tizen certificate import failed.',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Tizen certificate imported successfully',
    });
  } catch (err) {
    console.error('Generate Certificate Error:', err);
    res.status(400).json({
      status: 'error',
      errorCode: (err as any).errorCode || 'IMPORT_FAILED',
      message: (err as Error).message || 'Tizen certificate import failed.',
    });
  }
});

/**
 * @openapi
 * /api/v1/deleteTizenProfile:
 *   post:
 *     summary: Remove tizen certificate
 *     description: Removes a tizen profile.
 *     tags:
 *       - Certificate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - profileName
 *             properties:
 *               profileName:
 *                 type: string
 *                 example: TizenImportedProfile
 *     responses:
 *       200:
 *         description: Profile deletd successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Tizen profile successfully
 *       400:
 *         description: Tizen profile delete fail
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
 *                   example: Profilename and certificate paths are required.
 */

router.post('/deleteTizenProfile', async (req, res) => {
  const { profileName } = req.body;

  if (!profileName) {
    res.status(400).json({
      status: 'error',
      errorCode: 'INVALID_PARAMETERS',
      message: 'Profile name is required.',
    });
    return;
  }

  try {
    const result = await deleteTizenCert({
      certificatePath: `./keystores/${profileName}.p12`,
      keystorePath: `./keystores/${profileName}.p12`
    });

    if (result.status === 'error') {
      res.status(400).json({
        status: 'error',
        errorCode: result.errorCode || 'DELETE_FAILED',
        message: result.message || 'Tizen certificate deletion failed.',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Tizen certificate removed successfully',
    });
  } catch (err) {
    console.error('Generate Certificate Error:', err);
    res.status(400).json({
      status: 'error',
      errorCode: (err as any).errorCode || 'REMOVE_PROFILE_FAILED',
      message: (err as Error).message || 'Tizen profile removing failed.',
    });
  }
});

/**
 * @openapi
 * /api/v1/generateSamsungCert:
 *   post:
 *     summary: Generate certificate with configuration
 *     description: Generates a certificate using the provided configuration parameters.
 *     tags:
 *       - Certificate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - profileName
 *               - password
 *               - infoList
 *               - isTVSelected
 *               - certificateType
 *             properties:
 *               profileName:
 *                 type: string
 *                 example: MyTizenProfile
 *               password:
 *                 type: string
 *                 example: mySecurePassword123
 *               identity:
 *                 type: string
 *                 example: Rayhan
 *               department:
 *                 type: string
 *                 example: CSE
 *               organization:
 *                 type: string
 *                 example: MIST
 *               city:
 *                 type: string
 *                 example: Dhaka
 *               state:
 *                 type: string
 *                 example: DhakaState
 *               country:
 *                 type: string
 *                 example: BD
 *               email:
 *                 type: string
 *                 example: mail@yahoo.com
 *               duidList:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["duXTCJYJZXZBZVKid1"]
 *                 description: Optional list of device unique identifiers
 *               privilege:
 *                 type: string
 *                 example: public
 *                 description: Optional privilege string
 *               isTVSelected:
 *                 type: boolean
 *                 example: true
 *               certificateType:
 *                 type: string
 *                 enum: [author, distributor]
 *                 example: author
 *     responses:
 *       200:
 *         description: Certificate successfully generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 profileName:
 *                   type: string
 *                   example: MyTizenProfile
 *                 certificateType:
 *                   type: string
 *                   example: author
 *                 message:
 *                   type: string
 *                   example: Certificate generated successfully
 *       400:
 *         description: Invalid parameters or certificate generation failed
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
 *                   example: All of profileName, password, infoList, isTVSelected, and certificateType are required.
 */

router.post('/generateSamsungCert', async (req, res) => {
  const {
    profileName,
    password,
    duidList,
    privilege,
    isTVSelected,
    certificateType,
    identity,
    department,
    organization,
    city,
    state,
    country,
    email,
  } = req.body;

  // Validate required fields
  if (
    !profileName ||
    !password ||
    typeof isTVSelected !== 'boolean' ||
    !certificateType
  ) {
    res.status(400).json({
      status: 'error',
      errorCode: 'INVALID_PARAMETERS',
      message:
        'All of profileName, password, infoList, isTVSelected, and certificateType are required.',
    });
    return;
  }

  // Validate infoList is an array
  // if (!Array.isArray(infoList) || infoList.length === 0) {
  //   res.status(400).json({
  //     status: 'error',
  //     errorCode: 'INVALID_INFO_LIST',
  //     message: 'infoList must be a non-empty array.',
  //   });
  //   return;
  // }

  // Validate certificateType enum
  if (certificateType !== 'author' && certificateType !== 'distributor') {
    res.status(400).json({
      status: 'error',
      errorCode: 'INVALID_CERTIFICATE_TYPE',
      message: 'certificateType must be either "author" or "distributor".',
    });
    return;
  }

  // Validate duidList if provided
  if (duidList && !Array.isArray(duidList)) {
    res.status(400).json({
      status: 'error',
      errorCode: 'INVALID_DUID_LIST',
      message: 'duidList must be an array when provided.',
    });
    return;
  }

  try {
    const result = await generateSamsungCertificate({
      profileName,
      distributorVersion: 'new',
      distributorType: 'public',
      subject: `CN=${identity || profileName}`,
      issuerName: 'Samsung Developer CA',
      outputDir: './outputs',
      authorPassword: password,
      commonName: identity || profileName,
      alias: profileName,
      country,
      state,
      city,
      organization,
      organizationalUnit: department,
    });

    if (result.status === 'error') {
      res.status(400).json({
        status: 'error',
        errorCode: result.errorCode || 'CERTIFICATE_GENERATION_FAILED',
        message: result.message || 'Certificate generation failed.',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      profileName,
      certificateType,
      message: 'Certificate generated successfully',
    });
  } catch (err) {
    console.error('Generate Certificate Config Error:', err);
    res.status(400).json({
      status: 'error',
      errorCode: (err as any).errorCode || 'CERTIFICATE_GENERATION_FAILED',
      message: (err as Error).message || 'Certificate generation failed.',
    });
  }
});

export default router;
