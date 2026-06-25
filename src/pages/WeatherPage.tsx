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
      const res = await fetch("/weather/bosai/forecast/data/forecast/090000.json");
      const data = await res.json();

      const parsed = parseWeather(data);
      setAllWeather(parsed);

      const dates = [...new Set(parsed.map((w) => w.time.slice(0, 10)))];
      const todayStr = dates[0] ?? "";
      setSelectedDate(todayStr);

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
    setFiltered(allWeather.filter((w) => w.time.startsWith(selectedDate)));
  }, [selectedDate, allWeather]);

  const dates = [...new Set(allWeather.map((w) => w.time.slice(0, 10)))];

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 p-4 text-white md:p-8">
      <div className="w-full max-w-3xl">
        <h1 className="text-2xl font-bold">天気予報</h1>
        <p className="mt-1 text-sm text-[#B5BAC1]">日付を選ぶと、時間ごとの予報を確認できます。</p>
      </div>

      {today && (
        <div className="w-full max-w-sm rounded-xl bg-white/10 p-6 text-center shadow-xl backdrop-blur-md">
          <h2 className="text-2xl font-semibold">{today.area}</h2>
          <p className="mt-2 text-sm text-[#DBDEE1]">{today.weather}</p>
          <p className="mt-3 text-3xl font-bold">
            {today.tempMin ?? "--"}℃ / {today.tempMax ?? "--"}℃
          </p>
        </div>
      )}

      <label className="flex w-full max-w-sm flex-col gap-2 text-sm font-bold">
        表示する日付
        <select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="min-h-12 rounded-lg bg-white/90 p-3 text-black"
        >
          {dates.map((date) => (
            <option key={date} value={date}>
              {date}
            </option>
          ))}
        </select>
      </label>

      <div className="flex w-full max-w-3xl gap-3 overflow-x-auto px-1 pb-2">
        {filtered.map((w) => {
          const d = new Date(w.time);

          return (
            <div
              key={w.time}
              className="min-w-32 rounded-xl bg-white/10 p-4 text-center backdrop-blur-md"
            >
              <p className="text-sm opacity-70">{d.getHours()}時</p>
              <p className="mt-2 text-base font-bold leading-6">{w.weather}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
