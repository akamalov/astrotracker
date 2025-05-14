import React, { useState, useEffect, useCallback } from "react";
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

export const ChartWithTransits: React.FC<ChartWithTransitsProps> = ({ chartId, chartData }) => {
  const [transitDate, setTransitDate] = useState<Date>(new Date());
  const [transitData, setTransitData] = useState<TransitData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransitData = useCallback(async (date: Date) => {
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
      setTransitData(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to fetch transit data");
    } finally {
      setLoading(false);
    }
  }, [chartId]);

  useEffect(() => {
    fetchTransitData(transitDate);
  }, [transitDate, fetchTransitData]);

  return (
    <div>
      <TransitControls
        initialDate={transitDate}
        onDateChange={setTransitDate}
      />
      {loading && <div>Loading transits...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <NatalChartDisplay
        chartData={chartData}
        transitData={transitData || undefined}
      />
    </div>
  );
}; 