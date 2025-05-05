import React, { useState, useEffect } from "react";
import apiClient from "../../lib/apiClient";

// Define a type for the chart data (adjust based on actual API response)
interface Chart {
  id: string;
  name: string;
  // Add other relevant chart properties here
  // e.g., birth_date: string; birth_time: string; birth_location: string;
}

function ChartList() {
  const [charts, setCharts] = useState<Chart[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCharts = async () => {
      setLoading(true);
      setError(null);
      try {
        // TODO: Update this endpoint if needed
        // const response = await apiClient.get<Chart[]>("/charts"); // Path relative to baseURL (/api/v1)
        const response = await apiClient.get<Chart[]>("/charts/"); // Add trailing slash
        setCharts(response.data);
      } catch (err: any) {
        console.error("Failed to fetch charts:", err);
        setError(
          err.response?.data?.detail ||
            "Failed to load charts. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCharts();
  }, []); // Empty dependency array means this runs once on mount

  if (loading) {
    return <p className="text-center text-gray-500">Loading charts...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500">{error}</p>;
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Your Charts</h2>
      {charts.length === 0 ? (
        <p>You haven't created any charts yet.</p> 
        // TODO: Add a button/link to create a new chart
      ) : (
        <ul className="space-y-2">
          {charts.map((chart) => (
            <li key={chart.id} className="p-3 border rounded shadow-sm">
              {/* TODO: Display more chart details */}
              <p className="font-medium">{chart.name || `Chart ${chart.id}`}</p> 
              {/* Add more details like date, location etc. */}
            </li>
          ))}
        </ul>
      )}
      {/* TODO: Add button/link to create new chart here as well? */}
    </div>
  );
}

export default ChartList; 