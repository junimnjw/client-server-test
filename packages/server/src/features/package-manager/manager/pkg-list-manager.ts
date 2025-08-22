import { SdkTypes } from '../utils/types';

export class PackageListManager {
  private static _instance: PackageListManager;
  private _installedDevGroupInfos: SdkTypes.InstalledDevGroupInfo[] = [];

  private constructor() {}

  /**
   * Get singleton instance
   */
  static get instance(): PackageListManager {
    if (!PackageListManager._instance) {
      PackageListManager._instance = new PackageListManager();
    }
    return PackageListManager._instance;
  }

  /**
   * Get installed development group information
   */
  get installedDevGroupInfos(): SdkTypes.InstalledDevGroupInfo[] {
    // TODO: Implement installed dev group info retrieval
    return this._installedDevGroupInfos;
  }

  /**
   * Set installed development group information
   * @param devGroups Array of installed dev group information
   */
  setInstalledDevGroupInfos(devGroups: SdkTypes.InstalledDevGroupInfo[]): void {
    this._installedDevGroupInfos = devGroups;
  }

  /**
   * Add installed development group information
   * @param devGroup Installed dev group information to add
   */
  addInstalledDevGroupInfo(devGroup: SdkTypes.InstalledDevGroupInfo): void {
    const existingIndex = this._installedDevGroupInfos.findIndex(
      info => info.DevGroup === devGroup.DevGroup && 
              info.PlatformVersion === devGroup.PlatformVersion
    );
    
    if (existingIndex >= 0) {
      this._installedDevGroupInfos[existingIndex] = devGroup;
    } else {
      this._installedDevGroupInfos.push(devGroup);
    }
  }

  /**
   * Remove installed development group information
   * @param devGroupName Development group name to remove
   * @param platformVersion Platform version to remove
   */
  removeInstalledDevGroupInfo(devGroupName: string, platformVersion?: string): void {
    this._installedDevGroupInfos = this._installedDevGroupInfos.filter(
      info => !(info.DevGroup === devGroupName && 
                (!platformVersion || info.PlatformVersion === platformVersion))
    );
  }

  /**
   * Clear all installed development group information
   */
  clearInstalledDevGroupInfos(): void {
    this._installedDevGroupInfos = [];
  }
}

