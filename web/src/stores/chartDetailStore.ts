import { atom, map } from 'nanostores';

export interface ChartData {
  id: string;
  name: string;
  // Add other relevant chart properties based on your API
  [key: string]: any; 
}

export const chartDetail = map< {
  data: ChartData | null;
  isLoading: boolean;
  error: string | null;
  chartId: string | null; // To pass the ID to the component if needed
}>({
  data: null,
  isLoading: true,
  error: null,
  chartId: null,
});

// Action to set the chart ID
export function setChartDetailId(id: string) {
  chartDetail.setKey('chartId', id);
  // Reset other fields when ID changes, initiating a new load sequence
  chartDetail.setKey('data', null);
  chartDetail.setKey('isLoading', true);
  chartDetail.setKey('error', null);
}

// Action to update store on successful data fetch
export function chartDataLoaded(data: ChartData) {
  chartDetail.setKey('data', data);
  chartDetail.setKey('isLoading', false);
  chartDetail.setKey('error', null);
}

// Action to update store on error
export function chartDataError(errorMessage: string) {
  chartDetail.setKey('data', null);
  chartDetail.setKey('isLoading', false);
  chartDetail.setKey('error', errorMessage);
}

// Action to set loading state
export function setChartDataLoading() {
  chartDetail.setKey('isLoading', true);
  chartDetail.setKey('error', null); // Clear previous errors
} 