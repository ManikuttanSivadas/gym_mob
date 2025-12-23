import React, { useState, useEffect, useRef, memo } from 'react';

export default memo(function Stopwatch() {
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTime(t => t + 10);
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
  }

  function clearAllLaps() {
    setLaps([]);
  }

  function addLap() {
    if (running && time > 0) {
      const lapTime = time;
      const lapNumber = laps.length + 1;
      const prevLapTime = laps.length ? laps[laps.length-1].lapTime : 0;
      const splitTime = lapTime - prevLapTime;
      setLaps([...laps, { lapNumber, lapTime, splitTime, id: `${lapNumber}-${Date.now()}` }]);
    }
  }

  const formatStopwatchTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const centis = Math.floor((ms % 1000) / 10);
    return `${mins}:${secs.toString().padStart(2,'0')}.${centis.toString().padStart(2,'0')}`;
  };

  return (
    <div className="timer-content">
      <div className="stopwatch-display">
        <div className="stopwatch-time">{formatStopwatchTime(time)}</div>
      </div>

      <div className="stopwatch-controls">
        <div className="stopwatch-main-controls">
          {!running ? (
            <button className="btn-success stopwatch-btn" onClick={startStopwatch}>Start</button>
          ) : (
            <button className="btn-secondary stopwatch-btn" onClick={stopStopwatch}>Stop</button>
          )}
          <button className="btn-primary stopwatch-btn" onClick={addLap} disabled={!running || time === 0}>Flag</button>
          <button className="btn-danger stopwatch-btn" onClick={resetStopwatch} disabled={running}>Reset</button>
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
            <button className="btn-danger clear-laps-btn" onClick={clearAllLaps}>Clear All</button>
          </div>
          <div className="laps-list">
            {laps.slice().reverse().map(lap => (
              <div key={lap.id} className="lap-item">
                <div className="lap-header">
                  <span className="lap-number">Lap {lap.lapNumber}</span>
                  <span className="lap-timestamp">{new Date().toLocaleTimeString()}</span>
                </div>
                <div className="lap-times">
                  <div className="lap-time-item">
                    <span className="lap-time-label">Split:</span>
                    <span className="lap-time-value">{formatStopwatchTime(lap.splitTime)}</span>
                  </div>
                  <div className="lap-time-item">
                    <span className="lap-time-label">Total:</span>
                    <span className="lap-time-value">{formatStopwatchTime(lap.lapTime)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
