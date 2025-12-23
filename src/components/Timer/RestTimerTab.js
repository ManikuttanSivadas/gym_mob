import React, { useState, useEffect, useRef, memo } from 'react';

// Helper function to generate unique IDs
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// ---- REST TIMER COMPONENT WITH STOPWATCH ---- //
function RestTimerTab() {
  const [timerSubTab, setTimerSubTab] = useState(0); // 0 = Rest Timer, 1 = Stopwatch

  return (
    <div className="tab-section">
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
      alert('Rest time completed. Ready for your next set.');
    }
  }, [timer, running]);

  function setTimerValue(seconds) {
    setTimer(seconds);
    setRunning(false);
  }

  function increaseTimer() {
    if (!running) {
      setTimer(prev => prev + 15);
    }
  }

  function decreaseTimer() {
    if (!running && timer > 0) {
      setTimer(prev => Math.max(0, prev - 15));
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
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  function getTimerColorClass() {
    if (!running) return '';
    
    if (timer <= 5) {
      return 'timer-critical';
    } else if (timer <= 10) {
      return 'timer-warning';
    } else if (timer <= 30) {
      return 'timer-caution';
    }
    return 'timer-normal';
  }

  return (
    <div className="timer-content">
      <div className={`timer-display ${getTimerColorClass()}`}>
        <button 
          className="timer-adjust-btn timer-decrease" 
          onClick={decreaseTimer}
          disabled={running || timer <= 0}
          title="Decrease by 15s"
        >
          −
        </button>
        
        <div className="timer-value">{formatTimer(timer)}</div>
        
        <button 
          className="timer-adjust-btn timer-increase" 
          onClick={increaseTimer}
          disabled={running}
          title="Increase by 15s"
        >
          +
        </button>
      </div>

      <div className="timer-controls">
        <h4 style={{width: '100%', textAlign: 'center', margin: '0 0 12px 0', color: 'var(--text-muted)'}}>
          Quick Set
        </h4>
        {[30, 60, 90, 120, 180, 300].map(preset => (
          <button 
            key={preset} 
            className="btn-secondary timer-preset-btn" 
            onClick={() => setTimerValue(preset)}
            disabled={running}
          >
            {preset < 60 ? `${preset}s` : `${preset/60}m`}
          </button>
        ))}
      </div>

      <div className="timer-main-controls">
        {!running ? (
          <button 
            className="btn-success timer-main-btn" 
            onClick={startTimer}
            disabled={timer <= 0}
          >
            {timer > 0 ? 'Start Timer' : 'Set time first'}
          </button>
        ) : (
          <button 
            className="btn-secondary timer-main-btn" 
            onClick={pauseTimer}
          >
            Pause Timer
          </button>
        )}
        
        <button 
          className="btn-danger timer-main-btn" 
          onClick={resetTimer}
          disabled={timer <= 0}
        >
          Reset
        </button>
      </div>

      {timer > 0 && (
        <div className={`timer-status ${getTimerColorClass()}`}>
          <span className="timer-status-text">
            {running ? 'Timer Running' : 'Timer Paused'} • {formatTimer(timer)} remaining
            {timer <= 10 && running && <span className="timer-warning-text"> • Almost done</span>}
          </span>
        </div>
      )}
    </div>
  );
}

// ---- STOPWATCH COMPONENT ---- //
function Stopwatch() {
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTime(t => t + 10); // Update every 10ms for more precision
      }, 10);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  function startStopwatch() {
    setRunning(true);
  }

  function stopStopwatch() {
    setRunning(false);
  }

  function resetStopwatch() {
    setTime(0);
    setRunning(false);
    // Don't clear laps on reset - only reset the timer
  }

  function clearAllLaps() {
    setLaps([]);
  }

  function addLap() {
    if (running && time > 0) {
      const lapTime = time;
      const lapNumber = laps.length + 1;
      const prevLapTime = laps.length > 0 ? laps[laps.length - 1].lapTime : 0;
      const splitTime = lapTime - prevLapTime;
      
      setLaps([...laps, {
        id: generateId(),
        lapNumber,
        lapTime,
        splitTime,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  }

  const formatStopwatchTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const ms = Math.floor((milliseconds % 1000) / 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const formatLapTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const ms = Math.floor((milliseconds % 1000) / 10);
    
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    } else {
      return `${secs}.${ms.toString().padStart(2, '0')}s`;
    }
  };

  return (
    <div className="timer-content">
      <div className="stopwatch-display">
        <div className="stopwatch-time">{formatStopwatchTime(time)}</div>
      </div>

      <div className="stopwatch-controls">
        <div className="stopwatch-main-controls">
          {!running ? (
            <button 
              className="btn-success stopwatch-btn" 
              onClick={startStopwatch}
            >
              Start
            </button>
          ) : (
            <button 
              className="btn-secondary stopwatch-btn" 
              onClick={stopStopwatch}
            >
              Stop
            </button>
          )}
          
          <button 
            className="btn-primary stopwatch-btn" 
            onClick={addLap}
            disabled={!running || time === 0}
          >
            Flag
          </button>
          
          <button 
            className="btn-danger stopwatch-btn" 
            onClick={resetStopwatch}
            disabled={running}
          >
            Reset
          </button>
        </div>
      </div>

      {time > 0 && (
        <div className="stopwatch-status">
          <span className="stopwatch-status-text">
            {running ? 'Stopwatch Running' : 'Stopwatch Stopped'} • {formatStopwatchTime(time)}
          </span>
        </div>
      )}

      {laps.length > 0 && (
        <div className="laps-section">
          <div className="laps-header">
            <h4>Lap Times</h4>
            <button 
              className="btn-danger clear-laps-btn" 
              onClick={clearAllLaps}
              title="Clear all lap times"
            >
              Clear All
            </button>
          </div>
          
          <div className="laps-list">
            {laps.slice().reverse().map(lap => (
              <div key={lap.id} className="lap-item">
                <div className="lap-header">
                  <span className="lap-number">Lap {lap.lapNumber}</span>
                  <span className="lap-timestamp">{lap.timestamp}</span>
                </div>
                <div className="lap-times">
                  <div className="lap-time-item">
                    <span className="lap-time-label">Split:</span>
                    <span className="lap-time-value">{formatLapTime(lap.splitTime)}</span>
                  </div>
                  <div className="lap-time-item">
                    <span className="lap-time-label">Total:</span>
                    <span className="lap-time-value">{formatLapTime(lap.lapTime)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {laps.length > 3 && (
            <div className="laps-summary">
              <p>Total laps: {laps.length} • Best split: {formatLapTime(Math.min(...laps.map(l => l.splitTime)))}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(RestTimerTab);
