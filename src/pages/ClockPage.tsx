import React, { useEffect, useState } from "react";

export default () => {
  const [time, setTime] = useState(new Date());
  const [isAnalog, setIsAnalog] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours();

  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = (hours % 12) * 30 + minutes * 0.5;

  return (
    <div className="p-4 md:p-8 flex flex-col items-center justify-center h-screen gap-8">
      
      {!isAnalog ? (
        <div className="text-center">
          <h1 className="text-2xl mb-2 font-bold">現在時刻</h1>

          <p className="text-5xl font-mono">
            {time.toLocaleTimeString("ja-JP")}
          </p>

          <p className="text-lg mt-2">
            {time.toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long",
            })}
          </p>
        </div>
      ) : (
        <div className="relative w-64 h-64">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle cx="100" cy="100" r="95" stroke="white" strokeWidth="4" fill="none" />

            {[...Array(12)].map((_, i) => {
              const angle = i * 30;
              const x1 = 100 + Math.sin((angle * Math.PI) / 180) * 80;
              const y1 = 100 - Math.cos((angle * Math.PI) / 180) * 80;
              const x2 = 100 + Math.sin((angle * Math.PI) / 180) * 90;
              const y2 = 100 - Math.cos((angle * Math.PI) / 180) * 90;

              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="white"
                  strokeWidth="3"
                />
              );
            })}

            <line
              x1="100"
              y1="100"
              x2="100"
              y2="60"
              stroke="white"
              strokeWidth="5"
              transform={`rotate(${hourDeg} 100 100)`}
            />

            <line
              x1="100"
              y1="100"
              x2="100"
              y2="40"
              stroke="white"
              strokeWidth="3"
              transform={`rotate(${minuteDeg} 100 100)`}
            />

            <line
              x1="100"
              y1="100"
              x2="100"
              y2="30"
              stroke="red"
              strokeWidth="2"
              transform={`rotate(${secondDeg} 100 100)`}
            />

            <circle cx="100" cy="100" r="4" fill="white" />
          </svg>
        </div>
      )}

      <div className="flex items-center gap-3">
        <span className="text-sm">デジタル</span>
        <button
          onClick={() => setIsAnalog(!isAnalog)}
          className={`w-14 h-8 flex items-center rounded-full p-1 transition ${
            isAnalog ? "bg-blue-500" : "bg-gray-400"
          }`}
        >
          <div
            className={`bg-white w-6 h-6 rounded-full shadow-md transform transition ${
              isAnalog ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </button>
        <span className="text-sm">アナログ</span>
      </div>
    </div>
  );
};