import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, ZoomControl } from "react-leaflet";
import { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Zap, Map as MapIcon } from "lucide-react";

const URLS = {
  QUAKE_API: "/p2p-api/v2/history?codes=551&limit=20",
  MAP_TILE: "/osm/{z}/{x}/{y}.png"
};

const App: React.FC = () => {
  const [earthquakes, setEarthquakes] = useState<any[]>([]);

  const JAPAN_CENTER: LatLngTuple = [36.0, 138.0];

  useEffect(() => {
    const fetchQuakes = async () => {
      try {
        const response = await fetch(URLS.QUAKE_API);
        const data = await response.json();

        const formattedQuakes = data.map((item: any) => ({
          id: item.id,
          lat: item.earthquake.hypocenter.latitude,
          lng: item.earthquake.hypocenter.longitude,
          mag: item.earthquake.hypocenter.magnitude,
          depth: item.earthquake.hypocenter.depth,
          place: item.earthquake.hypocenter.name,
          time: item.earthquake.time,
          maxScale: item.earthquake.maxScale
        })).filter((q: any) => q.lat !== -1);

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
    <div className="flex h-screen flex-col bg-[#313338] text-[#DBDEE1]">
      <header className="flex items-center justify-between bg-[#2B2D31] px-4 py-3 shadow-lg border-b border-black/20">
        <div className="flex items-center gap-2">
          <div className="bg-red-500 p-1.5 rounded-lg">
            <Zap size={20} className="text-white fill-current" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">日本の地震モニター</h1>
            <p className="text-[10px] text-[#B5BAC1] mt-1">過去24時間の国内地震</p>
          </div>
        </div>
        <MapIcon size={20} className="text-[#B5BAC1]" />
      </header>

      <div className="flex-1 relative overflow-hidden">
        <MapContainer center={JAPAN_CENTER} zoom={5} className="h-full w-full">
          <MapContent />
          <ZoomControl position="topright" />

          {/* ここ修正 */}
          <TileLayer url={URLS.MAP_TILE} />

          {earthquakes.map((quake) => {
            const pos: LatLngTuple = [quake.lat, quake.lng];

            const color =
              quake.mag > 5 ? "#F23F43" :
              quake.mag > 3 ? "#F0B232" :
              "#23A559";

            const radius =
              quake.mag > 5 ? 12 :
              quake.mag > 3 ? 8 :
              5;

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
                    <div className="flex justify-between mb-1">
                      <span className="font-bold text-black">
                        M{quake.mag?.toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {quake.id}
                      </span>
                    </div>

                    <div className="text-xs text-gray-700 font-bold">
                      {quake.place}
                    </div>

                    <div className="text-[10px] text-gray-400">
                      発生時刻: {new Date(quake.time).toLocaleString("ja-JP")}
                    </div>

                    <div className="text-[10px] text-gray-400">
                      深さ: {quake.depth} km
                    </div>

                    <div className="text-[10px] text-gray-400">
                      最大震度: {quake.maxScale}
                    </div>

                    <div className="text-[10px] text-gray-400">
                      発生から: {Math.floor((Date.now() - new Date(quake.time).getTime()) / 60000)}分前
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        <div className="absolute bottom-4 right-4 z-[1000] bg-[#2B2D31]/90 p-3 rounded-xl border border-white/10 backdrop-blur-sm shadow-2xl pointer-events-none">
          <p className="text-[10px] font-bold text-[#B5BAC1] mb-2 uppercase">Magnitude</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-white">
              <div className="w-3 h-3 rounded-full bg-[#F23F43]" /> M5.0+
            </div>
            <div className="flex items-center gap-2 text-xs text-white">
              <div className="w-3 h-3 rounded-full bg-[#F0B232]" /> M3.0+
            </div>
            <div className="flex items-center gap-2 text-xs text-white">
              <div className="w-3 h-3 rounded-full bg-[#23A559]" /> Others
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;