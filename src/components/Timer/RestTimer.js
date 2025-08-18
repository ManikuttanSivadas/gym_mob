import React, { useState } from 'react';
import RestTimer from './RestTimer';
import Stopwatch from './Stopwatch';

export default function RestTimerTab() {
  const [timerSubTab, setTimerSubTab] = useState(0);

  return (
    <div className="tab-section">
      <h2>Timer Tools</h2>
      
      <div className="timer-sub-nav">
        <button
          className={`timer-sub-btn${timerSubTab === 0 ? ' active' : ''}`}
          onClick={() => setTimerSubTab(0)}
        >
          Rest Timer
        </button>
        <button
          className={`timer-sub-btn${timerSubTab === 1 ? ' active' : ''}`}
          onClick={() => setTimerSubTab(1)}
        >
          Stopwatch
        </button>
      </div>

      {timerSubTab === 0 ? <RestTimer /> : <Stopwatch />}
    </div>
  );
}
