import React, { useState, useEffect } from 'react';
import apiClient from '../../lib/apiClient'; // Import apiClient
import { useAuthStore } from '../../stores/authStore'; // Import useAuthStore

// --- Data type for selecting saved charts ---
interface ChartData {
  id: string; // UUID
  name: string;
  // Add other fields if needed for display in selection, e.g., birth_datetime, location_name
}

// --- Input type for providing person data directly ---
// Matches backend app.schemas.chart.SynastryCompositePersonInput (but birth_datetime is string here for form input)
interface PersonDataInput {
  name: string;
  birth_datetime: string; // Form input: YYYY-MM-DDTHH:MM (will be converted before API call if needed)
  city: string;
  latitude?: number;
  longitude?: number;
}

// --- Backend Response Schemas (mirrored for frontend) ---

interface SynastryAspect {
  planet1: string;
  planet2: string;
  aspect_name: string;
  orb: number;
  aspect_degrees?: number | null; // Matches backend
}

interface SynastryResultData { // Renamed from SynastryResult to avoid conflict with component state var
  chart1_name: string;
  chart2_name: string;
  chart1_id?: string | null; // UUID
  chart2_id?: string | null; // UUID
  aspects: SynastryAspect[];
  calculation_error?: string | null;
}

interface CelestialBodyData {
  name: string;
  sign: string;
  sign_num: number;
  position: number;
  absolute_position: number;
  house: string;
  speed?: number | null;
  retrograde?: boolean | null;
}

// Simplified for now, can expand later if houses/aspects of composite are needed for display
interface CompositeChartPlanets {
    [key: string]: CelestialBodyData; // Planets dictionary
}

interface BackendCompositeChartData {
    // info: any; // Simplified for now, define if needed
    planets: CompositeChartPlanets;
    // houses: any[]; // Simplified for now, define if needed
    // aspects: any[]; // Simplified for now, define if needed
    calculation_error?: string | null;
}

interface CompositeChartResultData { // Renamed from CompositeChartResult to avoid conflict
  chart1_name: string;
  chart2_name: string;
  chart1_id?: string | null; // UUID
  chart2_id?: string | null; // UUID
  composite_chart_data: BackendCompositeChartData;
  calculation_error?: string | null;
}

// --- Component ---
const SynastryCalculator: React.FC = () => {
  const [calculationType, setCalculationType] = useState<'synastry' | 'composite'>('synastry');
  const [inputType, setInputType] = useState<'byId' | 'byData'>('byId');

  // States for 'byId' input
  const [chart1Id, setChart1Id] = useState<string>('');
  const [chart2Id, setChart2Id] = useState<string>('');
  const [availableCharts, setAvailableCharts] = useState<ChartData[]>([]); // To be fetched

  // States for 'byData' input (using new PersonDataInput interface)
  const [person1Data, setPerson1Data] = useState<PersonDataInput>({ name: '', birth_datetime: '', city: '' });
  const [person2Data, setPerson2Data] = useState<PersonDataInput>({ name: '', birth_datetime: '', city: '' });

  // States for results (using new *Data interfaces)
  const [synastryResult, setSynastryResult] = useState<SynastryResultData | null>(null);
  const [compositeResult, setCompositeResult] = useState<CompositeChartResultData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Get auth state
  const { isAuthenticated, user } = useAuthStore(); // Get isAuthenticated and user

  useEffect(() => {
    const fetchCharts = async () => {
      if (inputType === 'byId' && isAuthenticated) {
        setIsLoading(true);
        setError(null);
        try {
          // Assuming GET /charts/ returns a list of ChartData compatible objects
          // The backend endpoint is GET /charts/
          const response = await apiClient.get<
            { id: string; name: string; birth_datetime: string; location_name?: string }[]
          >('/charts/'); 
          // Map to ChartData, ensuring only necessary fields or transform as needed
          setAvailableCharts(response.data.map(chart => ({
            id: chart.id,
            name: `${chart.name} (${new Date(chart.birth_datetime).toLocaleDateString()}${chart.location_name ? ", " + chart.location_name : ""})`
          })));
        } catch (err: any) {
          console.error('Failed to fetch charts:', err);
          setError('Failed to load your saved charts.');
          setAvailableCharts([]); // Clear charts on error
        }
        setIsLoading(false);
      }
    };

    fetchCharts();
  }, [inputType, isAuthenticated, user]); // Add user to dependencies if its change should trigger refetch

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSynastryResult(null);
    setCompositeResult(null);

    let endpoint = '';
    let payload: any = {};

    try {
      if (inputType === 'byId') {
        if (!chart1Id || !chart2Id) {
          setError('Please select two charts by ID.');
          setIsLoading(false);
          return;
        }
        payload = { chart1_id: chart1Id, chart2_id: chart2Id };
        endpoint = calculationType === 'synastry' 
          ? '/charts/calculate/synastry/by-id' 
          : '/charts/calculate/composite/by-id';
      } else { // byData
        // Basic validation for byData input
        if (!person1Data.name || !person1Data.birth_datetime || !person1Data.city || 
            !person2Data.name || !person2Data.birth_datetime || !person2Data.city) {
          setError('Please fill in all required fields for both persons.');
          setIsLoading(false);
          return;
        }
        // Convert datetime-local string to the format expected by the backend if necessary
        // Backend SynastryCompositePersonInput expects: name, year, month, day, hour, minute, city, lat?, lon?
        // Frontend PersonDataInput has: name, birth_datetime (string), city, lat?, lon?
        
        const formatPersonDataForApi = (data: PersonDataInput) => {
          const dt = new Date(data.birth_datetime);
          return {
            name: data.name,
            year: dt.getFullYear(),
            month: dt.getMonth() + 1, // JS months are 0-indexed
            day: dt.getDate(),
            hour: dt.getHours(),
            minute: dt.getMinutes(),
            city: data.city,
            latitude: data.latitude,
            longitude: data.longitude,
          };
        };

        payload = {
          person1_data: formatPersonDataForApi(person1Data),
          person2_data: formatPersonDataForApi(person2Data),
        };
        endpoint = calculationType === 'synastry' 
          ? '/charts/calculate/synastry/by-data' 
          : '/charts/calculate/composite/by-data';
      }

      console.log('Submitting to endpoint:', endpoint, 'with payload:', payload);
      const response = await apiClient.post(endpoint, payload);

      if (calculationType === 'synastry') {
        setSynastryResult(response.data as SynastryResultData);
      } else {
        setCompositeResult(response.data as CompositeChartResultData);
      }

    } catch (err: any) {
      console.error('API Error:', err);
      if (err.response && err.response.data && err.response.data.detail) {
        if (Array.isArray(err.response.data.detail)) {
            setError(err.response.data.detail.map((d: any) => `${d.loc.join('.')} - ${d.msg}`).join(', '));
        } else if (typeof err.response.data.detail === 'string'){
            setError(err.response.data.detail);
        } else {
            setError('An unexpected error occurred during calculation.');
        }
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Synastry & Composite Calculator</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-slate-800 p-6 rounded-lg shadow-xl">
        {/* Calculation Type Selection */}
        <div className="flex gap-4 mb-4">
          <label className="block text-sm font-medium text-gray-300">Calculation Type:</label>
          <select 
            value={calculationType} 
            onChange={(e) => setCalculationType(e.target.value as 'synastry' | 'composite')}
            className="mt-1 block w-full p-2 border border-gray-600 bg-slate-700 text-gray-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="synastry">Synastry</option>
            <option value="composite">Composite Chart</option>
          </select>
        </div>

        {/* Input Type Selection */}
        <div className="flex gap-4 mb-6">
          <label className="block text-sm font-medium text-gray-300">Input Type:</label>
          <select 
            value={inputType} 
            onChange={(e) => setInputType(e.target.value as 'byId' | 'byData')}
            className="mt-1 block w-full p-2 border border-gray-600 bg-slate-700 text-gray-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="byId">From Saved Charts</option>
            <option value="byData">Enter Birth Data</option>
          </select>
        </div>

        {/* Conditional Inputs */}
        {inputType === 'byId' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-200">Select Charts by ID</h2>
            {!isAuthenticated && <p className="text-yellow-400 text-sm">Please log in to see your saved charts.</p>}
            {isAuthenticated && availableCharts.length === 0 && !isLoading && !error && (
                <p className="text-gray-400 text-sm">No saved charts found. You can save charts after calculating them.</p>
            )}
            {isAuthenticated && (
              <>
                <div>
                  <label htmlFor="chart1Id" className="block text-sm font-medium text-gray-300">Chart 1:</label>
                  <select 
                    id="chart1Id" 
                    value={chart1Id} 
                    onChange={(e) => setChart1Id(e.target.value)} 
                    className="mt-1 block w-full p-2 border border-gray-600 bg-slate-700 text-gray-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    disabled={!isAuthenticated || isLoading}
                  >
                    <option value="">Select a chart</option>
                    {availableCharts.map(chart => (
                      <option key={chart.id} value={chart.id}>{chart.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="chart2Id" className="block text-sm font-medium text-gray-300">Chart 2:</label>
                  <select 
                    id="chart2Id" 
                    value={chart2Id} 
                    onChange={(e) => setChart2Id(e.target.value)} 
                    className="mt-1 block w-full p-2 border border-gray-600 bg-slate-700 text-gray-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    disabled={!isAuthenticated || isLoading}
                  >
                    <option value="">Select a chart</option>
                    {availableCharts.map(chart => (
                      <option key={chart.id} value={chart.id}>{chart.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        )}

        {inputType === 'byData' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-200">Enter Birth Data for Person 1</h2>
            {/* TODO: Create a reusable PersonDataInput component */}
            <div>
              <label htmlFor="p1Name" className="block text-sm font-medium text-gray-300">Name:</label>
              <input type="text" id="p1Name" value={person1Data.name} onChange={(e) => setPerson1Data({...person1Data, name: e.target.value})} className="mt-1 block w-full p-2 border border-gray-600 bg-slate-700 text-gray-200 rounded-md shadow-sm"/>
            </div>
            <div>
              <label htmlFor="p1BirthDatetime" className="block text-sm font-medium text-gray-300">Birth Date & Time (YYYY-MM-DDTHH:MM):</label>
              <input type="datetime-local" id="p1BirthDatetime" value={person1Data.birth_datetime} onChange={(e) => setPerson1Data({...person1Data, birth_datetime: e.target.value})} className="mt-1 block w-full p-2 border border-gray-600 bg-slate-700 text-gray-200 rounded-md shadow-sm"/>
            </div>
            <div>
              <label htmlFor="p1City" className="block text-sm font-medium text-gray-300">City of Birth:</label>
              <input type="text" id="p1City" value={person1Data.city} onChange={(e) => setPerson1Data({...person1Data, city: e.target.value})} className="mt-1 block w-full p-2 border border-gray-600 bg-slate-700 text-gray-200 rounded-md shadow-sm"/>
            </div>
            {/* TODO: Add fields for optional latitude/longitude */}

            <h2 className="text-xl font-semibold text-gray-200">Enter Birth Data for Person 2</h2>
            <div>
              <label htmlFor="p2Name" className="block text-sm font-medium text-gray-300">Name:</label>
              <input type="text" id="p2Name" value={person2Data.name} onChange={(e) => setPerson2Data({...person2Data, name: e.target.value})} className="mt-1 block w-full p-2 border border-gray-600 bg-slate-700 text-gray-200 rounded-md shadow-sm"/>
            </div>
            <div>
              <label htmlFor="p2BirthDatetime" className="block text-sm font-medium text-gray-300">Birth Date & Time (YYYY-MM-DDTHH:MM):</label>
              <input type="datetime-local" id="p2BirthDatetime" value={person2Data.birth_datetime} onChange={(e) => setPerson2Data({...person2Data, birth_datetime: e.target.value})} className="mt-1 block w-full p-2 border border-gray-600 bg-slate-700 text-gray-200 rounded-md shadow-sm"/>
            </div>
            <div>
              <label htmlFor="p2City" className="block text-sm font-medium text-gray-300">City of Birth:</label>
              <input type="text" id="p2City" value={person2Data.city} onChange={(e) => setPerson2Data({...person2Data, city: e.target.value})} className="mt-1 block w-full p-2 border border-gray-600 bg-slate-700 text-gray-200 rounded-md shadow-sm"/>
            </div>
             {/* TODO: Add fields for optional latitude/longitude */}
          </div>
        )}

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Calculating...' : 'Calculate'}
        </button>
      </form>

      {/* Results Display */}
      {error && (
        <div className="mt-6 p-4 bg-red-900 border border-red-700 text-red-100 rounded-md">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {synastryResult && calculationType === 'synastry' && (
        <div className="mt-6 p-4 bg-slate-700 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-3 text-gray-100">Synastry Aspects:</h2>
          {/* TODO: Better display for synastry aspects */}
          <pre className="text-sm text-gray-200 bg-slate-800 p-3 rounded-md overflow-x-auto">{JSON.stringify(synastryResult, null, 2)}</pre>
        </div>
      )}

      {compositeResult && calculationType === 'composite' && (
        <div className="mt-6 p-4 bg-slate-700 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-3 text-gray-100">Composite Chart Planets:</h2>
          {/* TODO: Better display for composite planets */}
          <pre className="text-sm text-gray-200 bg-slate-800 p-3 rounded-md overflow-x-auto">{JSON.stringify(compositeResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default SynastryCalculator; 