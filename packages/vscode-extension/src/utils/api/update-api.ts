import axios from 'axios';
import { ErrorHandler } from '../error/error-handler';

const API_BASE_URL = 'http://localhost:12345/api/v1';

export interface UpdateCheckResponse {
  updateAvailable: boolean;
}

export interface UpdateInstallResponse {
  status: string;
  message: string;
}

async function handleApiError(err: unknown): Promise<never> {
  let message = 'Unknown error';
  let errorCode = 'NETWORK_ERROR';

  if (axios.isAxiosError(err)) {
    console.error(`API Error - Status: ${err.response?.status}`, {
      url: err.config?.url,
      data: err.response?.data,
    });
    
    // 새로운 에러 처리 시스템 사용 (서버 에러 응답이 있는 경우)
    if (err.response?.data && err.response.data.errorCode) {
      await ErrorHandler.handleApiError(err.response.data);
    }
    
    message = err.response?.data?.message || err.message;
    errorCode = err.response?.data?.errorCode || 'NETWORK_ERROR';
  } else if (err instanceof Error) {
    message = err.message;
  }

  throw new Error(`${errorCode}: ${message}`);
}

export async function checkForUpdate(): Promise<UpdateCheckResponse> {
  try {
    console.log('Checking for available updates...');
    const response = await axios.get(`${API_BASE_URL}/available-update`);
    return response.data;
  } catch (err) {
    return handleApiError(err);
  }
}

export async function installUpdate(): Promise<UpdateInstallResponse> {
  try {
    console.log('Starting update installation...');
    const response = await axios.post(`${API_BASE_URL}/update`);
    return response.data;
  } catch (err) {
    return handleApiError(err);
  }
}
