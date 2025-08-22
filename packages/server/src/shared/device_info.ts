/**
 * Device Information Interface
 */

export interface IDeviceInfo {
  name: string;
  status: string;
  serial: string;
  type?: string;
  platform?: string;
  version?: string;
  manufacturer?: string;
  model?: string;
}
