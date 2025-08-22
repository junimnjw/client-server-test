import axios from 'axios';
import { ErrorHandler } from '../error/error-handler';

const SDK_INIT_ENDPOINT = 'http://localhost:12345/api/v1/sdk-init';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 300000; // 300 seconds per request

/**
 * Initializes the SDK by making a request to the backend service
 * @returns Promise resolving to the SDK initialization status and message
 * @throws {Error} When initialization fails after all retries
 */
export async function sdkInit(): Promise<{ status: string; message: string }> {
  let _lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.post(
        SDK_INIT_ENDPOINT,
        {},
        {
          timeout: REQUEST_TIMEOUT_MS,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      _lastError = error;

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          console.warn(`SDK initialization attempt ${attempt} timed out`);
        } else if (error.response) {
          console.warn(
            `SDK initialization attempt ${attempt} failed with status ${error.response.status}`
          );
          
          // 새로운 에러 처리 시스템 사용 (서버 에러 응답이 있는 경우)
          if (error.response.data && error.response.data.errorCode) {
            await ErrorHandler.handleApiError(error.response.data);
          }
        } else {
          console.warn(`SDK initialization attempt ${attempt} failed: ${error.message}`);
        }
      } else {
        console.warn(`SDK initialization attempt ${attempt} failed`, error);
      }

      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  console.error('All SDK initialization attempts failed');
  throw new Error('Failed to initialize SDK after multiple attempts');
}
