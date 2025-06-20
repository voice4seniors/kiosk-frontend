import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 키오스크 애플리케이션 초기화 및 실행
console.log('🚀 키오스크 애플리케이션 시작');

// 환경 정보 출력 (개발 환경에서만)
if (import.meta.env.DEV) {
  console.log('🔧 개발 환경:', {
    mode: import.meta.env.MODE,
    base: import.meta.env.BASE_URL,
    apiUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
  });
  
  // 브라우저 호환성 체크
  console.log('🌐 브라우저 호환성 체크:');
  console.log('- MediaRecorder:', !!window.MediaRecorder);
  console.log('- getUserMedia:', !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
  console.log('- Web Audio API:', !!window.AudioContext || !!window.webkitAudioContext);
  console.log('- Fetch API:', !!window.fetch);
  console.log('- WebRTC:', !!window.RTCPeerConnection);
}

// 에러 처리
window.addEventListener('error', (event) => {
  console.error('🚨 전역 에러 발생:', event.error);
  
  // 사용자에게 친화적인 에러 메시지 (운영 환경에서)
  if (!import.meta.env.DEV) {
    // 운영 환경에서는 간단한 알림만
    setTimeout(() => {
      alert('일시적인 문제가 발생했습니다.\n페이지를 새로고침 하거나 잠시 후 다시 시도해주세요.');
    }, 1000);
  }
});

// Promise 에러 처리
window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 처리되지 않은 Promise 에러:', event.reason);
  
  // 특정 에러에 대한 사용자 안내
  const reason = event.reason?.message || event.reason;
  if (typeof reason === 'string') {
    if (reason.includes('fetch')) {
      console.warn('⚠️ 네트워크 연결 문제가 감지되었습니다.');
    } else if (reason.includes('Permission')) {
      console.warn('⚠️ 권한 문제가 감지되었습니다.');
    }
  }
});

// 온라인/오프라인 상태 감지
window.addEventListener('online', () => {
  console.log('🌐 네트워크 연결됨');
});

window.addEventListener('offline', () => {
  console.warn('📵 네트워크 연결 끊김');
  if (!import.meta.env.DEV) {
    alert('⚠️ 인터넷 연결이 끊어졌습니다.\n연결을 확인한 후 다시 시도해주세요.');
  }
});

// 페이지 가시성 변경 감지 (백그라운드/포그라운드)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('⏸️ 페이지가 백그라운드로 이동');
  } else {
    console.log('▶️ 페이지가 포그라운드로 복귀');
  }
});

// 키오스크 전용 설정
const configureKioskEnvironment = () => {
  // 키오스크 모드에서 우클릭 방지 (선택사항)
  if (import.meta.env.VITE_KIOSK_MODE === 'true') {
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // F5, Ctrl+R 등 새로고침 방지 (키오스크 환경에서)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
        e.preventDefault();
        console.log('🛡️ 새로고침 방지됨 (키오스크 모드)');
      }
    });
  }
  
  // 장시간 비활성 감지 (선택사항)
  let inactivityTimer;
  const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5분
  
  const resetInactivityTimer = () => {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      console.log('⏰ 장시간 비활성 상태 감지');
      // 자동으로 홈 화면으로 이동하는 이벤트 발생
      window.dispatchEvent(new CustomEvent('kiosk:reset'));
    }, INACTIVITY_TIMEOUT);
  };
  
  // 사용자 활동 감지 이벤트들
  ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, resetInactivityTimer, true);
  });
  
  resetInactivityTimer();
};

// 키오스크 환경 설정 실행
if (import.meta.env.VITE_KIOSK_MODE === 'true') {
  configureKioskEnvironment();
}

// 성능 모니터링 (개발 환경에서만)
if (import.meta.env.DEV) {
  // 페이지 로드 성능 측정
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.timing;
      const loadTime = perfData.loadEventEnd - perfData.navigationStart;
      console.log(`📊 페이지 로드 시간: ${loadTime}ms`);
      
      // 메모리 사용량 (Chrome 계열 브라우저)
      if (performance.memory) {
        console.log(`💾 메모리 사용량: ${Math.round(performance.memory.usedJSHeapSize / 1048576)}MB`);
      }
    }, 0);
  });
}

// React 애플리케이션 마운트
const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('❌ Root 엘리먼트를 찾을 수 없습니다.');
  document.body.innerHTML = `
    <div style="
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-family: sans-serif;
      text-align: center;
    ">
      <div>
        <h1>⚠️ 애플리케이션 로드 실패</h1>
        <p>페이지를 새로고침하거나 관리자에게 문의하세요.</p>
        <button 
          onclick="location.reload()" 
          style="
            background: white;
            color: #764ba2;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 20px;
          "
        >
          🔄 새로고침
        </button>
      </div>
    </div>
  `;
} else {
  try {
    const root = createRoot(rootElement);
    
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    
    console.log('✅ React 애플리케이션 마운트 완료');
    
    // 마운트 성공 후 로딩 스크린 제거 (index.html의 로딩 화면)
    setTimeout(() => {
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        loadingScreen.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
          loadingScreen.remove();
          console.log('🎬 로딩 화면 제거 완료');
        }, 500);
      }
    }, 1000);
    
  } catch (error) {
    console.error('❌ React 애플리케이션 마운트 실패:', error);
    
    // 폴백 UI 표시
    rootElement.innerHTML = `
      <div style="
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-family: 'Noto Sans KR', sans-serif;
        text-align: center;
        padding: 20px;
      ">
        <div style="
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 40px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        ">
          <h1 style="margin-bottom: 20px;">🚨 시스템 오류</h1>
          <p style="margin-bottom: 20px; line-height: 1.6;">
            키오스크 시스템에 문제가 발생했습니다.<br>
            관리자에게 문의하거나 페이지를 새로고침 해주세요.
          </p>
          <div style="margin-bottom: 20px; font-size: 12px; opacity: 0.8;">
            오류 내용: ${error.message}
          </div>
          <button 
            onclick="location.reload()" 
            style="
              background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
              color: white;
              border: none;
              padding: 15px 30px;
              border-radius: 10px;
              cursor: pointer;
              font-size: 16px;
              font-weight: bold;
              transition: transform 0.2s ease;
            "
            onmouseover="this.style.transform='translateY(-2px)'"
            onmouseout="this.style.transform='translateY(0)'"
          >
            🔄 시스템 재시작
          </button>
        </div>
      </div>
    `;
  }
}

// 개발 환경에서 React DevTools 활성화 안내
if (import.meta.env.DEV) {
  console.log(`
🛠️  개발자 도구 안내:
┌─────────────────────────────────────────────┐
│  React DevTools 확장프로그램을 설치하면     │
│  컴포넌트 디버깅이 더욱 편리합니다.         │
│                                             │
│  🔗 Chrome: React Developer Tools          │
│  🔗 Firefox: React Developer Tools         │
│                                             │
│  💡 개발 서버 종료: Ctrl + C               │
│  💡 브라우저 새로고침: F5 또는 Ctrl + R    │
└─────────────────────────────────────────────┘
  `);
  
  // Hot Module Replacement (HMR) 설정
  if (import.meta.hot) {
    import.meta.hot.accept(() => {
      console.log('🔥 HMR: 모듈이 업데이트되었습니다.');
    });
    
    import.meta.hot.dispose(() => {
      console.log('🗑️ HMR: 이전 모듈을 정리합니다.');
    });
  }
}

// 키오스크 전용 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', () => {
  // 키오스크 리셋 이벤트 리스너
  window.addEventListener('kiosk:reset', () => {
    console.log('🔄 키오스크 자동 리셋 실행');
    // 실제로는 App 컴포넌트에서 상태 리셋을 처리
    window.dispatchEvent(new CustomEvent('kiosk:resetToHome'));
  });
  
  // 키보드 접근성 향상
  document.addEventListener('keydown', (e) => {
    // Tab 키로 포커스 이동시 시각적 피드백 강화
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-navigation');
    }
    
    // Escape 키로 홈 화면 복귀
    if (e.key === 'Escape') {
      window.dispatchEvent(new CustomEvent('kiosk:resetToHome'));
    }
  });
  
  // 마우스 사용시 키보드 네비게이션 클래스 제거
  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-navigation');
  });
});

// PWA 서비스 워커 등록 (프로덕션 환경에서)
if (!import.meta.env.DEV && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker 등록 성공:', registration.scope);
        
        // 서비스 워커 업데이트 감지
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 새 버전이 사용 가능합니다.');
              // 사용자에게 업데이트 알림 (선택사항)
              if (confirm('새 버전이 사용 가능합니다. 업데이트하시겠습니까?')) {
                window.location.reload();
              }
            }
          });
        });
      })
      .catch((error) => {
        console.log('❌ Service Worker 등록 실패:', error);
      });
  });
}

// 앱 정보 출력 (버전 관리용)
console.log(`
🎤 키오스크 애플리케이션 정보:
┌─────────────────────────────────────────────┐
│  📱 애플리케이션: AI 음성인식 키오스크      │
│  🏢 용도: 주민센터 민원 안내                │
│  👥 대상: 어르신 및 일반 시민               │
│  🔧 기술: React + Vite + FastAPI           │
│  📅 빌드: ${new Date().toLocaleString('ko-KR')}                │
└─────────────────────────────────────────────┘
`);

// 성능 최적화를 위한 이미지 프리로드 (중요한 아이콘들)
const preloadImages = [
  'https://img.icons8.com/flat-round/64/microphone--v1.png'
];

preloadImages.forEach(src => {
  const img = new Image();
  img.src = src;
});

// 메모리 누수 방지를 위한 전역 정리 함수
window.addEventListener('beforeunload', () => {
  console.log('🧹 애플리케이션 정리 중...');
  
  // 타이머 정리
  const highestTimeoutId = setTimeout(() => {}, 0);
  for (let i = 0; i < highestTimeoutId; i++) {
    clearTimeout(i);
  }
  
  const highestIntervalId = setInterval(() => {}, 9999);
  for (let i = 0; i < highestIntervalId; i++) {
    clearInterval(i);
  }
  
  console.log('✅ 정리 완료');
});