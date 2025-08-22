import { SdkConstants } from '../../../shared/sdk-constants';
export namespace SdkTypes {
  export type PkgGroup = string;
  export type PkgTable = string[][][][];
  export type InstalledPkgList = {
    name: SdkConstants.UserActions;
    pkgs?: string[];
    plaformVersion?: string;
    pkgVersion?: string;
    appType?: SdkConstants.APP_TYPE;
  };
  export type Version = {
    platformversion: number;
    platformversionstr: string;
    sdkversion: string;
  };

  export type Configuration = {
    repository: string;
    distribution: string;
  };

  export type Extension = {
    name: string;
    displayname: string;
    version: string;
    publisher: string;
    identifier: string;
    installed: SdkConstants.INSTALL_STATE;
  };

  export type CreateAppHistory = {
    appType?: string;
    profile?: string;
    platformVersion?: string;
    appName?: string;
  };

  export type NativeToolchainInstallState = {
    gcc: boolean;
    gdb: boolean;
    llvm: boolean;
  };

  export type PkgInstallResult = {
    success: boolean;
    message?: string;
    url?: string;
    pkg?: string;
    platformVersion?: string;
    arch?: string;
    hostOS?: string;
    targetarch?: string;
    failedReason?: string;
  };

  export type EmulatorInfo = {
    name: string;
    profile: string;
    version: string;
    arch: string;
    installedPath?: string | null;
  };

  export type InstalledPackageInfo = {
    DevGroup: string;
    Package: string;
    Version: string;
    TimeStamp?: string;
    PlatformVersion?: string;
  };

  export type InstalledDevGroupInfo = {
    DevGroup: string;
    TimeStamp?: string;
    PlatformVersion?: string;
  };
}
