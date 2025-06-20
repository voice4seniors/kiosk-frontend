/**
 * 브라우저에서 음성 녹음 및 처리 유틸리티
 */

class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.isRecording = false;
  }

  /**
   * 마이크 접근 권한 요청 및 스트림 초기화
   */
  async initialize() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Whisper에 적합한 샘플레이트
        } 
      });
      
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: this.getSupportedMimeType()
      });

      this.setupEventListeners();
      return true;
    } catch (error) {
      console.error('마이크 접근 실패:', error);
      throw new Error('마이크에 접근할 수 없습니다. 권한을 확인해주세요.');
    }
  }

  /**
   * 지원되는 MIME 타입 확인
   */
  getSupportedMimeType() {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/wav'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    
    return ''; // 기본값
  }

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      // 녹음 완료 후 처리는 외부에서 Promise로 관리
    };

    this.mediaRecorder.onerror = (event) => {
      console.error('녹음 오류:', event.error);
    };
  }

  /**
   * 녹음 시작
   * @param {number} duration - 녹음 시간(초), 0이면 수동 중지
   */
  startRecording(duration = 0) {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('녹음기가 초기화되지 않았습니다.'));
        return;
      }

      if (this.isRecording) {
        reject(new Error('이미 녹음 중입니다.'));
        return;
      }

      // 이전 녹음 데이터 초기화
      this.audioChunks = [];
      this.isRecording = true;

      // 녹음 완료 이벤트 리스너
      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
        const audioBlob = new Blob(this.audioChunks, { 
          type: this.mediaRecorder.mimeType 
        });
        resolve(audioBlob);
      };

      // 녹음 시작
      this.mediaRecorder.start();

      // 지정된 시간 후 자동 중지
      if (duration > 0) {
        setTimeout(() => {
          if (this.isRecording) {
            this.stopRecording();
          }
        }, duration * 1000);
      }
    });
  }

  /**
   * 녹음 중지
   */
  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
  }

  /**
   * 녹음 취소
   */
  cancelRecording() {
    if (this.isRecording) {
      this.isRecording = false;
      this.mediaRecorder.stop();
      this.audioChunks = [];
    }
  }

  /**
   * 리소스 정리
   */
  cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
  }

  /**
   * 오디오 Blob을 WAV 형식으로 변환 (선택사항)
   */
  async convertToWav(audioBlob) {
    // 실제 WAV 변환은 복잡하므로, 
    // 서버에서 다양한 형식을 지원하는 것이 더 효율적
    return audioBlob;
  }

  /**
   * 녹음 가능 여부 확인
   */
  static isSupported() {
    return !!(navigator.mediaDevices && 
              navigator.mediaDevices.getUserMedia && 
              window.MediaRecorder);
  }

  /**
   * 브라우저 호환성 확인
   */
  static checkCompatibility() {
    const issues = [];

    if (!navigator.mediaDevices) {
      issues.push('MediaDevices API 미지원');
    }

    if (!navigator.mediaDevices.getUserMedia) {
      issues.push('getUserMedia API 미지원');
    }

    if (!window.MediaRecorder) {
      issues.push('MediaRecorder API 미지원');
    }

    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      issues.push('HTTPS 연결 필요 (마이크 접근용)');
    }

    return {
      supported: issues.length === 0,
      issues
    };
  }
}

export default AudioRecorder;

// 유틸리티 함수들
export const audioUtils = {
  /**
   * 오디오 Blob의 길이(초) 계산
   */
  async getDuration(audioBlob) {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.addEventListener('loadedmetadata', () => {
        resolve(audio.duration);
      });
      audio.src = URL.createObjectURL(audioBlob);
    });
  },

  /**
   * 오디오 미리보기 생성
   */
  createPreviewUrl(audioBlob) {
    return URL.createObjectURL(audioBlob);
  },

  /**
   * 미리보기 URL 해제
   */
  revokePreviewUrl(url) {
    URL.revokeObjectURL(url);
  }
};