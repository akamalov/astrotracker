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
  const [deleteError, setDeleteError] = useState<string | null>(null); // Separate state for delete errors
  const [deletingId, setDeletingId] = useState<string | null>(null); // Track which chart is being deleted

  useEffect(() => {
    const fetchCharts = async () => {
      setLoading(true);
      setError(null);
      setDeleteError(null); // Clear delete errors on fetch
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

  const handleDelete = async (chartId: string, chartName: string) => {
    setDeleteError(null); // Clear previous delete errors
    
    if (!window.confirm(`Are you sure you want to delete the chart "${chartName || chartId}"?`)) {
      return; // User cancelled
    }

    setDeletingId(chartId); // Indicate loading state for this specific chart
    
    try {
      await apiClient.delete(`/charts/${chartId}/`); // Add trailing slash if needed
      // Remove the chart from the local state on successful deletion
      setCharts(currentCharts => currentCharts.filter(chart => chart.id !== chartId));
      // Optionally show a success message (could use state or a toast library)
      console.log(`Successfully deleted chart ${chartId}`);
    } catch (err: any) {
      console.error(`Failed to delete chart ${chartId}:`, err);
      setDeleteError(
        err.response?.data?.detail ||
          `Failed to delete chart ${chartName || chartId}. Please try again.`
      );
    } finally {
      setDeletingId(null); // Reset loading state for this chart
    }
  };

  if (loading) {
    return <p className="text-center text-gray-500">Loading charts...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500">{error}</p>;
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Your Charts</h2>
      {deleteError && <p className="mb-4 text-center text-red-500">{deleteError}</p>} {/* Display delete errors */}
      {charts.length === 0 ? (
        <p>You haven't created any charts yet.</p> 
        // TODO: Add a button/link to create a new chart
      ) : (
        <ul className="space-y-3">
          {charts.map((chart) => (
            <li key={chart.id} className="flex justify-between items-center p-3 border rounded shadow-sm">
              <a href={`/chart/${chart.id}`} className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline">
                {chart.name || `Chart ${chart.id}`}
              </a>
              {/* Delete Button */}
              <button
                onClick={() => handleDelete(chart.id, chart.name)}
                disabled={deletingId === chart.id} // Disable button while this chart is being deleted
                className={`ml-4 px-3 py-1 text-sm font-medium rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 
                           ${deletingId === chart.id 
                             ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                             : 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'}`}
              >
                {deletingId === chart.id ? 'Deleting...' : 'Delete'}
              </button>
            </li>
          ))}
        </ul>
      )}
      {/* TODO: Add button/link to create new chart here as well? */}
    </div>
  );
}

export default ChartList; 