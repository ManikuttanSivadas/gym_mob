import React, { useState, useEffect } from 'react';
import './TimerIndicatorBar.css';

function TimerIndicatorBar({
  timerRunning,
  timerSeconds,
  stopwatchRunning,
  stopwatchTime,
  onTimerToggle,
  onStopwatchToggle,
  onTimerReset,
  onStopwatchReset,
  onNavigateToTimer,
  timerSubTab,
  setTimerSubTab
}) {
  const [touchStart, setTouchStart] = useState(0);
  const isTimerActive = timerRunning || timerSeconds > 0;
  const isStopwatchActive = stopwatchRunning || stopwatchTime > 0;

  if (!isTimerActive && !isStopwatchActive) {
    return null;
  }

  const formatTime = (totalMs) => {
    const totalSeconds = Math.floor(totalMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isShowingTimer = timerSubTab === 0;
  const displayTime = isShowingTimer ? formatTime(timerSeconds * 1000) : formatTime(stopwatchTime);
  const isRunning = isShowingTimer ? timerRunning : stopwatchRunning;
  const label = isShowingTimer ? 'Timer' : 'Stopwatch';

  const handleToggle = (e) => {
    e.stopPropagation();
    if (isShowingTimer) {
      onTimerToggle();
    } else {
      onStopwatchToggle();
    }
  };

  const handleReset = (e) => {
    e.stopPropagation();
    if (isShowingTimer) {
      onTimerReset();
    } else {
      onStopwatchReset();
    }
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    const touchEnd = e.changedTouches[0].clientX;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && timerSubTab === 0) {
      setTimerSubTab(1);
    }
    if (isRightSwipe && timerSubTab === 1) {
      setTimerSubTab(0);
    }
  };

  const bothRunning = isTimerActive && isStopwatchActive;
  const showSwipeDots = (timerSubTab === 0 && isStopwatchActive) || (timerSubTab === 1 && isTimerActive);

  return (
    <div 
      className={`timer-indicator-bar ${bothRunning ? 'swipeable' : ''}`}
      onClick={onNavigateToTimer}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {showSwipeDots && (
        <div className="timer-indicator-dots">
          <span className={`dot ${timerSubTab === 0 ? 'active' : ''}`}></span>
          <span className={`dot ${timerSubTab === 1 ? 'active' : ''}`}></span>
        </div>
      )}
      <div className="timer-indicator-content">
        <div className="timer-indicator-left">
          <div className="timer-indicator-badge">{label}</div>
          <div className="timer-indicator-info">
            <span className="timer-indicator-time">{displayTime}</span>
          </div>
        </div>
        <div className="timer-indicator-buttons">
          <button
            className={`timer-indicator-play-btn ${isRunning ? 'playing' : 'paused'}`}
            onClick={handleToggle}
            title={isRunning ? 'Pause' : 'Resume'}
          >
            {isRunning ? 'Pause' : 'Play'}
          </button>
          <button
            className="timer-indicator-reset-btn"
            onClick={handleReset}
            title="Reset"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

export default TimerIndicatorBar;
