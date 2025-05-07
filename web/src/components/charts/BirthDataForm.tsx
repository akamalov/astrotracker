import React, { useState, type FormEvent } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import apiClient from '../../lib/apiClient'; // Import the apiClient

// Helper function to format date to YYYY-MM-DD
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Helper function to format time to HH:MM
const formatTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

interface BirthDataFormProps {
  // Props can be added later, e.g., for onSubmit, initialData
  // onChartCalculated?: (chartData: any) => void; // Optional callback for when chart is calculated
}

const BirthDataForm: React.FC<BirthDataFormProps> = ({ /* onChartCalculated */ }) => {
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [birthTime, setBirthTime] = useState<Date | null>(null);
  const [locationName, setLocationName] = useState('');
  const [chartName, setChartName] = useState('My Natal Chart'); // Added state for chart name
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [calculatedChartData, setCalculatedChartData] = useState<any | null>(null); // To store API response

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setCalculatedChartData(null);
    setIsLoading(true);

    if (!birthDate || !birthTime || !locationName || !chartName) {
      setError('All fields (including chart name) are required.');
      setIsLoading(false);
      return;
    }

    // Combine date and time into a single Date object
    // Note: This assumes the time selected in birthTime picker is for the date selected in birthDate picker
    const combinedDateTime = new Date(
      birthDate.getFullYear(),
      birthDate.getMonth(),
      birthDate.getDate(),
      birthTime.getHours(),
      birthTime.getMinutes()
      // Seconds are implicitly 0, timezone is local machine's
    );

    // Format to full ISO 8601 string (e.g., "2023-10-27T10:30:00.000Z") which Pydantic handles well
    const birthDateTimeISO = combinedDateTime.toISOString();

    console.log('Form submitted with:');
    console.log('Chart Name:', chartName);
    console.log('Birth Date & Time (ISO):', birthDateTimeISO);
    console.log('Location Name:', locationName);

    try {
      // Construct payload matching ChartCreate schema
      const payload = {
        name: chartName,
        birth_datetime: birthDateTimeISO, // Send ISO string
        city: locationName, // Use locationName input for the required 'city' field
        location_name: locationName, // Also send location_name (optional on backend)
      };

      console.log("Sending payload to backend:", payload);
      const response = await apiClient.post('/charts/', payload);

      console.log('Calculated chart data from API:', response.data);
      // We got a successful response from the backend (chart created)
      // Now redirect to the dashboard.
      // setCalculatedChartData(response.data); // No longer need to display data here if redirecting
      setError(null); 
      
      // Redirect to dashboard
      window.location.href = '/dashboard'; 
      // Note: No need to setIsLoading(false) here as the page will navigate away.
      return; // Prevent further execution like the finally block setting loading to false unnecessarily

    } catch (err: any) {
      console.error("API Error calculating chart:", err.response || err.message || err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to calculate chart. Please try again.';
      // Handle complex FastAPI validation errors if needed
      if (typeof errorMessage === 'object' && errorMessage !== null) {
        try {
            // Attempt to format validation errors from FastAPI (which can be nested)
            setError(JSON.stringify(errorMessage)); 
        } catch { 
            setError('An complex validation error occurred.');
        }
      } else {
          setError(String(errorMessage));
      }
      setCalculatedChartData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Enter Birth Details</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="chartName" className="block text-sm font-medium text-gray-700">
            Chart Name
          </label>
          <input
            id="chartName"
            name="chartName"
            type="text"
            value={chartName}
            onChange={(e) => setChartName(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">
            Birth Date
          </label>
          <DatePicker
            id="birthDate"
            selected={birthDate}
            onChange={(date: Date | null) => setBirthDate(date)}
            dateFormat="yyyy-MM-dd"
            placeholderText="YYYY-MM-DD"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            disabled={isLoading}
            autoComplete="off"
          />
        </div>

        <div>
          <label htmlFor="birthTime" className="block text-sm font-medium text-gray-700">
            Birth Time
          </label>
          <DatePicker
            id="birthTime"
            selected={birthTime}
            onChange={(date: Date | null) => setBirthTime(date)}
            showTimeSelect
            showTimeSelectOnly
            timeIntervals={1}
            timeCaption="Time"
            dateFormat="HH:mm"
            placeholderText="HH:MM"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            disabled={isLoading}
            autoComplete="off"
          />
        </div>

        <div>
          <label htmlFor="locationName" className="block text-sm font-medium text-gray-700">
            Location (e.g., City, Country)
          </label>
          <input
            id="locationName"
            name="locationName"
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            required
            placeholder="e.g., London, UK"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            disabled={isLoading}
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Chart'}
          </button>
        </div>
      </form>
      {error && <p className="mt-4 text-red-500 text-sm text-center">{error}</p>}
    </div>
  );
};

export default BirthDataForm; 