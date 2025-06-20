/**
 * 키오스크용 음성 출력(TTS) 유틸리티
 * Web Speech API의 SpeechSynthesis를 활용
 */

class TextToSpeech {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.isSupported = 'speechSynthesis' in window;
    this.currentUtterance = null;
    this.isEnabled = true;
    this.defaultSettings = {
      lang: 'ko-KR',           // 한국어
      rate: 0.9,              // 말하기 속도 (0.1 ~ 10)
      pitch: 1.1,             // 음조 (0 ~ 2)
      volume: 0.8,            // 음량 (0 ~ 1)
      voiceIndex: 0           // 음성 인덱스
    };
    
    // 사용 가능한 음성 목록
    this.voices = [];
    this.loadVoices();
    
    // 음성 목록이 로드되면 다시 설정
    if (this.synthesis) {
      this.synthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  /**
   * 사용 가능한 음성 목록 로드
   */
  loadVoices() {
    if (!this.isSupported) return;
    
    this.voices = this.synthesis.getVoices();
    
    // 한국어 음성 우선 선택
    const koreanVoices = this.voices.filter(voice => 
      voice.lang.startsWith('ko') || voice.lang.includes('KR')
    );
    
    if (koreanVoices.length > 0) {
      this.defaultSettings.voiceIndex = this.voices.indexOf(koreanVoices[0]);
      console.log('✅ 한국어 TTS 음성 발견:', koreanVoices[0].name);
    } else {
      console.warn('⚠️ 한국어 TTS 음성을 찾을 수 없습니다. 기본 음성을 사용합니다.');
    }
  }

  /**
   * TTS 지원 여부 확인
   */
  static isSupported() {
    return 'speechSynthesis' in window;
  }

  /**
   * 브라우저 호환성 확인
   */
  static checkCompatibility() {
    const issues = [];

    if (!window.speechSynthesis) {
      issues.push('SpeechSynthesis API 미지원');
    }

    if (!window.SpeechSynthesisUtterance) {
      issues.push('SpeechSynthesisUtterance API 미지원');
    }

    return {
      supported: issues.length === 0,
      issues
    };
  }

  /**
   * 음성 출력 활성화/비활성화
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  /**
   * 텍스트를 음성으로 출력
   * @param {string} text - 출력할 텍스트
   * @param {Object} options - 음성 옵션
   */
  speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.isSupported) {
        console.warn('⚠️ TTS가 지원되지 않는 브라우저입니다.');
        resolve(false);
        return;
      }

      if (!this.isEnabled) {
        console.log('🔇 TTS가 비활성화되어 있습니다.');
        resolve(false);
        return;
      }

      if (!text || text.trim() === '') {
        console.warn('⚠️ 출력할 텍스트가 비어있습니다.');
        resolve(false);
        return;
      }

      try {
        // 기존 음성 중지
        this.stop();

        // HTML 태그 및 특수 문자 정리
        const cleanText = this.cleanText(text);
        
        // 음성 생성
        this.currentUtterance = new SpeechSynthesisUtterance(cleanText);
        
        // 설정 적용
        const settings = { ...this.defaultSettings, ...options };
        this.currentUtterance.lang = settings.lang;
        this.currentUtterance.rate = settings.rate;
        this.currentUtterance.pitch = settings.pitch;
        this.currentUtterance.volume = settings.volume;

        // 음성 선택
        if (this.voices.length > 0 && this.voices[settings.voiceIndex]) {
          this.currentUtterance.voice = this.voices[settings.voiceIndex];
        }

        // 이벤트 리스너
        this.currentUtterance.onstart = () => {
          console.log('🔊 TTS 시작:', cleanText);
        };

        this.currentUtterance.onend = () => {
          console.log('✅ TTS 완료');
          this.currentUtterance = null;
          resolve(true);
        };

        this.currentUtterance.onerror = (event) => {
          console.error('❌ TTS 오류:', event.error);
          this.currentUtterance = null;
          reject(new Error(`TTS 오류: ${event.error}`));
        };

        this.currentUtterance.onpause = () => {
          console.log('⏸️ TTS 일시정지');
        };

        this.currentUtterance.onresume = () => {
          console.log('▶️ TTS 재개');
        };

        // 음성 출력 시작
        this.synthesis.speak(this.currentUtterance);

      } catch (error) {
        console.error('❌ TTS 실행 중 오류:', error);
        reject(error);
      }
    });
  }

  /**
   * 텍스트 정리 (HTML 태그 제거, 특수 문자 처리)
   */
  cleanText(text) {
    let cleanText = text
      // HTML 태그 제거
      .replace(/<[^>]*>/g, '')
      // HTML 엔티티 디코딩
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // <br> 태그를 공백으로 변환
      .replace(/<br\s*\/?>/gi, ' ')
      // 따옴표 제거
      .replace(/["']/g, '')
      // 이모지 제거 (선택사항)
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
      // 연속된 공백을 하나로
      .replace(/\s+/g, ' ')
      // 앞뒤 공백 제거
      .trim();

    return cleanText;
  }

  /**
   * 음성 출력 중지
   */
  stop() {
    if (!this.isSupported) return;

    try {
      this.synthesis.cancel();
      this.currentUtterance = null;
      console.log('🛑 TTS 중지');
    } catch (error) {
      console.error('❌ TTS 중지 중 오류:', error);
    }
  }

  /**
   * 음성 출력 일시정지
   */
  pause() {
    if (!this.isSupported) return;

    try {
      this.synthesis.pause();
      console.log('⏸️ TTS 일시정지');
    } catch (error) {
      console.error('❌ TTS 일시정지 중 오류:', error);
    }
  }

  /**
   * 음성 출력 재개
   */
  resume() {
    if (!this.isSupported) return;

    try {
      this.synthesis.resume();
      console.log('▶️ TTS 재개');
    } catch (error) {
      console.error('❌ TTS 재개 중 오류:', error);
    }
  }

  /**
   * 현재 음성 출력 중인지 확인
   */
  isSpeaking() {
    return this.isSupported && this.synthesis.speaking;
  }

  /**
   * TTS 설정 변경
   */
  updateSettings(newSettings) {
    this.defaultSettings = { ...this.defaultSettings, ...newSettings };
    console.log('🔧 TTS 설정 업데이트:', this.defaultSettings);
  }

  /**
   * 사용 가능한 음성 목록 반환
   */
  getAvailableVoices() {
    return this.voices.map((voice, index) => ({
      index,
      name: voice.name,
      lang: voice.lang,
      localService: voice.localService,
      default: voice.default
    }));
  }

  /**
   * 키오스크 전용 빠른 안내 메시지들
   */
  speakWelcome() {
    return this.speak('안녕하세요! 궁금하신 내용을 말씀해주시면 제가 안내해드릴게요.', {
      rate: 0.8,
      pitch: 1.2
    });
  }

  speakListening() {
    return this.speak('음성을 듣고 있습니다. 말씀해 주세요.', {
      rate: 1.0,
      pitch: 1.1
    });
  }

  speakProcessing() {
    return this.speak('음성을 분석하고 있습니다. 잠시만 기다려 주세요.', {
      rate: 0.9,
      pitch: 1.0
    });
  }

  speakError() {
    return this.speak('죄송합니다. 다시 말씀해 주세요.', {
      rate: 0.8,
      pitch: 0.9
    });
  }

  speakReception() {
    return this.speak('접수하기 버튼을 눌러주세요.', {
      rate: 0.9,
      pitch: 1.1
    });
  }

  speakComplete() {
    return this.speak('접수가 완료되었습니다. 1번 창구로 이동해주세요.', {
      rate: 0.8,
      pitch: 1.2
    });
  }
}

// 싱글톤 인스턴스 생성
const textToSpeech = new TextToSpeech();

export default textToSpeech;

// 개별 함수들도 export
export const {
  speak,
  stop,
  pause,
  resume,
  isSpeaking,
  setEnabled,
  updateSettings,
  getAvailableVoices,
  speakWelcome,
  speakListening,
  speakProcessing,
  speakError,
  speakReception,
  speakComplete
} = textToSpeech;