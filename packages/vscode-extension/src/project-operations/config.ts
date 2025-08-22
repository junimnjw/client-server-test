import { workspace } from "vscode";

export function getTizenConfigValue(propertyKey: string): string {
    const config = workspace.getConfiguration('tizen.v2');
    return <string>config.get(propertyKey);
}

export function setTizenConfigValue(propertyKey: string, newValue: string | null): void {
    const config = workspace.getConfiguration('tizen.v2');
    config.update(propertyKey, newValue, true);
}
