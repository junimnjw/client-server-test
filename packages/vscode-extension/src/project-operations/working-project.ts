import {
    getTizenConfigValue,
    setTizenConfigValue
} from "./config";

export function getWorkingProject(): string {
    return getTizenConfigValue('working.project');
}

export function setWorkingProject(projectPath: string | null = null) {
    setTizenConfigValue('working.project', projectPath);
}
