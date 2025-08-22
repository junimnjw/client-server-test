import { Router } from 'express';
import { PackageListManagerApi } from '../../features/package-manager/export-apis/pkg-list-manager/pkg-list-manager-api';

const router = Router();

const handleRoute = (handler: () => any, routeName: string) => {
  return (req: any, res: any) => {
    try {
      const result = handler();
      res.json({ result });
    } catch (error) {
      console.error(`Error getting ${routeName}:`, error);
      res.status(500).json({ error: `Error getting ${routeName}` });
    }
  };
};

router.get(
  '/installed-pkg-list',
  handleRoute(
    () => PackageListManagerApi.instance.installedPackageInfos,
    'installed package list',
  ),
);

router.get(
  '/installed-dev-group-list',
  handleRoute(
    () => PackageListManagerApi.instance.installedDevGroupInfos,
    'installed dev group list',
  ),
);

router.get(
  '/installed-other-pkg-list',
  handleRoute(
    () => PackageListManagerApi.instance.installedOtherPackageInfos,
    'installed other package list',
  ),
);

router.get(
  '/installed-other-dev-group-list',
  handleRoute(
    () => PackageListManagerApi.instance.installedOtherDevGroupInfos,
    'installed other dev group list',
  ),
);

export default router;
