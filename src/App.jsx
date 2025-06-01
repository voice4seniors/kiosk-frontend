import React, { useState } from "react";
import "./App.css";

function App() {
  const [step, setStep] = useState(0);

  return (
    <div className="wrapper">
      <div className="kiosk-container">
        <div className="kiosk-title">00 주민센터 안내 도우미</div>
        <button
          className="mic-btn"
          type="button"
          aria-label="마이크"
          tabIndex={0}
          onClick={() => {/* 마이크 클릭 시 동작 추가 가능 */}}
        >
          <img
            src="https://img.icons8.com/flat-round/64/microphone--v1.png"
            alt="마이크"
            className="kiosk-mic"
          />
        </button>
        {step === 0 && (
          <>
            <div className="kiosk-message">
              “궁금하신 내용을 말씀해주시면<br />제가 안내해드릴게요”
            </div>
            <div className="kiosk-desc">
              예) 접수, 순번 확인, 등본 발급<br />
              또는,<br />
              ‘도움이 필요해요’라고 말씀해 주세요.
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <div className="kiosk-message">
              “접수하기 버튼을 눌러주세요”
            </div>
            <button className="kiosk-btn" onClick={() => setStep(2)}>
              접수하기
            </button>
          </>
        )}
        {step === 2 && (
          <div className="kiosk-message">
            “1번 창구로 이동해주세요”
          </div>
        )}
        {/* 단계 테스트용: 실제 서비스 시 삭제 */}
        <div className="kiosk-stepper">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)}>이전</button>
          )}
          {step < 2 && (
            <button onClick={() => setStep(step + 1)}>다음</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
