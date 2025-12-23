import React, { memo } from "react";

const CalendarView = memo(function CalendarView({
  workouts,
  selectedDate,
  setSelectedDate,
  calendarMonth,
  setCalendarMonth,
  expandedCalendarWorkouts,
  setExpandedCalendarWorkouts,
  handleEditWorkout,
}) {
  function getDaysInMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  function getFirstDayOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  }

  function getWorkoutsByDate() {
    const map = {};
    workouts.forEach(w => {
      const dateStr = w.workoutDate || (w.date || "").split("T")[0];
      if (dateStr) {
        if (!map[dateStr]) map[dateStr] = [];
        map[dateStr].push(w);
      }
    });
    return map;
  }

  function hasWorkoutOnDate(date) {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
    const workoutsByDate = getWorkoutsByDate();
    return dateStr in workoutsByDate;
  }

  function getWorkoutsForDate(date) {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
    const workoutsByDate = getWorkoutsByDate();
    return workoutsByDate[dateStr] || [];
  }

  function toggleCalendarWorkoutExpand(id) {
    setExpandedCalendarWorkouts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function goToPreviousMonth() {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  function goToToday() {
    setCalendarMonth(new Date());
  }

  function renderCalendarGrid() {
    const daysInMonth = getDaysInMonth(calendarMonth);
    const firstDay = getFirstDayOfMonth(calendarMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(
        <button key={`empty-${i}`} disabled style={{ visibility: "hidden" }}>
          {" "}
        </button>
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
      const hasWorkout = hasWorkoutOnDate(date);
      const isSelected = selectedDate === dateStr;

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => setSelectedDate(prev => prev === dateStr ? null : dateStr)}
          style={{
            textAlign: "center",
            borderRadius: 50,
            background: hasWorkout ? "#ef4444" : "transparent",
            color: hasWorkout ? "white" : "var(--text-primary)",
            cursor: hasWorkout ? "pointer" : "default",
            fontWeight: 500,
            fontSize: 13,
            minHeight: 44,
            transition: "all 0.2s ease",
            opacity: isSelected ? 1 : 0.9,
            outline: isSelected && hasWorkout ? "1.5px solid rgba(239, 68, 68, 0.6)" : "none",
            outlineOffset: isSelected && hasWorkout ? "2px" : "0px",
          }}
          disabled={!hasWorkout}
        >
          {day}
        </button>
      );
    }

    return days;
  }

  return (
    <>
      {/* Calendar View */}
      <div style={{ marginTop: 16, padding: 16, background: "rgba(0,0,0,0.02)", borderRadius: 12 }}>
        {/* Calendar Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <button
            type="button"
            onClick={goToPreviousMonth}
            style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 20, color: "var(--text-primary)" }}
            title="Previous month"
          >
            ‹
          </button>
          <div style={{ textAlign: "center", flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
              {calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </h3>
          </div>
          <button
            type="button"
            onClick={goToNextMonth}
            style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 20, color: "var(--text-primary)" }}
            title="Next month"
          >
            ›
          </button>
        </div>

        {/* Today button */}
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <button
            type="button"
            onClick={goToToday}
            style={{
              background: "var(--primary-color, #3b82f6)",
              color: "white",
              border: "none",
              borderRadius: 6,
              padding: "6px 12px",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Today
          </button>
        </div>

        {/* Weekday headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, marginBottom: 8 }}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} style={{ textAlign: "center", fontWeight: 600, fontSize: 12, color: "var(--text-muted)", padding: 8 }}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, marginBottom: 12 }}>
          {renderCalendarGrid()}
        </div>

        {/* Legend */}
        <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
          <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 4, background: "#ef4444", marginRight: 6 }}></span>
          Workout recorded
        </div>
      </div>

      {/* Show selected date workouts */}
      {selectedDate && (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ margin: "0 0 12px 0", color: "var(--text-primary)", fontSize: 16, fontWeight: 600 }}>Workouts on {new Date(selectedDate).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</h3>
          <ul className="workout-list" style={{ padding: 0, margin: 0, listStyle: "none" }}>
            {getWorkoutsForDate(new Date(selectedDate)).map(workout => {
              const isExpanded = expandedCalendarWorkouts.includes(workout.id);
              return (
                <li key={workout.id} className="workout-item" style={{ marginBottom: 12 }}>
                  <div className="workout-header" style={{ display: "grid", gridTemplateColumns: "1fr auto auto", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => toggleCalendarWorkoutExpand(workout.id)}>
                    <div className="workout-name-badge" style={{ textAlign: "left", background: "transparent", padding: 0, borderRadius: 0 }}>
                      <div className="workout-name-text" style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>{workout.name || "Workout"}</div>
                      <div className="workout-date-info" style={{ marginTop: 6 }}>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          {(workout.exercises || []).length} exercises • {(workout.exercises || []).reduce((total, ex) => total + (ex.sets || []).length, 0)} sets
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditWorkout(workout.id, workout.name);
                      }}
                      title="Edit workout"
                      style={{ width: 40, height: 40, borderRadius: 8, padding: 6, background: "transparent", border: "none", color: "var(--text-primary)" }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-primary)" }}>
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      className="btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCalendarWorkoutExpand(workout.id);
                      }}
                      aria-expanded={isExpanded}
                      title={isExpanded ? "Collapse" : "View"}
                      style={{ width: 40, height: 40, borderRadius: 8, padding: 6, background: "transparent", border: "none", color: "var(--text-primary)" }}
                    >
                      {isExpanded ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-primary)" }}>
                          <polyline points="18 15 12 9 6 15" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-primary)" }}>
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: 12 }}>
                      {(workout.exercises || []).length === 0 ? (
                        <div style={{ color: "var(--text-muted)", fontSize: 12, padding: "8px 0" }}>No exercises recorded</div>
                      ) : (
                        <>
                          {(workout.exercises || []).map(exercise => (
                            <div key={exercise.id} className="exercise-item" style={{ marginBottom: 12, padding: 12, background: "var(--bg-secondary, rgba(0,0,0,0.02))", borderRadius: 8 }}>
                              <div className="exercise-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{exercise.name}</h4>
                              </div>
                              <ul className="sets-list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                {(exercise.sets || []).map((s, i) => (
                                  <li key={s.id} style={{ fontSize: 12, color: "var(--text-muted)", padding: "4px 0" }}>
                                    Set {i+1} • {s.weight} kg × {s.reps} reps
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
});

export default CalendarView;
