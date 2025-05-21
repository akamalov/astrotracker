import React, { useState, useEffect } from 'react';
import apiClient from '../../lib/apiClient';
import { useAuthStore } from '../../stores/authStore';

interface ChartData {
  id: string;
  name: string;
}

interface SynastryAspect {
  planet1: string;
  planet2: string;
  aspect_name: string;
  orb: number;
  aspect_degrees?: number | null;
}

interface SynastryResultData {
  chart1_name: string;
  chart2_name: string;
  chart1_id?: string | null;
  chart2_id?: string | null;
  aspects: SynastryAspect[];
  calculation_error?: string | null;
}

interface InlineSynastryProps {
  currentChartId: string;
}

const InlineSynastry: React.FC<InlineSynastryProps> = ({ currentChartId }) => {
  const [availableCharts, setAvailableCharts] = useState<ChartData[]>([]);
  const [selectedChartId, setSelectedChartId] = useState<string>('');
  const [synastryResult, setSynastryResult] = useState<SynastryResultData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const fetchCharts = async () => {
      if (isAuthenticated) {
        setIsLoading(true);
        setError(null);
        try {
          const response = await apiClient.get<
            { id: string; name: string; birth_datetime: string; location_name?: string }[]
          >('/charts/');
          setAvailableCharts(
            response.data
              .filter(chart => chart.id !== currentChartId)
              .map(chart => ({
                id: chart.id,
                name: `${chart.name} (${new Date(chart.birth_datetime).toLocaleDateString()}${chart.location_name ? ", " + chart.location_name : ""})`
              }))
          );
        } catch (err: any) {
          setError('Failed to load your saved charts.');
          setAvailableCharts([]);
        }
        setIsLoading(false);
      }
    };
    fetchCharts();
  }, [isAuthenticated, currentChartId]);

  const handleCompare = async () => {
    if (!selectedChartId) {
      setError('Please select a chart to compare.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setSynastryResult(null);
    try {
      const payload = { chart1_id: currentChartId, chart2_id: selectedChartId };
      const response = await apiClient.post('/charts/synastry', payload);
      setSynastryResult(response.data as SynastryResultData);
    } catch (err: any) {
      setError('Failed to calculate synastry.');
    }
    setIsLoading(false);
  };

  return (
    <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Synastry Comparison</h2>
      <div className="mb-4">
        <label htmlFor="chart-select" className="block mb-2 font-medium">Compare with:</label>
        <select
          id="chart-select"
          className="border rounded px-3 py-2 w-full"
          value={selectedChartId}
          onChange={e => setSelectedChartId(e.target.value)}
        >
          <option value="">Select a chart...</option>
          {availableCharts.map(chart => (
            <option key={chart.id} value={chart.id}>{chart.name}</option>
          ))}
        </select>
        <button
          className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          onClick={handleCompare}
          disabled={isLoading || !selectedChartId}
        >
          {isLoading ? 'Comparing...' : 'Compare'}
        </button>
      </div>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {synastryResult && (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-2">{synastryResult.chart1_name} &amp; {synastryResult.chart2_name}</h3>
          {synastryResult.calculation_error ? (
            <div className="text-red-600">{synastryResult.calculation_error}</div>
          ) : (
            <>
              {/* Placeholder for synastry chart visualization */}
              <div className="mb-6">
                <div className="text-gray-500 italic">[Synastry chart visualization coming soon]</div>
              </div>
              <table className="min-w-full border text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1">Planet 1</th>
                    <th className="border px-2 py-1">Planet 2</th>
                    <th className="border px-2 py-1">Aspect</th>
                    <th className="border px-2 py-1">Orb</th>
                    <th className="border px-2 py-1">Degrees</th>
                  </tr>
                </thead>
                <tbody>
                  {synastryResult.aspects.map((aspect, idx) => (
                    <tr key={idx}>
                      <td className="border px-2 py-1">{aspect.planet1}</td>
                      <td className="border px-2 py-1">{aspect.planet2}</td>
                      <td className="border px-2 py-1">{aspect.aspect_name}</td>
                      <td className="border px-2 py-1">{aspect.orb.toFixed(2)}</td>
                      <td className="border px-2 py-1">{aspect.aspect_degrees ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default InlineSynastry; 