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
  const [inputDigits, setInputDigits] = useState('');
  const intervalRef = useRef(null);

  // Format seconds to HH:MM:SS
  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format digits to HH:MM:SS display
  const formatDisplayValue = (digits) => {
    if (!digits) return '00:00:00';
    
    if (digits.length <= 2) {
      return `00:00:${digits.padStart(2, '0')}`;
    } else if (digits.length <= 4) {
      const mins = Math.floor(parseInt(digits, 10) / 100);
      const secs = parseInt(digits, 10) % 100;
      return `00:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      const hours = Math.floor(parseInt(digits, 10) / 10000);
      const mins = Math.floor((parseInt(digits, 10) % 10000) / 100);
      const secs = parseInt(digits, 10) % 100;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  };

  // Calculate total seconds from digits
  const calculateSeconds = (digits) => {
    if (!digits) return 0;
    
    if (digits.length <= 2) {
      return parseInt(digits, 10);
    } else if (digits.length <= 4) {
      const mins = Math.floor(parseInt(digits, 10) / 100);
      const secs = parseInt(digits, 10) % 100;
      return mins * 60 + secs;
    } else {
      const hours = Math.floor(parseInt(digits, 10) / 10000);
      const mins = Math.floor((parseInt(digits, 10) % 10000) / 100);
      const secs = parseInt(digits, 10) % 100;
      return hours * 3600 + mins * 60 + secs;
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    const digitsOnly = value.replace(/\D/g, '');
    const limited = digitsOnly.slice(0, 6);
    
    setInputDigits(limited);
    setSeconds(calculateSeconds(limited));
  };

  // Countdown effect
  useEffect(() => {
    if (running && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds(prevSecs => prevSecs > 0 ? prevSecs - 1 : 0);
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
      if (typeof Audio !== 'undefined') {
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBg==');
          audio.play().catch(() => {});
        } catch (e) {}
      }
    }
  }, [seconds, running]);

  const handleStartTimer = () => {
    if (seconds > 0) {
      setRunning(true);
    }
  };

  const handlePauseTimer = () => {
    setRunning(false);
  };

  const handleResetTimer = () => {
    setSeconds(0);
    setRunning(false);
    setInputDigits('');
  };

  // Display value
  

  return (
    <div className="rest-timer-container">
      {/* Single Input Box */}
      <div className="rest-timer-input-wrapper">
        <input
          type="text"
          className={`rest-timer-input-display ${running ? 'running' : ''}`}
          value={running ? formatTime(seconds) : (inputDigits ? formatDisplayValue(inputDigits) : '00:00:00')}
          onChange={!running ? handleInputChange : undefined}
          disabled={running}
          inputMode="numeric"
          placeholder="00:00:00"
        />
      </div>

      {/* Control Buttons */}
      <div className="rest-timer-controls">
        <button
          className={`rest-timer-button ${running ? 'pause-button' : 'start-button'}`}
          onClick={running ? handlePauseTimer : handleStartTimer}
          disabled={seconds === 0 && !running}
        >
          {running ? 'Pause' : 'Start'}
        </button>
        {seconds > 0 && (
          <button
            className="rest-timer-button reset-button"
            onClick={handleResetTimer}
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(RestTimerTab);
