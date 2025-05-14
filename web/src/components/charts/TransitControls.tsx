import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type TransitControlsProps = {
  date: Date;
  onDateChange: (date: Date) => void;
  // Timeline/slider props
  birthDate: Date;
  today: Date;
  minDay: number;
  maxDay: number;
  currentDay: number;
  onSliderChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  playing: boolean;
  onPlayPause: () => void;
  // Favorites feature
  onSaveFavorite: (note: string) => void;
  isFavorite: boolean;
  onShowFavorites: () => void;
  savingFavorite: boolean;
};

export const TransitControls: React.FC<TransitControlsProps> = ({
  date,
  onDateChange,
  birthDate,
  today,
  minDay,
  maxDay,
  currentDay,
  onSliderChange,
  playing,
  onPlayPause,
  onSaveFavorite,
  isFavorite,
  onShowFavorites,
  savingFavorite,
}) => {
  const [note, setNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);

  const handleSaveClick = () => {
    if (!isFavorite) {
      setShowNoteInput(true);
    }
  };
  const handleConfirmSave = () => {
    onSaveFavorite(note);
    setShowNoteInput(false);
    setNote("");
  };
  const handleCancelSave = () => {
    setShowNoteInput(false);
    setNote("");
  };

  return (
    <div className="flex flex-col gap-2 my-4 p-4 rounded shadow" style={{ background: '#101727', color: '#f3f4f6' }}>
      {/* Transit Date Picker (top) */}
      <div className="flex items-center gap-4">
        <label htmlFor="transit-date" className="font-semibold mb-1">
          Transit Date:
        </label>
        <DatePicker
          id="transit-date"
          selected={date}
          onChange={onDateChange}
          showTimeSelect
          dateFormat="yyyy-MM-dd HH:mm"
          className="border rounded px-2 py-1"
        />
        {/* Save (star) button */}
        <button
          type="button"
          onClick={handleSaveClick}
          className={`ml-2 text-xl ${isFavorite ? 'text-yellow-400' : 'text-gray-400'} hover:text-yellow-500 focus:outline-none`}
          title={isFavorite ? "Remove from Favorites" : "Save to Favorites"}
          aria-label={isFavorite ? "Remove from Favorites" : "Save to Favorites"}
          disabled={isFavorite}
        >
          ★
        </button>
        {/* Favorites list button */}
        <button
          type="button"
          onClick={onShowFavorites}
          className="ml-2 text-lg text-blue-500 hover:text-blue-700 focus:outline-none"
          title="Show Favorites"
          aria-label="Show Favorites"
        >
          <span role="img" aria-label="favorites">📋</span>
        </button>
      </div>
      {/* Note input for saving favorite */}
      {showNoteInput && !isFavorite && (
        <div className="flex items-center gap-2 mt-2">
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add a note (optional)"
            className="border rounded px-2 py-1 flex-1"
            maxLength={80}
            autoFocus
            disabled={savingFavorite}
          />
          <button
            type="button"
            onClick={handleConfirmSave}
            className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none"
            disabled={savingFavorite}
          >
            Save
          </button>
          <button
            type="button"
            onClick={handleCancelSave}
            className="px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 focus:outline-none"
            disabled={savingFavorite}
          >
            Cancel
          </button>
        </div>
      )}
      {/* Transit Timeline and Slider (immediately below) */}
      <label className="font-semibold mb-1">Transit Timeline</label>
      <span className="mb-2">{date.toLocaleDateString()}</span>
      {/* Play/Pause button above slider, right-aligned */}
      <div className="flex justify-end w-full" style={{ maxWidth: 400 }}>
        <button
          type="button"
          onClick={onPlayPause}
          className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? "⏸" : "▶"}
        </button>
      </div>
      <input
        type="range"
        min={minDay}
        max={maxDay}
        value={currentDay}
        onChange={onSliderChange}
        step={1}
        style={{ width: "100%", maxWidth: 400 }}
      />
      <div className="flex justify-between w-full text-xs mt-1" style={{ maxWidth: 400 }}>
        <span>{birthDate.toLocaleDateString()}</span>
        <span>{today.toLocaleDateString()}</span>
      </div>
    </div>
  );
}; 