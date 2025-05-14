import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { TransitControls } from "./TransitControls";
import NatalChartDisplay from "./NatalChartDisplay";
import type { ChartData } from "../../types/astrologyTypes";

// Define the type for the transit data returned by the backend
// Adjust as needed to match your backend response
export type TransitData = {
  transiting_planets: any;
  aspects_to_natal: any[];
  transit_datetime: string;
  // ...other fields as per your backend response
};

type ChartWithTransitsProps = {
  chartId: string;
  chartData: ChartData;
};

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

type FavoriteTransit = {
  date: string; // ISO string (YYYY-MM-DD)
  note?: string;
};

function getFavoritesKey(chartId: string) {
  return `astrotracker_favorites_${chartId}`;
}

export const ChartWithTransits: React.FC<ChartWithTransitsProps> = ({ chartId, chartData }) => {
  const [transitDate, setTransitDate] = useState<Date>(new Date());
  const [transitData, setTransitData] = useState<TransitData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- Favorites State ---
  const [favorites, setFavorites] = useState<FavoriteTransit[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editNote, setEditNote] = useState("");

  // --- Timeline/Slider State ---
  const birthDate = chartData.birth_datetime ? new Date(chartData.birth_datetime) : new Date(new Date().setFullYear(new Date().getFullYear() - 50));
  const today = new Date();
  const minDay = 0;
  const maxDay = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
  const currentDay = Math.floor((transitDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));

  // --- In-memory cache for transit data ---
  const cacheRef = useRef<Map<string, TransitData>>(new Map());
  const MAX_CACHE_SIZE = 60;

  // Debounce ref
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const key = getFavoritesKey(chartId);
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch {}
    }
  }, [chartId]);

  // Save favorites to localStorage when changed
  useEffect(() => {
    const key = getFavoritesKey(chartId);
    localStorage.setItem(key, JSON.stringify(favorites));
  }, [favorites, chartId]);

  // Helper: is current date a favorite?
  function isCurrentFavorite() {
    const key = transitDate.toISOString().slice(0, 10);
    return favorites.some(f => f.date === key);
  }

  // Save favorite
  const handleSaveFavorite = (note: string) => {
    setSavingFavorite(true);
    const key = transitDate.toISOString().slice(0, 10);
    if (!favorites.some(f => f.date === key)) {
      setFavorites([...favorites, { date: key, note: note?.trim() || undefined }]);
    }
    setTimeout(() => setSavingFavorite(false), 300); // Simulate async
  };

  // Remove favorite
  const handleRemoveFavorite = (date: string) => {
    setFavorites(favorites.filter(f => f.date !== date));
  };

  // Jump to favorite date
  const handleJumpToFavorite = (date: string) => {
    setTransitDate(new Date(date));
    setShowFavorites(false);
  };

  // Edit note
  const handleEditNote = (idx: number) => {
    setEditingIdx(idx);
    setEditNote(favorites[idx].note || "");
  };
  const handleSaveEditNote = (idx: number) => {
    const updated = [...favorites];
    updated[idx] = { ...updated[idx], note: editNote.trim() || undefined };
    setFavorites(updated);
    setEditingIdx(null);
    setEditNote("");
  };
  const handleCancelEdit = () => {
    setEditingIdx(null);
    setEditNote("");
  };

  // Fetch transit data, using cache if available
  const fetchTransitData = useCallback(async (date: Date) => {
    const key = formatDateKey(date);
    if (cacheRef.current.has(key)) {
      setTransitData(cacheRef.current.get(key)!);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        transit_year: date.getFullYear(),
        transit_month: date.getMonth() + 1,
        transit_day: date.getDate(),
        transit_hour: date.getHours(),
        transit_minute: date.getMinutes(),
      };
      const res = await axios.post(
        `/api/v1/charts/${chartId}/transits`,
        payload
      );
      cacheRef.current.set(key, res.data);
      // Limit cache size
      if (cacheRef.current.size > MAX_CACHE_SIZE) {
        const oldest = cacheRef.current.keys().next().value;
        cacheRef.current.delete(oldest);
      }
      setTransitData(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to fetch transit data");
    } finally {
      setLoading(false);
    }
  }, [chartId]);

  // Prefetch a window of dates around the current date
  const prefetchWindow = 7;
  const prefetchTransitData = useCallback((centerDate: Date) => {
    for (let offset = -prefetchWindow; offset <= prefetchWindow; offset++) {
      const d = new Date(centerDate.getTime() + offset * 24 * 60 * 60 * 1000);
      // Only prefetch within valid range
      if (d < birthDate || d > today) continue;
      const key = formatDateKey(d);
      if (!cacheRef.current.has(key)) {
        // Fire and forget
        axios.post(`/api/v1/charts/${chartId}/transits`, {
          transit_year: d.getFullYear(),
          transit_month: d.getMonth() + 1,
          transit_day: d.getDate(),
          transit_hour: d.getHours(),
          transit_minute: d.getMinutes(),
        }).then(res => {
          cacheRef.current.set(key, res.data);
          if (cacheRef.current.size > MAX_CACHE_SIZE) {
            const oldest = cacheRef.current.keys().next().value;
            cacheRef.current.delete(oldest);
          }
        }).catch(() => {});
      }
    }
  }, [chartId, birthDate, today]);

  // Debounced effect for transitDate changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchTransitData(transitDate);
      prefetchTransitData(transitDate);
    }, 300); // 300ms debounce
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [transitDate, fetchTransitData, prefetchTransitData]);

  // --- Auto-Play/Animation Logic ---
  useEffect(() => {
    if (playing) {
      playIntervalRef.current = setInterval(() => {
        setTransitDate(prev => {
          const nextDay = Math.min(
            Math.floor((prev.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
            maxDay
          );
          const newDate = new Date(birthDate.getTime() + nextDay * 24 * 60 * 60 * 1000);
          if (nextDay === maxDay) {
            setPlaying(false);
          }
          return newDate;
        });
      }, 200);
    } else if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [playing, birthDate, maxDay]);

  // Auto-pause on manual interaction
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (playing) setPlaying(false);
    const days = parseInt(e.target.value, 10);
    const newDate = new Date(birthDate.getTime() + days * 24 * 60 * 60 * 1000);
    setTransitDate(newDate);
  };
  const handleDateChange = (date: Date) => {
    if (playing) setPlaying(false);
    setTransitDate(date);
  };
  const handlePlayPause = () => setPlaying(p => !p);

  // --- UI ---
  return (
    <div>
      <TransitControls
        date={transitDate}
        onDateChange={handleDateChange}
        birthDate={birthDate}
        today={today}
        minDay={minDay}
        maxDay={maxDay}
        currentDay={currentDay}
        onSliderChange={handleSliderChange}
        playing={playing}
        onPlayPause={handlePlayPause}
        onSaveFavorite={handleSaveFavorite}
        isFavorite={isCurrentFavorite()}
        onShowFavorites={() => setShowFavorites(true)}
        savingFavorite={savingFavorite}
      />
      {showFavorites && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl"
              onClick={() => setShowFavorites(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h3 className="text-lg font-bold mb-4 text-gray-800">Favorite Transit Dates</h3>
            {favorites.length === 0 ? (
              <div className="text-gray-500">No favorites yet.</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {favorites.map((fav, idx) => (
                  <li key={fav.date} className="py-2 flex items-center gap-2">
                    <button
                      className="text-blue-600 hover:underline text-sm font-mono"
                      onClick={() => handleJumpToFavorite(fav.date)}
                      title="Jump to this date"
                    >
                      {fav.date}
                    </button>
                    {editingIdx === idx ? (
                      <>
                        <input
                          type="text"
                          value={editNote}
                          onChange={e => setEditNote(e.target.value)}
                          className="border rounded px-1 py-0.5 text-sm flex-1"
                          maxLength={80}
                          autoFocus
                        />
                        <button
                          className="ml-1 px-2 py-0.5 bg-blue-500 text-white rounded text-xs"
                          onClick={() => handleSaveEditNote(idx)}
                        >
                          Save
                        </button>
                        <button
                          className="ml-1 px-2 py-0.5 bg-gray-300 text-gray-700 rounded text-xs"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {fav.note && <span className="ml-2 text-gray-700 text-xs italic">{fav.note}</span>}
                        <button
                          className="ml-2 text-xs text-blue-500 hover:underline"
                          onClick={() => handleEditNote(idx)}
                          title="Edit note"
                        >
                          Edit
                        </button>
                      </>
                    )}
                    <button
                      className="ml-auto text-xs text-red-500 hover:underline"
                      onClick={() => handleRemoveFavorite(fav.date)}
                      title="Remove from favorites"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      {loading && <div>Loading transits...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <NatalChartDisplay
        chartData={chartData}
        transitData={transitData || undefined}
      />
    </div>
  );
}; 