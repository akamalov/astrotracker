import { create } from 'zustand';
import { apiClient } from '../lib/apiClient'; // Assuming apiClient handles errors

// TODO: Define proper types based on API models
interface CalculatedChartData { 
  planets: any;
  houses: any[];
  aspects: any[];
  calculation_error?: string | null;
  // Add other fields returned by the /natal/calculate endpoint
}

interface ChartInputData { 
  birth_datetime: string; 
  latitude: number;
  longitude: number;
  name: string;
  location_name?: string;
}

interface ChartState {
  isLoading: boolean;
  calculatedChartData: CalculatedChartData | null;
  error: string | null;
  lastInputData: ChartInputData | null; // Store the input that generated the result

  // Actions
  calculateChart: (inputData: ChartInputData) => Promise<void>;
  clearChart: () => void;
  // Optional: Direct setters if needed elsewhere
  // setLoading: (loading: boolean) => void;
  // setResult: (data: CalculatedChartData | null) => void;
  // setError: (error: string | null) => void;
}

export const useChartStore = create<ChartState>((set, get) => ({
  isLoading: false,
  calculatedChartData: null,
  error: null,
  lastInputData: null,

  calculateChart: async (inputData) => {
    set({ isLoading: true, error: null, calculatedChartData: null, lastInputData: inputData });
    try {
        // Call the actual API endpoint
        console.log('Calling backend API to calculate chart:', inputData);
        const result = await apiClient.post<CalculatedChartData>('/charts/natal/calculate', inputData);
        console.log('API calculation result:', result);

        // Check for calculation errors returned in the response body
        if (result.calculation_error) {
          throw new Error(result.calculation_error);
        }
        
        set({ calculatedChartData: result, isLoading: false, error: null });

    } catch (err: any) {
      console.error('Chart calculation failed in store:', err);
      // Extract error message: Use backend error if available, fallback otherwise
      const errorMessage = err?.response?.data?.detail || err.message || 'Failed to calculate chart.';
      set({ error: errorMessage, isLoading: false, calculatedChartData: null });
    }
  },

  clearChart: () => {
    set({ calculatedChartData: null, error: null, isLoading: false, lastInputData: null });
  },
  
  // setLoading: (loading) => set({ isLoading: loading }),
  // setResult: (data) => set({ calculatedChartData: data, isLoading: false, error: null }),
  // setError: (error) => set({ error: error, isLoading: false, calculatedChartData: null }),
})); 