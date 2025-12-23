import React, { useState, useEffect, useRef, memo } from 'react';
import Stopwatch from './Stopwatch';
import '../styles/RestTimer.css';

// ---- REST TIMER COMPONENT WITH STOPWATCH ---- //
function RestTimerTab() {
  const [timerSubTab, setTimerSubTab] = useState(0); // 0 = Rest Timer, 1 = Stopwatch
  const [touchStart, setTouchStart] = useState(0);

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    const touchEnd = e.changedTouches[0].clientX;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && timerSubTab === 0) {
      setTimerSubTab(1); // Swipe left -> go to Stopwatch
    }
    if (isRightSwipe && timerSubTab === 1) {
      setTimerSubTab(0); // Swipe right -> go to Rest Timer
    }
  };

  return (
    <div 
      className="tab-section"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <h2>Timer Tools</h2>
      
      {/* Timer Sub-Navigation */}
      <div className="timer-sub-nav">
        <button 
          className={timerSubTab === 0 ? "timer-sub-btn active" : "timer-sub-btn"} 
          onClick={() => setTimerSubTab(0)}
        >
          Rest Timer
        </button>
        <button 
          className={timerSubTab === 1 ? "timer-sub-btn active" : "timer-sub-btn"} 
          onClick={() => setTimerSubTab(1)}
        >
          Stopwatch
        </button>
      </div>

      {/* Timer Content */}
      {timerSubTab === 0 && <RestTimer />}
      {timerSubTab === 1 && <Stopwatch />}
    </div>
  );
}

// ---- REST TIMER COMPONENT ---- //
function RestTimer() {
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running && timer > 0) {
      intervalRef.current = setInterval(() => {
        setTimer(t => t > 0 ? t - 1 : 0);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, timer]);

  useEffect(() => {
    if (timer === 0 && running) {
      setRunning(false);
      // Play a simple alert sound (if available)
      if (typeof Audio !== 'undefined') {
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj==');
          audio.play().catch(() => {});
        } catch (e) {}
      }
    }
  }, [timer, running]);


  function addMinute() {
    if (!running) {
      setTimer(prev => prev + 60);
    }
  }

  function subtractMinute() {
    if (!running && timer > 0) {
      setTimer(prev => Math.max(0, prev - 60));
    }
  }

  function startTimer() {
    if (timer > 0) {
      setRunning(true);
    }
  }

  function pauseTimer() {
    setRunning(false);
  }

  function resetTimer() {
    setTimer(0);
    setRunning(false);
  }

  const formatTimer = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="rest-timer-container">
      {/* Time Display */}
      <div className="rest-timer-display-section">
        <div className={`rest-timer-display ${running ? 'running' : ''}`}>
          {formatTimer(timer)}
        </div>
      </div>

      {/* Minute Adjustment Buttons */}
      <div className="rest-timer-minute-controls">
        <button
          className="rest-timer-minute-btn"
          onClick={subtractMinute}
          disabled={running || timer === 0}
          title="Subtract 1 minute"
        >
          −
        </button>
        <span className="rest-timer-minute-label">min</span>
        <button
          className="rest-timer-minute-btn"
          onClick={addMinute}
          disabled={running}
          title="Add 1 minute"
        >
          +
        </button>
      </div>

      {/* Quick Preset Buttons */}
      <div className="rest-timer-presets">
        {[5, 10, 15, 30, 60, 120].map(seconds => {
          const mins = seconds < 60 ? seconds : Math.round(seconds / 60);
          const label = seconds < 60 ? `${seconds}s` : `${mins}m`;
          return (
            <button
              key={seconds}
              className="rest-timer-preset-btn"
              onClick={() => {
                setTimer(seconds);
                setRunning(false);
              }}
              disabled={running}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Control Buttons */}
      <div className="rest-timer-controls">
        <button
          className={`rest-timer-button ${running ? 'pause-button' : 'start-button'}`}
          onClick={running ? pauseTimer : startTimer}
        >
          {running ? 'Pause' : 'Start'}
        </button>
        {!running && timer > 0 && (
          <button className="rest-timer-button reset-button" onClick={resetTimer}>
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(RestTimerTab);
