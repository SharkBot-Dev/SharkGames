import React, { useEffect, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap, ZoomControl } from "react-leaflet";
import { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Map as MapIcon, Zap } from "lucide-react";

const URLS = {
  QUAKE_API: "/p2p-api/v2/history?codes=551&limit=20",
  MAP_TILE: "/osm/{z}/{x}/{y}.png",
};

const JAPAN_CENTER: LatLngTuple = [36.0, 138.0];

const QuakePage: React.FC = () => {
  const [earthquakes, setEarthquakes] = useState<any[]>([]);

  useEffect(() => {
    const fetchQuakes = async () => {
      try {
        const response = await fetch(URLS.QUAKE_API);
        const data = await response.json();

        const formattedQuakes = data
          .map((item: any) => ({
            id: item.id,
            lat: item.earthquake.hypocenter.latitude,
            lng: item.earthquake.hypocenter.longitude,
            mag: item.earthquake.hypocenter.magnitude,
            depth: item.earthquake.hypocenter.depth,
            place: item.earthquake.hypocenter.name,
            time: item.earthquake.time,
            maxScale: item.earthquake.maxScale,
          }))
          .filter((q: any) => q.lat !== -1);

        setEarthquakes(formattedQuakes);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    fetchQuakes();
    const interval = setInterval(fetchQuakes, 5000);

    return () => clearInterval(interval);
  }, []);

  const MapContent = () => {
    const map = useMap();

    useEffect(() => {
      map.setView(JAPAN_CENTER, 5);
    }, [map]);

    return null;
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#313338] text-[#DBDEE1]">
      <header className="flex items-center justify-between border-b border-black/20 bg-[#2B2D31] px-4 py-3 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-red-500 p-1.5">
            <Zap size={20} className="fill-current text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-none text-white">日本の地震モニター</h1>
            <p className="mt-1 text-[10px] text-[#B5BAC1]">最近の地震情報を表示します</p>
          </div>
        </div>
        <MapIcon size={20} className="text-[#B5BAC1]" />
      </header>

      <div className="relative min-h-[calc(100vh-8rem)] flex-1 overflow-hidden">
        <MapContainer center={JAPAN_CENTER} zoom={5} className="h-full w-full">
          <MapContent />
          <ZoomControl position="topright" />
          <TileLayer url={URLS.MAP_TILE} />

          {earthquakes.map((quake) => {
            const pos: LatLngTuple = [quake.lat, quake.lng];
            const color = quake.mag > 5 ? "#F23F43" : quake.mag > 3 ? "#F0B232" : "#23A559";
            const radius = quake.mag > 5 ? 12 : quake.mag > 3 ? 8 : 5;

            return (
              <CircleMarker
                key={quake.id}
                center={pos}
                radius={radius}
                pathOptions={{
                  fillColor: color,
                  color: "white",
                  weight: 1.5,
                  fillOpacity: 0.6,
                }}
              >
                <Popup>
                  <div className="p-1">
                    <div className="mb-1 flex justify-between">
                      <span className="font-bold text-black">M{quake.mag?.toFixed(1)}</span>
                      <span className="text-xs text-gray-500">{quake.id}</span>
                    </div>
                    <div className="text-xs font-bold text-gray-700">{quake.place}</div>
                    <div className="text-[10px] text-gray-400">
                      発生時刻: {new Date(quake.time).toLocaleString("ja-JP")}
                    </div>
                    <div className="text-[10px] text-gray-400">深さ: {quake.depth} km</div>
                    <div className="text-[10px] text-gray-400">最大震度: {quake.maxScale}</div>
                    <div className="text-[10px] text-gray-400">
                      発生から {Math.floor((Date.now() - new Date(quake.time).getTime()) / 60000)}
                      分前
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        <div className="pointer-events-none absolute bottom-4 right-4 z-[1000] rounded-xl border border-white/10 bg-[#2B2D31]/90 p-3 shadow-2xl backdrop-blur-sm">
          <p className="mb-2 text-[10px] font-bold uppercase text-[#B5BAC1]">マグニチュード</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-white">
              <div className="h-3 w-3 rounded-full bg-[#F23F43]" /> M5.0+
            </div>
            <div className="flex items-center gap-2 text-xs text-white">
              <div className="h-3 w-3 rounded-full bg-[#F0B232]" /> M3.0+
            </div>
            <div className="flex items-center gap-2 text-xs text-white">
              <div className="h-3 w-3 rounded-full bg-[#23A559]" /> その他
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuakePage;
