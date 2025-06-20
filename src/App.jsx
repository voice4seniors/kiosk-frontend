import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import kioskAPI from "./services/kioskAPI";
import AudioRecorder from "./utils/audioRecorder";
import textToSpeech from "./utils/textToSpeech";

function App() {
  const [step, setStep] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [showConnectionStatus, setShowConnectionStatus] = useState(true);
  const [currentIntent, setCurrentIntent] = useState(null);
  const [recognizedText, setRecognizedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [audioSupported, setAudioSupported] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const audioRecorderRef = useRef(null);
  const recognitionTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    checkBackendConnection();
    checkAudioSupport();
    initializeAudioRecorder();
    checkTTSSupport();
    
    // 환영 메시지 음성 출력
    setTimeout(() => {
      if (ttsEnabled) {
        speakWelcomeMessage();
      }
    }, 2000);
    
    return () => {
      cleanup();
    };
  }, []);

  // 연결 상태가 성공으로 변경된 후 3초 뒤에 숨기기
  useEffect(() => {
    if (connectionStatus === 'connected') {
      const timer = setTimeout(() => {
        setShowConnectionStatus(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [connectionStatus]);

  // TTS 상태 모니터링
  useEffect(() => {
    const checkSpeaking = () => {
      setIsSpeaking(textToSpeech.isSpeaking());
    };
    
    const interval = setInterval(checkSpeaking, 500);
    return () => clearInterval(interval);
  }, []);

  /**
   * TTS 지원 확인
   */
  const checkTTSSupport = () => {
    const compatibility = textToSpeech.constructor.checkCompatibility();
    if (!compatibility.supported) {
      console.warn('⚠️ TTS 지원 문제:', compatibility.issues);
      setTtsEnabled(false);
    }
  };

  /**
   * 환영 메시지 음성 출력
   */
  const speakWelcomeMessage = async () => {
    try {
      await textToSpeech.speakWelcome();
    } catch (error) {
      console.error('환영 메시지 TTS 실패:', error);
    }
  };

  /**
   * 단계별 안내 메시지 음성 출력
   */
  const speakStepMessage = async (step, intent = null) => {
    if (!ttsEnabled) return;

    try {
      let message = '';
      
      switch (step) {
        case 0:
          message = '안녕하세요! 궁금하신 내용을 말씀해주시면 제가 안내해드릴게요.';
          break;
        case 1:
          if (intent) {
            message = `${intent.intent_description} 요청사항을 확인했습니다. 접수하기 버튼을 눌러주세요.`;
          } else {
            message = '요청사항을 확인했습니다. 접수하기 버튼을 눌러주세요.';
          }
          break;
        case 2:
          message = '접수가 완료되었습니다. 1번 창구로 이동해주세요.';
          break;
      }
      
      if (message) {
        await textToSpeech.speak(message, { rate: 0.9, pitch: 1.1 });
      }
    } catch (error) {
      console.error('단계 메시지 TTS 실패:', error);
    }
  };

  /**
   * 인식 결과 음성 출력
   */
  const speakRecognitionResult = async (result) => {
    if (!ttsEnabled) return;

    try {
      const message = `${result.transcribed_text}로 인식했습니다. ${result.intent_description} 관련 업무로 안내해드리겠습니다.`;
      await textToSpeech.speak(message, { rate: 0.8, pitch: 1.0 });
    } catch (error) {
      console.error('인식 결과 TTS 실패:', error);
    }
  };

  /**
   * 리소스 정리
   */
  const cleanup = () => {
    textToSpeech.stop();
    if (audioRecorderRef.current) {
      audioRecorderRef.current.cleanup();
    }
    if (recognitionTimeoutRef.current) {
      clearTimeout(recognitionTimeoutRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
  };

  /**
   * 오디오 지원 확인
   */
  const checkAudioSupport = () => {
    const compatibility = AudioRecorder.checkCompatibility();
    setAudioSupported(compatibility.supported);
    
    if (!compatibility.supported) {
      console.warn('⚠️ 오디오 지원 문제:', compatibility.issues);
    }
  };

  /**
   * 백엔드 서버 연결 상태 확인
   */
  const checkBackendConnection = async () => {
    try {
      setConnectionStatus('checking');
      const result = await kioskAPI.checkConnection();
      
      if (result.connected) {
        setConnectionStatus('connected');
        console.log('✅ 백엔드 연결 성공:', result.serverInfo);
      } else {
        setConnectionStatus('error');
        console.error('❌ 백엔드 연결 실패:', result.error);
      }
    } catch (error) {
      setConnectionStatus('error');
      console.error('❌ 연결 확인 중 오류:', error);
    }
  };

  /**
   * 오디오 녹음기 초기화
   */
  const initializeAudioRecorder = async () => {
    try {
      if (!AudioRecorder.isSupported()) {
        console.warn('⚠️ 오디오 녹음이 지원되지 않는 브라우저입니다.');
        return;
      }

      audioRecorderRef.current = new AudioRecorder();
      await audioRecorderRef.current.initialize();
      console.log('✅ 오디오 녹음기 초기화 완료');
    } catch (error) {
      console.error('❌ 오디오 녹음기 초기화 실패:', error);
      setAudioSupported(false);
    }
  };

  /**
   * 카운트다운 시작
   */
  const startCountdown = (seconds) => {
    setCountdown(seconds);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  /**
   * 마이크 버튼 클릭 핸들러
   */
  const handleMicClick = async () => {
    if (connectionStatus !== 'connected') {
      const errorMsg = '백엔드 서버에 연결되지 않았습니다. 연결을 확인한 후 다시 시도해주세요.';
      alert(`🔌 ${errorMsg}`);
      if (ttsEnabled) {
        await textToSpeech.speak(errorMsg);
      }
      return;
    }

    if (!audioSupported) {
      const errorMsg = '이 브라우저에서는 음성 입력이 지원되지 않습니다. 최신 브라우저를 사용해주세요.';
      alert(`🎤 ${errorMsg}`);
      if (ttsEnabled) {
        await textToSpeech.speak(errorMsg);
      }
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  /**
   * 음성 인식 시작
   */
  const startListening = async () => {
    try {
      // 현재 재생 중인 TTS 중지
      textToSpeech.stop();

      if (!audioRecorderRef.current) {
        await initializeAudioRecorder();
        if (!audioRecorderRef.current) {
          throw new Error('오디오 녹음기 초기화에 실패했습니다.');
        }
      }

      setIsListening(true);
      setIsProcessing(false);
      setRecognizedText('');
      setCurrentIntent(null);
      
      // 녹음 시작 안내 음성
      if (ttsEnabled) {
        await textToSpeech.speakListening();
      }
      
      // 5초 카운트다운 시작
      startCountdown(5);

      console.log('🎤 음성 인식 시작...');

      // 5초간 녹음
      const audioBlob = await audioRecorderRef.current.startRecording(5);
      
      setIsListening(false);
      setCountdown(0);
      setIsProcessing(true);

      // 처리 중 안내 음성
      if (ttsEnabled) {
        textToSpeech.speakProcessing();
      }

      console.log('📤 음성 데이터 전송 중...');

      // 백엔드로 음성 데이터 전송
      const result = await kioskAPI.uploadVoice(audioBlob);

      if (result.success) {
        setRecognizedText(result.transcribed_text);
        setCurrentIntent(result);
        
        console.log('✅ 음성 인식 완료:', result);

        // 성공 효과음
        playSuccessSound();

        // 인식 결과 음성 출력
        if (ttsEnabled) {
          await speakRecognitionResult(result);
        }

        // 인식된 의도에 따라 다음 단계 진행
        await handleIntentResult(result);
      } else {
        throw new Error(result.message || '음성 인식에 실패했습니다.');
      }

    } catch (error) {
      console.error('❌ 음성 인식 실패:', error);
      
      // 에러 타입에 따른 다른 메시지
      let errorMessage = '음성 인식에 실패했습니다.';
      if (error.message.includes('Permission')) {
        errorMessage = '마이크 권한이 필요합니다. 브라우저 설정에서 마이크 접근을 허용해주세요.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = '네트워크 연결을 확인해주세요.';
      }
      
      alert(`🎤 ${errorMessage}`);
      
      // 에러 메시지 음성 출력
      if (ttsEnabled) {
        await textToSpeech.speak('죄송합니다. ' + errorMessage);
      }
    } finally {
      setIsListening(false);
      setIsProcessing(false);
      setCountdown(0);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    }
  };

  /**
   * 성공 효과음 재생
   */
  const playSuccessSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      // 효과음 재생 실패해도 무시
    }
  };

  /**
   * 음성 인식 중지
   */
  const stopListening = () => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stopRecording();
    }
    setIsListening(false);
    setCountdown(0);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
  };

  /**
   * 인식된 의도에 따른 처리
   */
  const handleIntentResult = async (intentResult) => {
    try {
      // 백엔드에서 의도별 처리 정보 가져오기
      const processResult = await kioskAPI.processIntent(intentResult.predicted_intent);
      
      console.log('📋 의도 처리 결과:', processResult);

      // 신뢰도가 낮으면 재확인 요청
      if (intentResult.confidence < 0.7) {
        const confirmMsg = `${intentResult.intent_description}이 맞으신가요? 확실하지 않다면 다시 말씀해 주세요.`;
        
        if (ttsEnabled) {
          await textToSpeech.speak(confirmMsg);
        }
        
        setTimeout(() => {
          if (confirm(`🤔 "${intentResult.intent_description}"이(가) 맞으신가요?\n\n확실하지 않다면 다시 말씀해 주세요.`)) {
            proceedWithIntent(intentResult.predicted_intent, intentResult);
          }
        }, 1000);
        return;
      }

      // 의도에 따라 UI 상태 변경
      proceedWithIntent(intentResult.predicted_intent, intentResult);

    } catch (error) {
      console.error('❌ 의도 처리 실패:', error);
    }
  };

  /**
   * 의도에 따른 단계 진행
   */
  const proceedWithIntent = async (intentId, intent = null) => {
    switch (intentId) {
      case 0: // 증명서 발급
      case 1: // 주소 변경
      case 2: // 여권 발급
        setStep(1);
        // 단계 변경 후 음성 안내
        setTimeout(() => {
          speakStepMessage(1, intent);
        }, 500);
        break;
      case 3: // 직원 호출
        setStep(2);
        if (ttsEnabled) {
          await textToSpeech.speak('직원을 호출하고 있습니다. 잠시만 기다려 주세요.');
        }
        break;
      case 4: // 시작화면
        resetToHome();
        break;
      default:
        console.warn('알 수 없는 의도:', intentId);
    }
  };

  /**
   * 홈 화면으로 리셋
   */
  const resetToHome = () => {
    textToSpeech.stop();
    setStep(0);
    setRecognizedText('');
    setCurrentIntent(null);
    setIsProcessing(false);
    setIsListening(false);
    setCountdown(0);
    
    // 홈 화면 안내 음성
    setTimeout(() => {
      speakStepMessage(0);
    }, 500);
  };

  /**
   * 시연용 시뮬레이션
   */
  const handleSimulateVoice = async () => {
    try {
      setIsProcessing(true);
      const result = await kioskAPI.simulateVoiceInput();
      
      if (result.success) {
        setRecognizedText(result.transcribed_text);
        setCurrentIntent(result);
        playSuccessSound();
        
        if (ttsEnabled) {
          await speakRecognitionResult(result);
        }
        
        await handleIntentResult(result);
      }
    } catch (error) {
      console.error('❌ 시뮬레이션 실패:', error);
      alert('시뮬레이션 실행에 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * 접수하기 버튼 클릭 핸들러
   */
  const handleReceptionClick = async () => {
    if (currentIntent) {
      try {
        const processResult = await kioskAPI.processIntent(currentIntent.predicted_intent);
        console.log('📋 접수 처리:', processResult);
        
        // 접수 완료 메시지
        const completeMsg = `${currentIntent.intent_description} 접수가 완료되었습니다. 창구에서 대기해 주세요.`;
        alert(`✅ ${completeMsg}`);
        
        // 접수 완료 음성 안내
        if (ttsEnabled) {
          await textToSpeech.speak(completeMsg);
        }
      } catch (error) {
        console.error('❌ 접수 처리 실패:', error);
        const errorMsg = '접수 처리 중 오류가 발생했습니다. 다시 시도해 주세요.';
        alert(errorMsg);
        
        if (ttsEnabled) {
          await textToSpeech.speak(errorMsg);
        }
      }
    }
    setStep(2);
    
    // 단계 변경 후 음성 안내
    setTimeout(() => {
      speakStepMessage(2);
    }, 1000);
  };

  /**
   * TTS 토글 핸들러
   */
  const toggleTTS = () => {
    const newState = !ttsEnabled;
    setTtsEnabled(newState);
    textToSpeech.setEnabled(newState);
    
    if (newState) {
      textToSpeech.speak('음성 안내가 활성화되었습니다.');
    }
  };

  /**
   * 연결 상태 표시
   */
  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case 'checking':
        return '🔄 서버 연결 확인 중...';
      case 'connected':
        return '✅ 서버 연결됨';
      case 'error':
        return '❌ 서버 연결 실패';
      default:
        return '';
    }
  };

  /**
   * 마이크 버튼 상태에 따른 텍스트
   */
  const getMicButtonText = () => {
    if (isListening) {
      return `🎤 듣는 중... ${countdown > 0 ? `(${countdown}초)` : ''}`;
    } else if (isProcessing) {
      return '🤖 분석 중...';
    } else if (isSpeaking) {
      return '🔊 음성 안내 중...';
    } else {
      return '마이크를 클릭하여 말씀하세요';
    }
  };

  return (
    <div className="wrapper">
      <div className="kiosk-container animate-fadeIn">
        <div className="kiosk-title">🏛️ 숙명 주민센터 안내 도우미</div>
        
        {/* TTS 제어 버튼 */}
        <div style={{
          position: 'absolute',
          top: '15px',
          right: '15px'
        }}>
          <button
            onClick={toggleTTS}
            style={{
              background: ttsEnabled ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            title={ttsEnabled ? '음성 안내 끄기' : '음성 안내 켜기'}
          >
            {ttsEnabled ? '🔊 음성 ON' : '🔇 음성 OFF'}
          </button>
        </div>
        
        {/* 연결 상태 표시 - 처음에만 표시하고 성공시 3초 후 사라짐 */}
        {showConnectionStatus && (
          <div 
            className="connection-status animate-slideInDown" 
            style={{
              fontSize: '13px',
              color: connectionStatus === 'connected' ? '#28a745' : '#dc3545',
              marginBottom: '15px'
            }}
          >
            {getConnectionStatusDisplay()}
          </div>
        )}

        {/* 마이크 버튼 */}
        <button
          className={`mic-btn ${isListening ? 'listening' : ''} ${isProcessing ? 'processing' : ''} ${isSpeaking ? 'speaking' : ''}`}
          type="button"
          aria-label={getMicButtonText()}
          tabIndex={0}
          onClick={handleMicClick}
          disabled={isProcessing || connectionStatus !== 'connected' || isSpeaking}
        >
          <img
            src="https://img.icons8.com/flat-round/64/microphone--v1.png"
            alt="마이크"
            className="kiosk-mic"
          />
        </button>

        {/* 마이크 버튼 안내 텍스트 */}
        <div style={{ 
          fontSize: '12px', 
          color: '#6c757d', 
          marginBottom: '15px',
          minHeight: '20px'
        }}>
          {getMicButtonText()}
        </div>

        {/* 음성 인식 상태 표시 */}
        {isListening && (
          <div className="listening-indicator animate-slideInUp">
            🎤 음성을 듣고 있습니다... 
            {countdown > 0 && <span className="font-bold">({countdown}초)</span>}
          </div>
        )}

        {isProcessing && (
          <div className="processing-indicator animate-slideInUp">
            🤖 음성을 분석하고 있습니다...
            <div className="animate-spin" style={{ display: 'inline-block', marginLeft: '8px' }}>⚙️</div>
          </div>
        )}

        {isSpeaking && (
          <div className="speaking-indicator animate-slideInUp" style={{
            background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
            border: '2px solid #4caf50',
            borderRadius: '25px',
            padding: '12px 20px',
            margin: '15px auto',
            maxWidth: '280px',
            textAlign: 'center',
            fontWeight: '700',
            color: '#2e7d32'
          }}>
            🔊 음성 안내 중입니다...
          </div>
        )}

        {/* 인식된 텍스트 표시 - 아이콘 겹침 문제 해결 */}
        {recognizedText && (
          <div className="recognized-text animate-slideInUp" style={{ position: 'relative' }}>
            {/* 채팅 아이콘을 텍스트 위쪽으로 이동 */}
            <div style={{
              position: 'absolute',
              top: '-15px',
              left: '15px',
              background: '#28a745',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              💬 인식결과
            </div>
            
            <div style={{ paddingTop: '10px' }}>
              <strong>👂 인식된 내용:</strong> "{recognizedText}"
              {currentIntent && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                  🎯 <strong>의도:</strong> {currentIntent.intent_description} 
                  <br />
                  📊 <strong>신뢰도:</strong> {(currentIntent.confidence * 100).toFixed(1)}%
                  {currentIntent.confidence < 0.7 && (
                    <span style={{ color: '#f39c12', fontWeight: 'bold' }}> (재확인 필요)</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 기존 단계별 UI - 색상 개선 */}
        {step === 0 && (
          <div className="animate-slideInUp">
            <div className="kiosk-message">
              "안녕하세요! 🙋‍♀️<br />
              궁금하신 내용을 말씀해주시면<br />
              제가 안내해드릴게요"
            </div>
            <div className="kiosk-desc" style={{ 
              background: 'rgba(255, 255, 255, 0.9)',
              color: '#495057',
              border: '1px solid rgba(0, 0, 0, 0.1)'
            }}>
              <strong style={{ color: '#2c3e50' }}>📢 이렇게 말씀해 주세요:</strong><br />
              <span style={{ color: '#495057' }}>💳 "등본 발급해주세요"</span><br />
              <span style={{ color: '#495057' }}>🏠 "주소 변경하러 왔어요"</span><br />
              <span style={{ color: '#495057' }}>📘 "여권 만들고 싶어요"</span><br />
              <span style={{ color: '#495057' }}>🆘 "직원 불러주세요"</span><br />
              <span style={{ color: '#495057' }}>🔄 "처음으로 돌아가줘"</span>
            </div>
            
            {/* 오디오 지원 경고 */}
            {!audioSupported && (
              <div style={{
                background: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '8px',
                padding: '10px',
                marginTop: '15px',
                fontSize: '12px',
                color: '#856404'
              }}>
                ⚠️ 음성 입력이 지원되지 않습니다.<br />
                HTTPS 연결이나 최신 브라우저를 사용해주세요.
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="animate-slideInUp">
            <div className="kiosk-message">
              "✅ 요청사항을 확인했습니다<br />
              접수하기 버튼을 눌러주세요"
            </div>
            
            {currentIntent && (
              <div style={{
                background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                border: '2px solid #2196f3',
                borderRadius: '12px',
                padding: '15px',
                margin: '15px 0',
                fontSize: '14px',
                color: '#1565c0'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#0d47a1' }}>
                  📋 처리할 업무: {currentIntent.intent_description}
                </div>
                <div style={{ fontSize: '12px', color: '#1976d2' }}>
                  🕐 예상 소요시간: 5-10분<br />
                  💰 수수료: 업무에 따라 상이
                </div>
              </div>
            )}
            
            <button className="kiosk-btn animate-scaleIn" onClick={handleReceptionClick}>
              📝 접수하기
            </button>
            
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#495057' }}>
              다른 업무가 필요하시면 마이크 버튼을 다시 눌러주세요
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-slideInUp">
            <div className="kiosk-message">
              "🎉 접수가 완료되었습니다<br />
              <strong>1번 창구</strong>로 이동해주세요"
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
              border: '2px solid #4caf50',
              borderRadius: '12px',
              padding: '20px',
              margin: '20px 0',
              fontSize: '14px',
              color: '#2e7d32'
            }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: '#1b5e20' }}>
                📍 다음 단계 안내
              </div>
              <div style={{ color: '#388e3c' }}>
                1️⃣ <strong>1번 창구</strong>로 이동<br />
                2️⃣ 번호표 지참<br />
                3️⃣ 신분증 준비<br />
                4️⃣ 순서대로 대기
              </div>
            </div>
            
            <button 
              className="kiosk-btn" 
              onClick={resetToHome}
              style={{ 
                background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
                marginTop: '15px'
              }}
            >
              🏠 처음으로 돌아가기
            </button>
          </div>
        )}

        {/* 개발 환경에서만 표시되는 시뮬레이션 버튼 */}
        {import.meta.env.DEV && (
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px'
          }}>
            <button 
              onClick={handleSimulateVoice}
              disabled={isProcessing || connectionStatus !== 'connected'}
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
              title="음성 시뮬레이션 (개발용)"
            >
              🎭 시뮬레이션
            </button>
          </div>
        )}

        {/* 도움말 링크 */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          right: '15px',
          fontSize: '10px',
          color: '#adb5bd'
        }}>
          <button
            onClick={() => {
              const helpMsg = '도움이 필요하시면 직원 불러주세요라고 말씀하세요. 또는 근처 직원에게 문의하세요. 비상시 내선 1234번입니다.';
              alert('🆘 도움이 필요하시면:\n\n1️⃣ "직원 불러주세요"라고 말씀하세요\n2️⃣ 또는 근처 직원에게 문의하세요\n3️⃣ 비상시: 내선 1234');
              if (ttsEnabled) {
                textToSpeech.speak(helpMsg);
              }
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#adb5bd',
              fontSize: '10px',
              cursor: 'pointer',
              padding: '2px'
            }}
            title="도움말 보기"
          >
            ❓ 도움말
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;