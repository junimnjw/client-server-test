type OSType = 'Windows' | 'Linux' | 'MacOS' | 'Unknown';
type ArchType = 'x64' | 'arm64' | 'Unknown';
export class Platform {
  static detectOSType(): OSType {
    const platform = process.platform;
    if (platform.startsWith('win')) {
      return 'Windows';
    }
    if (platform.startsWith('linux')) {
      return 'Linux';
    }
    if (platform.startsWith('darwin')) {
      return 'MacOS';
    }
    return 'Unknown';
  }
  static detectArchType(): ArchType {
    const arch = process.arch;
    if (arch.startsWith('x64')) {
      return 'x64';
    }
    if (arch.startsWith('arm64')) {
      return 'arm64';
    }
    return 'Unknown';
  }
}
