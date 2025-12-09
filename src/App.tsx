import React, { useEffect, useState, useRef } from "react";
import "./elevator.css";
import dingSound from "./assets/sound.mp3"; 

type Elevator = {
  id: number;
  currentFloor: number;
  isMoving: boolean;
  queue: number[];
  busyUntil: number;
};

const TOTAL_ELEVATORS = 5;
const TOTAL_FLOORS = 10;
const TRAVEL_TIME_MS = 2000; 
const WAIT_TIME_MS = 2000;   

const App: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [elevators, setElevators] = useState<Elevator[]>(
    Array.from({ length: TOTAL_ELEVATORS }, (_, i) => ({
      id: i,
      currentFloor: 0,
      isMoving: false,
      queue: [],
      busyUntil: 0,
    }))
  );

  const [floorButtonStatus, setFloorButtonStatus] = useState<{
    [key: number]: string;
  }>({});

  const playSound = () => {
    if (audioRef.current) {
      try {
        audioRef.current.currentTime = 0; 
        audioRef.current.play().catch(() => {});
      } catch (e) {
        console.error(e);
      }
    }
  };

  const requestElevator = (floor: number) => {
    if (floorButtonStatus[floor] === "Waiting..." || floorButtonStatus[floor] === "Arrived") return;

    setFloorButtonStatus((prev) => ({ ...prev, [floor]: "Waiting..." }));

    const notAlreadyGoing = elevators.filter((e) => !e.queue.includes(floor));
    if (notAlreadyGoing.length === 0) return;

    const idleElevators = notAlreadyGoing.filter((e) => e.queue.length === 0 && Date.now() > e.busyUntil);
    let selected: Elevator;
    
    const candidates = idleElevators.length > 0 ? idleElevators : notAlreadyGoing;
    selected = candidates.reduce((prev, curr) =>
      Math.abs(curr.currentFloor - floor) < Math.abs(prev.currentFloor - floor) ? curr : prev
    );

    setElevators((prev) =>
      prev.map((e) =>
        e.id === selected.id ? { ...e, queue: [...e.queue, floor] } : e
      )
    );
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      setElevators((prev) =>
        prev.map((elevator) => {
          // 1. WAITING: If busy (doors open), stay put.
          if (now < elevator.busyUntil) {
            return { ...elevator, isMoving: false };
          }

          // 2. IDLE: No queue? Stop moving.
          if (elevator.queue.length === 0) {
            return { ...elevator, isMoving: false };
          }

          // 3. CHECK ARRIVAL: Are we ALREADY at the target floor?
          // If yes, this means the previous move just finished. Now we stop.
          const target = elevator.queue[0];
          if (elevator.currentFloor === target) {
             // NOW we trigger the arrival sequence (Sound + Open Doors)
             playSound();
             
             setFloorButtonStatus((prev) => ({ ...prev, [target]: "Arrived" }));
             
             setTimeout(() => {
               setFloorButtonStatus((prev) => {
                  if (prev[target] === "Arrived") {
                     const temp = { ...prev };
                     delete temp[target];
                     return temp;
                  }
                  return prev;
               });
             }, WAIT_TIME_MS);

             return {
               ...elevator,
               isMoving: false, // This opens the doors
               queue: elevator.queue.slice(1), // Remove from queue
               busyUntil: now + WAIT_TIME_MS, // Wait here
             };
          }

          // This ensures the CSS transition completes fully.
          let step = 0;
          if (target > elevator.currentFloor) step = 1;
          else if (target < elevator.currentFloor) step = -1;

          const nextFloor = elevator.currentFloor + step;

          return { 
            ...elevator, 
            currentFloor: nextFloor, 
            isMoving: true // Keep sliding!
          };
        })
      );
    }, TRAVEL_TIME_MS);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      <audio ref={audioRef} src={dingSound} preload="auto" />

      <h1>Elevator System</h1>
      <div className="building-grid">
        <div className="floor-controls">
          {Array.from({ length: TOTAL_FLOORS }, (_, i) => {
            const floorNum = TOTAL_FLOORS - 1 - i;
            return (
              <div className="floor-label-row" key={floorNum}>
                <div className="floor-name">
                  {floorNum === 0 ? "Ground" : `Floor ${floorNum}`}
                </div>
                <button
                  className={`call-btn ${floorButtonStatus[floorNum] === "Waiting..." ? "waiting" : ""} ${floorButtonStatus[floorNum] === "Arrived" ? "arrived" : ""}`}
                  onClick={() => requestElevator(floorNum)}
                  disabled={floorButtonStatus[floorNum] === "Waiting..." || floorButtonStatus[floorNum] === "Arrived"}
                >
                  {floorButtonStatus[floorNum] === "Waiting..." ? "●" : floorButtonStatus[floorNum] === "Arrived" ? "Open" : "Call"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="shafts-container">
          {elevators.map((elevator) => (
            <div className="shaft" key={elevator.id}>
              <div className="shaft-guide">
                {Array.from({ length: TOTAL_FLOORS }).map((_, i) => (
                  <div key={i} className="shaft-floor-marker"></div>
                ))}
              </div>

              <div
                className={`elevator-car ${elevator.isMoving ? "moving" : "stopped"}`}
                style={{
                  bottom: `${(elevator.currentFloor / TOTAL_FLOORS) * 100}%`,
                  transition: elevator.isMoving 
                    ? `bottom ${TRAVEL_TIME_MS}ms linear` 
                    : "none" 
                }}
              >
                <div className="elevator-door-left"></div>
                <div className="elevator-door-right"></div>
                <span className="car-number">{elevator.currentFloor}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;