import { useEffect, useState } from "react";

type WeatherInfo = {
  time: string;
  weather: string;
};

type TodayWeather = {
  area: string;
  weather: string;
  tempMin?: string;
  tempMax?: string;
};

const parseWeather = (data: any): WeatherInfo[] => {
  const ts = data[0].timeSeries[0];
  const area = ts.areas[0];

  return ts.timeDefines.map((dt: string, i: number) => ({
    time: dt,
    weather: area.weathers[i],
  }));
};

export default () => {
  const [allWeather, setAllWeather] = useState<WeatherInfo[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [filtered, setFiltered] = useState<WeatherInfo[]>([]);
  const [today, setToday] = useState<TodayWeather | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      const res = await fetch(
        "/weather/bosai/forecast/data/forecast/090000.json"
      );
      const data = await res.json();

      const parsed = parseWeather(data);
      setAllWeather(parsed);

      const dates = [...new Set(parsed.map(w => w.time.slice(0, 10)))];

      const todayStr = dates[0];
      setSelectedDate(todayStr as any);

      const ts0 = data[0].timeSeries[0];
      const ts2 = data[0].timeSeries[2];

      setToday({
        area: ts0.areas[0].area.name,
        weather: ts0.areas[0].weathers[0],
        tempMin: ts2.areas[0].temps?.[2],
        tempMax: ts2.areas[0].temps?.[0],
      });
    };

    fetchWeather();
  }, []);

  useEffect(() => {
    if (!selectedDate) return;

    const filteredData = allWeather.filter((w) =>
      w.time.startsWith(selectedDate)
    );

    setFiltered(filteredData);
  }, [selectedDate, allWeather]);

  return (
    <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-screen gap-8 text-white">

      {today && (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl text-center w-80">
          <h2 className="text-2xl font-semibold">
            {today.area}
          </h2>
          <p>{today.weather}</p>
          <p className="text-3xl font-bold">
            {today.tempMin ?? "--"}℃ / {today.tempMax ?? "--"}℃
          </p>
        </div>
      )}

      <select
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="bg-white/20 backdrop-blur-md rounded-lg p-2 text-black"
      >
        {[...new Set(allWeather.map(w => w.time.slice(0, 10)))].map((date) => (
          <option key={date} value={date}>
            {date}
          </option>
        ))}
      </select>

      <div className="flex gap-4 overflow-x-auto w-full max-w-3xl px-2 justify-center">
        {filtered.map((w, i) => {
          const d = new Date(w.time);

          return (
            <div
              key={i}
              className="min-w-[120px] bg-white/10 backdrop-blur-md rounded-xl p-3 text-center"
            >
              <p className="text-sm opacity-70">
                {d.getHours()}時
              </p>

              <p className="text-lg mt-1">
                {w.weather}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};