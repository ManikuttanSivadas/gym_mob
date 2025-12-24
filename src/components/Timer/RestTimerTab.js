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
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [displayValue, setDisplayValue] = useState('00:00:00');
  const intervalRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-format input as HH:MM:SS
  function formatInputDisplay(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Handle input change - only allow numbers, auto-format as user types
  function handleInputChange(e) {
    let rawInput = e.target.value;
    
    // Only keep digits
    const digitsOnly = rawInput.replace(/\D/g, '');
    
    if (digitsOnly.length === 0) {
      setDisplayValue('00:00:00');
      setSeconds(0);
      return;
    }

    // Limit to 6 digits (HHMMSS)
    const limitedDigits = digitsOnly.slice(0, 6);
    let totalSecs = 0;

    if (limitedDigits.length <= 2) {
      // Seconds only: "5" -> "00:00:05"
      const secs = parseInt(limitedDigits, 10);
      totalSecs = Math.min(secs, 59);
    } else if (limitedDigits.length <= 4) {
      // Minutes and seconds: "125" -> "00:01:25"
      const mins = Math.floor(parseInt(limitedDigits, 10) / 100);
      const secs = parseInt(limitedDigits, 10) % 100;
      totalSecs = mins * 60 + Math.min(secs, 59);
    } else {
      // Hours, minutes, seconds: "012345" -> "01:23:45"
      const hours = Math.floor(parseInt(limitedDigits, 10) / 10000);
      const mins = Math.floor((parseInt(limitedDigits, 10) % 10000) / 100);
      const secs = parseInt(limitedDigits, 10) % 100;
      totalSecs = hours * 3600 + mins * 60 + Math.min(secs, 59);
    }

    const formatted = formatInputDisplay(totalSecs);
    setDisplayValue(formatted);
    setSeconds(totalSecs);
  }

  // Countdown effect
  useEffect(() => {
    if (running && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds(prevSecs => {
          const newSecs = prevSecs > 0 ? prevSecs - 1 : 0;
          setDisplayValue(formatInputDisplay(newSecs));
          return newSecs;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, seconds]);

  // Timer finished
  useEffect(() => {
    if (seconds === 0 && running) {
      setRunning(false);
      // Play a simple alert sound
      if (typeof Audio !== 'undefined') {
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBg==');
          audio.play().catch(() => {});
        } catch (e) {}
      }
    }
  }, [seconds, running]);

  function startTimer() {
    if (seconds > 0) {
      setRunning(true);
    }
  }

  function pauseTimer() {
    setRunning(false);
  }

  function resetTimer() {
    setSeconds(0);
    setRunning(false);
    setDisplayValue('00:00:00');
  }

  return (
    <div className="rest-timer-container">
      {/* Single Input Box - Acts as both input and countdown display */}
      <div className="rest-timer-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          className={`rest-timer-input-display ${running ? 'running' : ''}`}
          value={displayValue}
          onChange={handleInputChange}
          disabled={running}
          maxLength="8"
          inputMode="numeric"
          placeholder="00:00:00"
        />
      </div>

      {/* Control Buttons */}
      <div className="rest-timer-controls">
        <button
          className={`rest-timer-button ${running ? 'pause-button' : 'start-button'}`}
          onClick={running ? pauseTimer : startTimer}
          disabled={seconds === 0 && !running}
        >
          {running ? 'Pause' : 'Start'}
        </button>
        {seconds > 0 && (
          <button
            className="rest-timer-button reset-button"
            onClick={resetTimer}
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(RestTimerTab);
