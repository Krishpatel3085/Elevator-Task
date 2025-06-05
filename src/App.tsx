import React, { useEffect, useState } from "react";
import "./elevator.css"; 
import dingSound from "./assets/sound.mp3"; // Import the ding sound
type Elevator = {
  id: number;
  currentFloor: number;
  queue: number[];
};

const TOTAL_ELEVATORS = 5;
const TOTAL_FLOORS = 10;

const App: React.FC = () => {
  const [elevators, setElevators] = useState<Elevator[]>(
    Array.from({ length: TOTAL_ELEVATORS }, (_, i) => ({
      id: i,
      currentFloor: 0,
      queue: [],
    }))
  );

  const [floorButtonStatus, setFloorButtonStatus] = useState<{
    [key: number]: string;
  }>({});

  const requestElevator = (floor: number) => {
  if (floorButtonStatus[floor] === "Waiting..." || floorButtonStatus[floor] === "Arrived") return;

  setFloorButtonStatus((prev) => ({ ...prev, [floor]: "Waiting..." }));

  
  const notAlreadyGoing = elevators.filter(e => !e.queue.includes(floor));

  if (notAlreadyGoing.length === 0) return;


  const idleElevators = notAlreadyGoing.filter(e => e.queue.length === 0);

  let selected: Elevator;

  if (idleElevators.length > 0) {
    
    selected = idleElevators.reduce((prev, curr) =>
      Math.abs(curr.currentFloor - floor) < Math.abs(prev.currentFloor - floor) ? curr : prev
    );
  } else {
    selected = notAlreadyGoing.reduce((prev, curr) =>
      Math.abs(curr.currentFloor - floor) < Math.abs(prev.currentFloor - floor) ? curr : prev
    );
  }
  
  const updated = elevators.map((e) =>
    e.id === selected.id ? { ...e, queue: [...e.queue, floor] } : e
  );

  setElevators(updated);
};


  useEffect(() => {
    const interval = setInterval(() => {
      setElevators((prev) =>
        prev.map((elevator) => {
          if (elevator.queue.length === 0) return elevator;

          const target = elevator.queue[0];
          const step = target > elevator.currentFloor ? 1 : -1;
          const nextFloor = elevator.currentFloor + step;

          if (nextFloor === target) {
            // Play sound
            const audio = new Audio(dingSound);
            audio.play();

            // Show "Arrived"
            setFloorButtonStatus((prev) => ({
              ...prev,
              [target]: "Arrived",
            }));

            setTimeout(() => {
              setFloorButtonStatus((prev) => ({
                ...prev,
                [target]: "Call",
              }));
            }, 2000);

            return {
              ...elevator,
              currentFloor: nextFloor,
              queue: elevator.queue.slice(1),
            };
          }
          return { ...elevator, currentFloor: nextFloor };
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <h1>Elevator Exercise</h1>
      <div className="elevator-system">
        <div className="building">
          {Array.from({ length: TOTAL_FLOORS }, (_, i) => {
            const floor = TOTAL_FLOORS - 1 - i; // 0 = ground, 9 = top
            return (
              <div className="floor" key={floor}>
                <div className="label">
                  {floor === 0
                    ? "ground floor"
                    : `${floor}${floor === 1 ? "st" : floor === 2 ? "nd" : floor === 3 ? "rd" : "th"}`}
                </div>
                <div className="elevator-row">
                  {elevators.map((elevator) => (
                    <div key={elevator.id} className="shaft">
                      {elevator.currentFloor === floor && (
                        <div className="elevator-icon">🚪</div>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  className="call-button"
                  onClick={() => requestElevator(floor)}
                  disabled={floorButtonStatus[floor] === "Waiting..."}
                >
                  {floorButtonStatus[floor] || "Call"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default App;


