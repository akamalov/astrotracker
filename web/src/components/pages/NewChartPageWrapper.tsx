import React, { useEffect } from 'react';
import { useChartStore } from '../../stores/chartStore';
import BirthDataForm from './BirthDataForm';
import NatalChartDisplay from './NatalChartDisplay';
import { apiClient } from '../../lib/apiClient';

const NewChartPageWrapper: React.FC = () => {
  // Get state and actions from the store
  const {
    isLoading,
    calculatedChartData,
    error,
    lastInputData,
    clearChart,
  } = useChartStore((state) => state);

  // Clear previous chart data when the component mounts
  useEffect(() => {
    clearChart();
  }, [clearChart]);

  // State for save button feedback
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = React.useState<string | null>(null);

  const handleSaveChart = async () => {
    if (!lastInputData) {
      setSaveError('Cannot save chart, calculation input data is missing.');
      return;
    }
    if (!calculatedChartData || calculatedChartData.calculation_error) {
        setSaveError('Cannot save chart, calculation was not successful or data is missing.');
        return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      // Data to save should match ChartCreate schema (from chartStore.lastInputData)
      const chartToSave = {
         name: lastInputData.name || 'Saved Chart',
         birth_datetime: lastInputData.birth_datetime,
         latitude: lastInputData.latitude,
         longitude: lastInputData.longitude,
         location_name: lastInputData.location_name,
      };
      
      const savedChart = await apiClient.post('/charts', chartToSave);
      console.log('Chart saved:', savedChart);
      setSaveSuccess(`Chart '${savedChart.name}' saved successfully!`);
      // Optionally redirect: window.location.href = `/chart/${savedChart.id}`;
      // Optionally clear form/result after save: clearChart();
    } catch (err: any) {
      console.error('Failed to save chart:', err);
      setSaveError(err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <BirthDataForm />

      <div className="mt-8">
        {isLoading && (
          <div className="text-center p-4 border rounded bg-blue-50 text-blue-700">
            Calculating chart...
          </div>
        )}
        {error && !isLoading && (
          <div className="text-center p-4 border rounded bg-red-100 text-red-700">
            Error: {error}
          </div>
        )}
        {calculatedChartData && !isLoading && !error && (
          <> { /* Fragment to group display and save button */}
            <NatalChartDisplay chartData={calculatedChartData} />
            
            {/* Save Chart Section */}
            <div className="text-center mt-6 pt-6 border-t">
              {!saveSuccess ? (
                  <>
                      <button 
                        onClick={handleSaveChart}
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                        disabled={isSaving}
                      >
                        {isSaving ? 'Saving...' : 'Save This Chart'}
                      </button>
                      {saveError && (
                          <p className="text-sm mt-2 text-red-600">Error saving: {saveError}</p>
                      )}
                  </>
              ) : (
                  <p className="text-sm mt-2 text-green-600">{saveSuccess}</p>
              )}
             </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NewChartPageWrapper; 