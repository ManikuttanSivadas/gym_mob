import React, { useState, useEffect, useRef, memo } from 'react';
import '../styles/Stopwatch.css';

export default memo(function Stopwatch({ time, setTime, running, setRunning, laps, setLaps, intervalRef }) {
  // Interval is now managed at App level to persist across tab changes
  // This component just uses the time state

  function startStopwatch() {
    setRunning(true);
  }

  function stopStopwatch() {
    setRunning(false);
  }

  function resetStopwatch() {
    setTime(0);
    setRunning(false);
    setLaps([]);
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
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="stopwatch-container">
      {/* Large Time Display */}
      <div className="stopwatch-display-section">
        <div className={`stopwatch-time-display ${running ? 'running' : ''}`}>
          {formatStopwatchTime(time)}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="stopwatch-buttons-section">
        <button
          className={`stopwatch-button ${running ? 'stop-button' : 'start-button'}`}
          onClick={running ? stopStopwatch : startStopwatch}
        >
          {running ? 'Stop' : 'Start'}
        </button>
        {running && (
          <button
            className="stopwatch-button lap-button"
            onClick={addLap}
            disabled={!running || time === 0}
          >
            Lap
          </button>
        )}
        {!running && time > 0 && (
          <button className="stopwatch-button reset-button-inline" onClick={resetStopwatch}>
            Reset
          </button>
        )}
      </div>

      {/* Laps List */}
      {laps.length > 0 && (
        <div className="stopwatch-laps-section">
          <div className="laps-scroll">
            {laps.slice().reverse().map((lap, index) => {
              return (
                <div
                  key={lap.id}
                  className="lap-row"
                >
                  <div className="lap-number-container">
                    <span className="lap-number">Lap {laps.length - index}</span>
                  </div>
                  <div className="lap-time-values">
                    <span className="lap-split-time">{formatStopwatchTime(lap.splitTime)}</span>
                    <span className="lap-total-time">{formatStopwatchTime(lap.lapTime)}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {laps.length > 0 && (
            <button className="clear-all-button" onClick={clearAllLaps}>
              Clear All
            </button>
          )}
        </div>
      )}
    </div>
  );
});
