import React, { useState } from 'react';
// Import the specific function, not the default export if we only need createChart
import { createChart } from '../../lib/apiClient'; 
// We might need useRouter from next/navigation or similar if using a framework specific router after submit
// For Astro, we can use window.location.href for now

interface FormData {
  name: string;
  birth_date: string; // Store as YYYY-MM-DD
  birth_time: string; // Store as HH:MM
  city: string;
  location_name?: string; // Optional
}

function CreateChartForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    birth_date: '',
    birth_time: '',
    city: '',
    location_name: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Combine date and time into a full ISO-like string for the backend
    // The backend expects a datetime object
    const birth_datetime = `${formData.birth_date}T${formData.birth_time}:00`; // Add seconds

    const chartData = {
        name: formData.name,
        birth_datetime: birth_datetime,
        city: formData.city,
        location_name: formData.location_name || null, // Send null if empty
    };

    try {
      // Use the imported createChart function
      const response = await createChart(chartData); 
      console.log("Submitting chart data:", chartData);
      // TEMP: Simulate API call
      // await new Promise(resolve => setTimeout(resolve, 1000)); 
      // In a real scenario, you would use:
      // const response = await apiClient.post('/api/v1/charts/', chartData);
      console.log('Chart created:', response); // Log the response data
      setSuccess('Chart created successfully! Redirecting...'); 
      // Redirect after a short delay
      setTimeout(() => {
          window.location.href = '/dashboard'; 
      }, 1500);

    } catch (err: any) {
      console.error("Failed to create chart:", err);
      // Use err.message because we now throw a standard Error from apiClient
      setError(err.message || 'Failed to create chart. Please try again.');
      setIsLoading(false);
    } 
    // Don't set isLoading to false on success because we redirect
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
      {error && <div className="p-3 bg-red-100 text-red-700 border border-red-300 rounded">{error}</div>}
      {success && <div className="p-3 bg-green-100 text-green-700 border border-green-300 rounded">{success}</div>}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Chart Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700">Birth Date</label>
        <input
          type="date"
          id="birth_date"
          name="birth_date"
          value={formData.birth_date}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="birth_time" className="block text-sm font-medium text-gray-700">Birth Time</label>
        <input
          type="time"
          id="birth_time"
          name="birth_time"
          value={formData.birth_time}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="city" className="block text-sm font-medium text-gray-700">Birth City</label>
        <input
          type="text"
          id="city"
          name="city"
          value={formData.city}
          onChange={handleChange}
          required
          placeholder="e.g., London, New York, Tokyo"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="location_name" className="block text-sm font-medium text-gray-700">Location Name (Optional)</label>
        <input
          type="text"
          id="location_name"
          name="location_name"
          value={formData.location_name}
          onChange={handleChange}
          placeholder="e.g., London, UK or Manhattan, NY, USA"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
         <p className="mt-1 text-xs text-gray-500">A more specific display name if desired (like city, state/country).</p>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isLoading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
        >
          {isLoading ? 'Creating...' : 'Create Chart'}
        </button>
      </div>
    </form>
  );
}

export default CreateChartForm; 