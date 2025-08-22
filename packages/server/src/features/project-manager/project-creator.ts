/**
 * Project Creator for managing project creation options
 */
export class ProjectCreator {
  /**
   * Get list of supported application types
   * @returns string[] Array of app types
   */
  static getAppTypeList(): string[] {
    // TODO: Implement app type list retrieval
    return ['web', 'native', 'dotnet'];
  }

  /**
   * Get available platform versions for specific app type
   * @param appType Application type
   * @returns string[] Array of platform versions
   */
  static getAvailablePlatformVersionList(appType: string): string[] {
    // TODO: Implement platform version list retrieval
    switch (appType) {
      case 'native':
      case 'dotnet':
      case 'web':
        return ['8.0', '7.0', '6.0'];
      default:
        return [];
    }
  }

  /**
   * Get available templates based on appType, deviceType, and platformVersion
   * @param appType Application type
   * @param deviceType Device type
   * @param platformVersion Platform version
   * @returns string[] Array of available templates
   */
  static getAvailableTemplateList(
    appType: string,
    deviceType: string,
    platformVersion: string
  ): string[] {
    // TODO: Implement template list retrieval
    return ['BasicTemplate', 'EmptyTemplate'];
  }

  /**
   * Get available profiles for specific app type and platform version
   * @param appType Application type
   * @param platformVersion Platform version
   * @returns string[] Array of available profiles
   */
  static getAvailableProfileList(appType: string, platformVersion: string): string[] {
    // TODO: Implement profile list retrieval
    return ['mobile', 'tv', 'wearable'];
  }
}
