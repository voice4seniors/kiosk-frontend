/**
 * 키오스크 백엔드 API 서비스
 * FastAPI 백엔드와 통신하는 모든 API 호출을 관리
 */

// 백엔드 서버 URL (개발환경)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class KioskAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * 서버 상태 확인
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  /**
   * 서버 기본 정보 조회
   */
  async getServerInfo() {
    try {
      const response = await fetch(`${this.baseURL}/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Server info failed:', error);
      throw error;
    }
  }

  /**
   * 텍스트에서 의도 분류
   * @param {string} text - 분류할 텍스트
   */
  async classifyText(text) {
    try {
      const response = await fetch(`${this.baseURL}/text-to-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Text classification failed:', error);
      throw error;
    }
  }

  /**
   * 음성 파일을 업로드하여 의도 분류
   * @param {Blob} audioBlob - 음성 데이터
   * @param {string} filename - 파일명 (선택사항)
   */
  async uploadVoice(audioBlob, filename = 'voice.wav') {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, filename);

      const response = await fetch(`${this.baseURL}/voice-to-intent`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Voice upload failed:', error);
      throw error;
    }
  }

  /**
   * 특정 의도에 대한 처리 실행
   * @param {number} intentId - 의도 ID (0-4)
   */
  async processIntent(intentId) {
    try {
      const response = await fetch(`${this.baseURL}/process-intent/${intentId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Intent processing failed:', error);
      throw error;
    }
  }

  /**
   * 사용 가능한 의도 목록 조회
   */
  async getIntents() {
    try {
      const response = await fetch(`${this.baseURL}/intents`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Get intents failed:', error);
      throw error;
    }
  }

  /**
   * 시연용 예제 문장 조회
   */
  async getDemoExamples() {
    try {
      const response = await fetch(`${this.baseURL}/demo/examples`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Get demo examples failed:', error);
      throw error;
    }
  }

  /**
   * 시연용 음성 입력 시뮬레이션
   */
  async simulateVoiceInput() {
    try {
      const response = await fetch(`${this.baseURL}/demo/simulate-voice`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Voice simulation failed:', error);
      throw error;
    }
  }

  /**
   * 서버 연결 상태 확인
   */
  async checkConnection() {
    try {
      const result = await this.healthCheck();
      return {
        connected: true,
        modelStatus: result.models_loaded,
        serverInfo: result
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }
}

// 싱글톤 인스턴스 생성
const kioskAPI = new KioskAPI();

export default kioskAPI;

// 개별 함수들도 export (필요한 경우)
export const {
  healthCheck,
  getServerInfo,
  classifyText,
  uploadVoice,
  processIntent,
  getIntents,
  getDemoExamples,
  simulateVoiceInput,
  checkConnection
} = kioskAPI;