import React, { useEffect, useState } from "react";
import "./elevator.css";
import dingSound from "./assets/sound.mp3"; // Import the ding sound
type Elevator = {
  id: number;
  currentFloor: number;
  queue: number[];
  isWaiting?: boolean;
};

const TOTAL_ELEVATORS = 5;
const TOTAL_FLOORS = 10;

const App: React.FC = () => {
  const [elevators, setElevators] = useState<Elevator[]>(
    Array.from({ length: TOTAL_ELEVATORS }, (_, i) => ({
      id: i,
      currentFloor: 0,
      queue: [],
      isWaiting: false,
    }))
  );

  const [floorButtonStatus, setFloorButtonStatus] = useState<{
    [key: number]: string;
  }>({});
  
  const requestElevator = (floor: number) => {
    if (floorButtonStatus[floor] === "Waiting...") return;

    const anyElevatorGoingThere = elevators.some((e) => e.queue.includes(floor));
    const alreadyAtFloor = elevators.some((e) => e.currentFloor === floor && e.queue.length === 0);

    if (anyElevatorGoingThere || alreadyAtFloor) return;

    setFloorButtonStatus((prev) => ({ ...prev, [floor]: "Waiting..." }));

    const idleElevators = elevators.filter((e) => e.queue.length === 0);
    const activeElevators = elevators.filter((e) => e.queue.length > 0 && !e.queue.includes(floor));

    let selected: Elevator;

    if (idleElevators.length > 0) {
      selected = idleElevators.reduce((prev, curr) =>
        Math.abs(curr.currentFloor - floor) < Math.abs(prev.currentFloor - floor) ? curr : prev
      );
    } else {
      selected = activeElevators.reduce((prev, curr) =>
        Math.abs(curr.currentFloor - floor) < Math.abs(prev.currentFloor - floor) ? curr : prev
      );
    }

    setElevators((prev) =>
      prev.map((e) =>
        e.id === selected.id ? { ...e, queue: [...e.queue, floor] } : e
      )
    );
  };


  useEffect(() => {
    const interval = setInterval(() => {
      setElevators((prevElevators) => {
        return prevElevators.map((elevator) => {
          if (elevator.queue.length === 0 || elevator.isWaiting) return elevator;

          const target = elevator.queue[0];
          const step = target > elevator.currentFloor ? 1 : -1;
          const nextFloor = elevator.currentFloor + step;

          // Elevator arrives at target
          if (nextFloor === target) {
            const audio = new Audio(dingSound);
            audio.play();

            // Set button to "Arrived"
            setFloorButtonStatus((prev) => ({
              ...prev,
              [target]: "Arrived",
            }));

            // Mark elevator as waiting
            setTimeout(() => {
              setElevators((current) =>
                current.map((e) => {
                  if (e.id !== elevator.id) return e;
                  return {
                    ...e,
                    queue: e.queue.slice(1),
                    isWaiting: false,
                  };
                })
              );

              // Reset floor button
              setFloorButtonStatus((prev) => ({
                ...prev,
                [target]: "Call",
              }));
            }, 2000);

            return {
              ...elevator,
              currentFloor: target,
              isWaiting: true,
            };
          }

          return {
            ...elevator,
            currentFloor: nextFloor,
          };
        });
      });
    }, 1000); // 1 second per floor

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


