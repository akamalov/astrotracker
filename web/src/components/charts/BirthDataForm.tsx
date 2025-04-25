import React, { useState, useEffect, useRef } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useChartStore } from '../../stores/chartStore'; // <<< Import chart store

// Fix Leaflet's default icon issue with React
// (See: https://github.com/PaulLeCam/react-leaflet/issues/453)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Assuming API client and calculation result types are needed/available
// import { apiClient } from '../../lib/apiClient';
// import { ChartCalculationResult } from '../../../../api/app/models/chart'; // Adjust path as needed

// Remove the prop callback interface
// interface BirthDataFormProps { ... }

// const BirthDataForm: React.FC<BirthDataFormProps> = ({ onChartCalculated }) => { // Remove prop
const BirthDataForm: React.FC = () => { // <<< No props needed now
  const [name, setName] = useState(''); // Optional name field
  const [birthDate, setBirthDate] = useState<Date | null>(new Date());
  const [birthTime, setBirthTime] = useState<Date | null>(new Date()); // Separate state for time might be easier
  // Store map position state (lat, lon)
  const [mapPosition, setMapPosition] = useState<L.LatLng | null>(L.latLng(40.7128, -74.0060)); // Default to New York
  const [mapZoom, setMapZoom] = useState(10);
  // Latitude and longitude derived from mapPosition for the form
  const [latitude, setLatitude] = useState<string>(mapPosition?.lat.toFixed(4) ?? '');
  const [longitude, setLongitude] = useState<string>(mapPosition?.lng.toFixed(4) ?? '');
  const [locationName, setLocationName] = useState(''); // Optional location name
  const [formError, setFormError] = useState<string | null>(null); // Renamed to avoid clash with store error
  const markerRef = useRef<L.Marker | null>(null);

  // Get state and actions from the store
  const isLoading = useChartStore((state) => state.isLoading);
  const calculateChartAction = useChartStore((state) => state.calculateChart);
  // We might read store error/data here too if needed for form feedback, but primarily handled on page level

  // Update form lat/lon when mapPosition changes
  useEffect(() => {
    if (mapPosition) {
      setLatitude(mapPosition.lat.toFixed(4));
      setLongitude(mapPosition.lng.toFixed(4));
      // TODO: Optional - Add reverse geocoding here to automatically set locationName
      // fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${mapPosition.lat}&lon=${mapPosition.lng}`)
      //   .then(res => res.json())
      //   .then(data => setLocationName(data.display_name || ''))
      //   .catch(err => console.error("Reverse geocoding failed:", err));
    }
  }, [mapPosition]);

  // Component to handle map click events
  const MapEvents = () => {
    useMapEvents({
      click(e) {
        setMapPosition(e.latlng);
      },
    });
    return null;
  };

  // Component to update marker position when mapPosition state changes
  const MarkerUpdater = () => {
      const map = useMap();
      useEffect(() => {
          if (mapPosition) {
              map.flyTo(mapPosition, map.getZoom());
              if (markerRef.current) {
                  markerRef.current.setLatLng(mapPosition);
              }
          }
      }, [mapPosition, map]);
      return null;
  };

  // Combine Date and Time for submission
  const getCombinedDateTime = (): Date | null => {
    if (!birthDate || !birthTime) return null;
    const date = new Date(birthDate);
    date.setHours(birthTime.getHours());
    date.setMinutes(birthTime.getMinutes());
    date.setSeconds(0); // Or birthTime.getSeconds() if needed
    date.setMilliseconds(0);
    return date;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // setError(null); // Use setFormError
    setFormError(null);
    // setLoading(true); // Handled by store action

    const combinedDateTime = getCombinedDateTime();
    
    if (!combinedDateTime) {
      // setError('Please select a valid date and time.');
      setFormError('Please select a valid date and time.');
      // setLoading(false);
      return;
    }
    if (!mapPosition) {
      // setError('Please click on the map to select a birth location.');
      setFormError('Please click on the map to select a birth location.');
      // setLoading(false);
      return;
    }

    const lat = mapPosition.lat;
    const lon = mapPosition.lng;

    const inputData = {
      birth_datetime: combinedDateTime.toISOString(),
      latitude: lat,
      longitude: lon,
      name: name || 'Natal Chart',
      location_name: locationName || `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`,
    };

    console.log('Submitting birth data via store action:', inputData);

    // Call the store action - no try/catch needed here as store handles it
    await calculateChartAction(inputData);
    
    // setLoading(false); // Handled by store action
    // No need to call onChartCalculated callback anymore
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow-md">
      <h3 className="text-xl font-semibold mb-4">Enter Birth Data</h3>
      {/* Use formError for local validation errors */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded">
            {formError}
          </div>
        )}
        
        {/* Optional Name */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="chartName">
            Chart Name (Optional)
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="chartName"
            type="text"
            placeholder="e.g., My Chart, Person X"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading} // <<< Use store loading state
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="birthDate">
              Birth Date
            </label>
            <DatePicker
              selected={birthDate}
              onChange={(date: Date | null) => setBirthDate(date)}
              dateFormat="yyyy/MM/dd"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="birthDate"
              required
              disabled={isLoading} // <<< Use store loading state
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="birthTime">
              Birth Time
            </label>
            <DatePicker
              selected={birthTime}
              onChange={(date: Date | null) => setBirthTime(date)}
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={15}
              timeCaption="Time"
              dateFormat="h:mm aa"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="birthTime"
              required
              disabled={isLoading} // <<< Use store loading state
            />
          </div>
        </div>

        {/* Location Input Section */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Birth Location (Click map to set)
          </label>
          <div className="h-64 w-full mb-2 rounded border border-gray-300" id="map-container">
            {/* Conditionally render MapContainer only on client */}
            {typeof window !== 'undefined' && mapPosition && (
              <MapContainer 
                center={mapPosition} 
                zoom={mapZoom} 
                style={{ height: "100%", width: "100%" }} 
                whenCreated={(mapInstance) => { 
                  // You can store map instance if needed
                  // console.log('Map instance created:', mapInstance);
                }} 
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker 
                    position={mapPosition} 
                    draggable={true} 
                    ref={markerRef}
                    eventHandlers={{
                        dragend: () => {
                            if (markerRef.current) {
                                setMapPosition(markerRef.current.getLatLng());
                            }
                        },
                    }}
                 />
                <MapEvents />
                <MarkerUpdater />
              </MapContainer>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                  <label className="block text-gray-700 text-xs font-bold mb-1" htmlFor="latitude-display">
                    Latitude
                  </label>
                   <input
                      className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 leading-tight bg-gray-100"
                      id="latitude-display"
                      type="text"
                      value={latitude}
                      readOnly 
                    />
              </div>
               <div>
                  <label className="block text-gray-700 text-xs font-bold mb-1" htmlFor="longitude-display">
                    Longitude
                  </label>
                   <input
                      className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 leading-tight bg-gray-100"
                      id="longitude-display"
                      type="text"
                      value={longitude}
                      readOnly 
                    />
              </div>
              <div>
                  <label className="block text-gray-700 text-xs font-bold mb-1" htmlFor="locationName">
                    Location Name (Optional)
                  </label>
                  <input
                      className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      id="locationName"
                      type="text"
                      placeholder="e.g., New York, USA"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)} 
                      disabled={isLoading} // <<< Use store loading state
                   />
              </div>
          </div>
        </div>

        <div className="flex items-center justify-center pt-4">
          <button
            className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            type="submit"
            disabled={isLoading || !mapPosition} // <<< Use store loading state
          >
            {isLoading ? 'Calculating...' : 'Calculate Chart'} // <<< Use store loading state
          </button>
        </div>
      </form>
    </div>
  );
};

export default BirthDataForm; 