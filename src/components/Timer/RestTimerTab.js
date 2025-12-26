import React, { useState, useEffect, memo } from 'react';
import Stopwatch from './Stopwatch';
import '../styles/RestTimer.css';

function RestTimerTab({
  timerSubTab,
  setTimerSubTab,
  timerSeconds,
  setTimerSeconds,
  timerRunning,
  setTimerRunning,
  timerInputDigits,
  setTimerInputDigits,
  timerIntervalRef,
  stopwatchTime,
  setStopwatchTime,
  stopwatchRunning,
  setStopwatchRunning,
  stopwatchLaps,
  setStopwatchLaps,
  stopwatchIntervalRef
}) {
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

      {timerSubTab === 0 && (
        <RestTimer
          seconds={timerSeconds}
          setSeconds={setTimerSeconds}
          running={timerRunning}
          setRunning={setTimerRunning}
          inputDigits={timerInputDigits}
          setInputDigits={setTimerInputDigits}
          intervalRef={timerIntervalRef}
        />
      )}
      {timerSubTab === 1 && (
        <Stopwatch
          time={stopwatchTime}
          setTime={setStopwatchTime}
          running={stopwatchRunning}
          setRunning={setStopwatchRunning}
          laps={stopwatchLaps}
          setLaps={setStopwatchLaps}
          intervalRef={stopwatchIntervalRef}
        />
      )}
    </div>
  );
}

function RestTimer({ seconds, setSeconds, running, setRunning, inputDigits, setInputDigits, intervalRef }) {
  const [hours, setHours] = useState('00');
  const [minutes, setMinutes] = useState('00');
  const [secs, setSecs] = useState('00');

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Handle 2-digit input for hours
  const handleHoursChange = (e) => {
    let value = e.target.value.replace(/\D/g, '').slice(0, 2);
    setHours(value);
    updateSeconds(value, minutes, secs);
  };

  const handleHoursFocus = () => {
    setHours('');
  };

  // Handle 2-digit input for minutes
  const handleMinutesChange = (e) => {
    let value = e.target.value.replace(/\D/g, '').slice(0, 2);
    // Cap minutes at 59
    if (parseInt(value) > 59) value = '59';
    setMinutes(value);
    updateSeconds(hours, value, secs);
  };

  const handleMinutesFocus = () => {
    setMinutes('');
  };

  // Handle 2-digit input for seconds
  const handleSecondsChange = (e) => {
    let value = e.target.value.replace(/\D/g, '').slice(0, 2);
    // Cap seconds at 59
    if (parseInt(value) > 59) value = '59';
    setSecs(value);
    updateSeconds(hours, minutes, value);
  };

  const handleSecondsFocus = () => {
    setSecs('');
  };

  // Update total seconds from h:m:s values
  const updateSeconds = (h, m, s) => {
    const h_num = parseInt(h) || 0;
    const m_num = parseInt(m) || 0;
    const s_num = parseInt(s) || 0;
    const totalSecs = h_num * 3600 + m_num * 60 + s_num;
    setSeconds(totalSecs);
  };

  // Timer finished notification
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
  }, [seconds, running, setRunning]);

  // Update display when timer is running
  useEffect(() => {
    if (running) {
      const displayTime = formatTime(seconds);
      const [h, m, s] = displayTime.split(':');
      setHours(h);
      setMinutes(m);
      setSecs(s);
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
    if (seconds === 0) return; // Prevent reset when timer is at 0
    setSeconds(0);
    setRunning(false);
    setHours('00');
    setMinutes('00');
    setSecs('00');
  };

  // Quick preset handlers
  const handleQuickPick = (totalSeconds) => {
    setSeconds(totalSeconds);
    setRunning(false);
    
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    
    setHours(h.toString().padStart(2, '0'));
    setMinutes(m.toString().padStart(2, '0'));
    setSecs(s.toString().padStart(2, '0'));
  };

  return (
    <div className="rest-timer-container">
      {/* Quick Picks */}
      <div className="rest-timer-quick-picks">
        <button
          className="rest-timer-quick-pick-btn"
          onClick={() => handleQuickPick(30)}
          disabled={running}
        >
          30s
        </button>
        <button
          className="rest-timer-quick-pick-btn"
          onClick={() => handleQuickPick(60)}
          disabled={running}
        >
          1m
        </button>
        <button
          className="rest-timer-quick-pick-btn"
          onClick={() => handleQuickPick(120)}
          disabled={running}
        >
          2m
        </button>
        <button
          className="rest-timer-quick-pick-btn"
          onClick={() => handleQuickPick(300)}
          disabled={running}
        >
          5m
        </button>
      </div>

      {/* Input Boxes for Hours, Minutes, Seconds */}
      <div className="rest-timer-input-boxes">
        <div className="rest-timer-input-group">
          <label>Hours</label>
          <input
            type="text"
            className="rest-timer-input-box"
            value={hours}
            onChange={handleHoursChange}
            onFocus={handleHoursFocus}
            disabled={running}
            maxLength="2"
            inputMode="numeric"
          />
        </div>
        
        <div className="rest-timer-separator">:</div>
        
        <div className="rest-timer-input-group">
          <label>Minutes</label>
          <input
            type="text"
            className="rest-timer-input-box"
            value={minutes}
            onChange={handleMinutesChange}
            onFocus={handleMinutesFocus}
            disabled={running}
            maxLength="2"
            inputMode="numeric"
          />
        </div>
        
        <div className="rest-timer-separator">:</div>
        
        <div className="rest-timer-input-group">
          <label>Seconds</label>
          <input
            type="text"
            className="rest-timer-input-box"
            value={secs}
            onChange={handleSecondsChange}
            onFocus={handleSecondsFocus}
            disabled={running}
            maxLength="2"
            inputMode="numeric"
          />
        </div>
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
        <button
          className="rest-timer-button reset-button"
          onClick={handleResetTimer}
          disabled={seconds === 0}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export default memo(RestTimerTab);
