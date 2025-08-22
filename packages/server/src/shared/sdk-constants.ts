import * as path from 'path';
import * as os from 'os';
import { Platform } from '@/shared/platform';
import { SdkTypes } from '../features/package-manager/utils/types';
export namespace SdkConstants {
  export const SDK_PATH = {
    SDKROOT: path.join(os.homedir(),'.tizen-extension-platform','server'),
    SDKTOOLS: 'sdktools',
    SNAPSHOTS: {
      BASE: 'snapshots',
      TIZEN: 'tizen',
      TVSAMSUNG: 'tv-samsung',
    },
    DOWNLOAD: 'download',
    //EXTRACT: "extract",
    EXTRACT: '',
    SDKDATA: 'sdk-data',
    DATA: 'data',
    TOOLS: {
      BASE: 'tools',
      TIZENCORE: 'tools/tizen-core',
      LLVM10: 'llvm-10/bin',
      TVSIMUL: 'sec-tv-simulator',
      EMULATOR: 'tools/emulator/bin',
    },
    PLATFORMS: 'platforms',
    INSTALLLOG: 'install-log',
    PLATFORMVERSION: 'tizen-',
    ROOTSTRAPINFO: 'tizen/rootstraps/info',
    WEBTEMPLATE: 'tizen/samples/Template/Web',
    DOTNETTEMPLATE: 'templates/dotnet',
    NATIVETEMPLATE1: 'tizen/samples/Template/Native',
    NATIVETEMPLATE2: 'templates/native',
    EMULATORIMAGE: 'tizen/emulator-image',
    DOTNETSDK: {
      SDK: 'dotnet',
      SCRIPT: 'dotnet/script',
      BINARY: 'dotnet/binary',
    },
    EXTRAEXTENSION: 'extra-extensions',
    WASMSDK: {
      BASE: 'wasm',
      SDKPATH: 'emscripten-release-bundle/emsdk',
    },
    DOTNETPROFILER: 'common/on-demand/',
    CONFIG: 'config',
  } as const;

  export const PLATFORM_VERSION = {
    MINIMUM_PLATFORM_VERSION: '8.0',
    MINIMUM_TIZENFX_VERSION: 11,
  };

  export const PACKAGE_LIST = {
    WINDOWS: 'pkg_list_windows-64',
    LINUX: 'pkg_list_ubuntu-64',
    MACOS: 'pkg_list_macos-64',
  };

  export const INSTALLED_PKG_LIST_FILE = {
    INSTALLED_DEV_GROUP_FILE: 'installed.groups',
    INSTALLED_OTHER_DEV_GROUP_FILE: 'installed.other.groups',
    INSTALLED_PKG_LIST_FILE: 'installed.pkgs',
    INSTALLED_OTHER_PKG_LIST_FILE: 'installed.other.pkgs',
  };

  export const SKIP_HEADER_CHECK_FILES = [
    'package-manager',
    'certficate-manager',
    'emulator-manager',
    'device-manager',
    'uninstaller',
  ];

  export const PROFILE = {
    TIZEN: 'tizen',
    TVSAMSUNG: 'tv-samsung',
  } as const;

  export const APP_TYPE_NAME = {
    WEB: 'web',
    DOTNET: 'dotnet',
    NATIVE: 'native',
    RPK: 'rpk',
  } as const;

  export const COREAPP_SDK_TOOLS = {
    TZ: Platform.detectOSType() === 'Windows' ? 'tz.exe' : 'tz',
    SDB: Platform.detectOSType() === 'Windows' ? 'sdb.exe' : 'sdb',
    DEFAULTCERTIFICATE: 'certificate-generator',
    SDKINFO: 'license',
  } as const;

  export const ONDEMAND_SDK_TOOLS = {
    EMULATOR: 'Emulator',
    EMULATOR_IMAGE: 'EmulatorImage',
    ROOTSTRAP: 'Rootstrap',
    TOOLCHAIN: 'Toolchain',
    PROFILER: 'Profiler',
    TEMPLATE: 'Template',
    WEBAPP_TEMPLATE: 'WebAppTemplate',
    NATIVEAPP_TEMPLATE: 'NativeAppTemplate',
    LLVM: 'LLVM',
  } as const;

  export const DOTNET_SDK = {
    VERSION: '9.0.304',
    TOOL: Platform.detectOSType() === 'Windows' ? 'dotnet.exe' : 'dotnet',
    TIZEN_DOTNET_ROOT: 'TIZEN_DOTNET_ROOT',
    DOTNET_ROOT: 'DOTNET_ROOT',
    DOTNET_INSTALL_DIR: 'DOTNET_INSTALL_DIR',

    // Platform-specific values for URL construction
    PLATFORM:
      Platform.detectOSType() === 'Windows'
        ? 'win'
        : Platform.detectOSType() === 'Linux'
          ? 'linux'
          : 'osx',
  } as const;

  export const TIZEN_DOTNET_WORKLOAD = {
    URL: 'https://raw.githubusercontent.com/Samsung/Tizen.NET/main/workload/scripts/',
    SDK_VERSION: '9.0.300',
    MANIFEST_PATH: 'sdk-manifests',
    TIZEN_MANIFEST: 'samsung.net.sdk.tizen',
    SCRIPT:
      Platform.detectOSType() === 'Windows'
        ? 'workload-install.ps1'
        : 'workload-install.sh',
    JSON_FILE: 'WorkloadManifest.json',
  } as const;

  export const TV_SDK_TOOLS = {
    EMULATOR: 'Emulator',
    EMULATOR_IMAGE: 'EmulatorImage',
    WEBPLUGIN: 'WebPlugin',
  } as const;

  export const HOST_OS = {
    WINDOWS: 'Windows',
    LINUX: 'Linux',
    MACOS: 'MacOS',
  } as const;

  export const PERMISSION = {
    X: 0o764,
  } as const;

  export const LOGFILE = {
    INSTALL_EMULATOR_FILE: 'sdk_install_emulator.log',
    INSTALL_EMULATORIMG_FILE: 'sdk_install_emulatorImage.log',
    INSTALL_ROOTSTRAP_FILE: 'sdk_install_rootstrap.log',
    INSTALL_TOOLCHAIN_FILE: 'sdk_install_toolchain.log',
    INSTALL_PROFILER_FILE: 'sdk_install_profiler.log',
    INSTALL_TEMPLATE_FILE: 'sdk_install_template.log',
    INSTALL_TIZENCORE_FILE: 'sdk_install_tizencore.log',
    INSTALL_SDB_FILE: 'sdk_install_sdb.log',
    INSTALL_TV_EMULATOR_FILE: 'sdk_install_tv_emulator.log',
    INSTALL_TV_EMULATORIMG_FILE: 'sdk_install_tv_emulatorImage.log',
    INSTALL_WEB_PLUGIN_FILE: 'sdk_install_tv_webplugin.log',
  };

  export const PKG_INSTALL_STATE_FILE = {
    INSTALL_STATE_FILE: 'pkginstallstate.log',
  };

  export const SDK_VERSIONS: SdkTypes.Version[] = [
    {
      platformversion: 9.0,
      platformversionstr: '9.0',
      sdkversion: '6.0',
    },
    {
      platformversion: 8.0,
      platformversionstr: '8.0',
      sdkversion: '5.5',
    },
  ];

  export const TARGET_ARCHITECTURE = {
    I586: 'i586',
    X86: 'x86',
    X86_64: 'x86_64',
    ARM: 'arm',
    AARCH64: 'aarch64',
    RISCV64: 'riscv64',
    ALL: 'all',
  };

  export const ROOTSTRAP_FILE_TYPE = {
    EMULATOR: 'emulator',
    EMULATOR64: 'emulator64',
    DEVICE: 'device',
    DEVICE64: 'device64',
  };

  export const EMULATOR_RESOURCE = {
    EMULATOR:
      Platform.detectOSType() === 'Windows' ? 'emulator-x86_64.exe' : 'emulator-x86_64',
  };

  export const EMULATOR_CHECKLIST: SdkTypes.EmulatorInfo[] = [
    {
      name: 'tizen-9.0-x86',
      profile: 'tizen',
      version: '9.0',
      arch: 'x86',
    },
    {
      name: 'tizen-9.0-x86_64',
      profile: 'tizen',
      version: '9.0',
      arch: 'x86_64',
    },
    {
      name: 'tv-samsung-9.0-x86',
      profile: 'tv-samsung',
      version: '9.0',
      arch: 'x86',
    },
    {
      name: 'tizen-10.0-x86_64',
      profile: 'tizen',
      version: '10.0',
      arch: 'x86_64',
    },
    /*
    {
      name: 'tv-samsung-10.0-x86_64',
      profile: 'tv-samsung',
      version: '10.0',
      arch: 'x86_64',
    },
    */
  ];

  export const TV_WEB_PLUGIN = {
    SIMULATOR: Platform.detectOSType() === 'Windows' ? 'simulator.exe' : 'simulator',
  };

  export const CONFIG_FILE = {
    REPOSITORY: 'repository.json',
    TV_REPOSITORY: 'tv-repository.json',
  };

  export const EXTRA_EXTENSION_TARGET_PLATFORM = {
    WINDOWS: 'win32-x64',
    LINUX: 'linux-x64',
    MACOS_X64: 'arwin-x64',
    MACOS_ARM: 'darwin-arm64',
  };

  export const EXTRA_EXTENSION = {
    DOTNETINSTALLTOOL: {
      CALLNAME: 'dotnetinstalltool',
      PUBLISHER: 'ms-dotnettools',
      NAME: 'vscode-dotnet-runtime',
      VERSION: '2.3.7',
    },
    CSHARP: {
      CALLNAME: 'c#',
      PUBLISHER: 'ms-dotnettools',
      NAME: 'csharp',
      VERSION: '2.84.19',
    },
    CPP: {
      CALLNAME: 'c++',
      PUBLISHER: 'ms-vscode',
      NAME: 'cpptools',
      VERSION: 'latest',
    },
    YAML: {
      CALLNAME: 'yaml',
      PUBLISHER: 'redhat',
      NAME: 'vscode-yaml',
      VERSION: 'latest',
    },
    XML: {
      CALLNAME: 'xml',
      PUBLISHER: 'redhat',
      NAME: 'vscode-xml',
      VERSION: 'latest',
    },
  };

  export const WASM_SDK = {
    WAMS_SDK: Platform.detectOSType() === 'Windows' ? 'wasm.tar' : 'wasm.zip',
    WAMS_BIN: 'emsdk',
    LINUX:
      'https://developer.samsung.com/smarttv/file/a5013a65-af11-4b59-844f-2d34f14d19a9',
    WINDOWS:
      'https://developer.samsung.com/smarttv/file/a5d0e1a8-ef6a-4632-98ba-efb010a4656b',
    MACOS:
      'https://developer.samsung.com/smarttv/file/5717993e-b16b-4402-a0a4-61617a607398',
  };

  export enum INSTALL_TYPE {
    COREAPP_INSTALL,
    ONDEMAND_INSTALL,
    TV_INSTALL,
  }

  export enum OSType {
    Linux,
    Windows,
    MacOS,
  }

  export enum ArchType {
    X86,
    X86_64,
    ARM,
    AARCH64,
    ALL,
    RISCV64,
  }

  export enum CoreAppPackageType {
    TizenCore,
    SDB,
    DefaultCertificate,
    SdkInfo,
  }

  export enum PackageType {
    Emulator,
    EmulatorImage,
    Rootstrap,
    Toolcahin,
    Profiler,
    Template,
    WebAppTemplate,
    NativeAppTemplate,
    LLVM,
  }

  export enum TVPackageType {
    Emulator,
    EmulatorImage,
    WEBPLUGIN,
  }

  export enum UserActions {
    Create,
    Build,
    Run,
    log,
    Debug,
    Profiler,
  }

  export enum APP_TYPE {
    Web,
    Dotnet,
    Native,
    Rpk,
  }

  export enum INSTALL_STATE {
    NOT_INSTALLED,
    INSTALLING,
    INSTALLED,
    UNINSTALLED,
  }

  export enum UpdateStatus {
    NOT_AVAILABLE,
    AVAILABLE_TIZEN,
    AVAILABLE_TV,
    AVAILABLE_ALL = UpdateStatus.AVAILABLE_TIZEN | UpdateStatus.AVAILABLE_TV,
  }

  export const EXTENSION_PATH =
    Platform.detectOSType() === 'Windows'
      ? process.env.USERPROFILE + '\\.vscode\\extensions'
      : process.env.HOME + '/.vscode/extensions';

  export const SDK_INFO_FILE = {
    SDK_INFO: 'sdk.info',
    TIZEN_SDK_INSTALLED_PATH: 'TIZEN_SDK_INSTALLED_PATH',
    TIZEN_SDK_DATA_PATH: 'TIZEN_SDK_DATA_PATH',
  };

  export const SDK_VERSION_FILE = {
    SDK_VERSION: 'sdk.version',
    TIZEN_SDK_VERSION: 'TIZEN_SDK_VERSION',
    VERSION: SdkConstants.SDK_VERSIONS[0].sdkversion,
  };

  export const ERROR_TYPE = {
    NO_ERROR: 'noError',
    DOWNLOAD_ERROR: 'downloadError',
    INSTALLATION_ERROR: 'installationError',
    NETWORK_ERROR: 'networkError',
    VALIDATIONERROR: 'validationError',
    PERMISSIONERROR: 'permissionError',
  };
}
