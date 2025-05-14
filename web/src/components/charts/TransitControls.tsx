import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type TransitControlsProps = {
  onDateChange: (date: Date) => void;
  initialDate?: Date;
};

export const TransitControls: React.FC<TransitControlsProps> = ({
  onDateChange,
  initialDate,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());

  return (
    <div className="flex items-center gap-4 my-4">
      <label htmlFor="transit-date" className="font-semibold">
        Transit Date:
      </label>
      <DatePicker
        id="transit-date"
        selected={selectedDate}
        onChange={(date: Date) => {
          setSelectedDate(date);
          onDateChange(date);
        }}
        showTimeSelect
        dateFormat="yyyy-MM-dd HH:mm"
        className="border rounded px-2 py-1"
      />
    </div>
  );
}; 