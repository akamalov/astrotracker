import { chartDetail, setChartDetailId, chartDataLoaded, chartDataError, setChartDataLoading, type ChartData } from "../stores/chartDetailStore";
import { useAuthStore } from "../stores/authStore";
import apiClient from "../lib/apiClient";

export function initializeChartPage(chartIdFromParams: string | null) {
  async function fetchAndStoreChartData() {
    const currentChartId = chartDetail.get().chartId;
    if (!currentChartId) {
      console.warn("[ChartIDPage Script] No chart ID in store.");
      return;
    }

    setChartDataLoading();

    await useAuthStore.persist.rehydrate();
    const token = useAuthStore.getState().token;

    console.log("[ChartIDPage Script] Token from store:", token);

    if (!token) {
      chartDataError("You must be logged in to view chart details. Redirecting to login...");
      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 2000);
      return;
    }
    
    console.log("[ChartIDPage Script] Attempting to fetch chart with ID:", currentChartId);

    try {
      const response = await apiClient.get<ChartData>(`/charts/${currentChartId}`);
      chartDataLoaded(response.data);
      console.log("[ChartIDPage Script] Chart data loaded into store:", response.data);
      if (response.data && response.data.name) {
        document.title = `Chart: ${response.data.name}`;
      } else {
        document.title = `Chart: ${currentChartId}`;
      }
    } catch (e: any) { // Added :any to e for now
      console.error(`[ChartIDPage Script] Failed to fetch chart with ID ${currentChartId}:`, e);
      let message = "Failed to load chart data. Please try again.";
      if (e && e.message && e.message.includes("status code 401")) {
        message = "Unauthorized. You may need to log in again.";
      } else if (e && e.response && e.response.status === 404) {
        message = "Chart not found.";
      } else if (e && e.response && e.response.data && e.response.data.detail) {
        message = e.response.data.detail;
      } else if (e && e.message) {
        message = e.message;
      }
      chartDataError(message);
      document.title = "Error Loading Chart";
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (chartIdFromParams && chartIdFromParams !== chartDetail.get().chartId) {
            setChartDetailId(chartIdFromParams);
        }
        fetchAndStoreChartData();
    });
  } else {
    if (chartIdFromParams && chartIdFromParams !== chartDetail.get().chartId) {
        setChartDetailId(chartIdFromParams);
    }
    fetchAndStoreChartData();
  }
} 