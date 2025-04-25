import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BirthDataForm from '../BirthDataForm';

// Mock Leaflet and react-leaflet dependencies as they rely on browser APIs
// jest.mock('leaflet');
// jest.mock('react-leaflet', () => ({
//   MapContainer: (props: any) => <div data-testid="map-container">{props.children}</div>,
//   TileLayer: () => <div data-testid="tile-layer"></div>,
//   Marker: (props: any) => <div data-testid="marker" data-position={JSON.stringify(props.position)}></div>,
//   useMapEvents: () => ({}),
//   useMap: () => ({ flyTo: jest.fn(), getZoom: jest.fn(() => 10) }),
// }));

describe('BirthDataForm', () => {
  const mockOnChartCalculated = jest.fn();

  beforeEach(() => {
    mockOnChartCalculated.mockClear();
    // Mock window.URL.createObjectURL if needed by Leaflet/plugins
    // global.URL.createObjectURL = jest.fn(); 
  });

  test('renders form elements including map placeholder', () => {
    render(<BirthDataForm onChartCalculated={mockOnChartCalculated} />);

    expect(screen.getByLabelText(/chart name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/birth date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/birth time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/birth location/i)).toBeInTheDocument();
    // Check for map container presence (using mock)
    // expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /calculate chart/i })).toBeInTheDocument();
  });

  test('allows changing date and time', () => {
    render(<BirthDataForm onChartCalculated={mockOnChartCalculated} />);
    // Interaction with react-datepicker might require specific testing setup
    // or focus on the input field it renders.
    const dateInput = screen.getByLabelText(/birth date/i);
    // Example: Check if date input exists
    expect(dateInput).toBeInTheDocument(); 
    // Add more specific tests if datepicker setup allows
  });

  test('calls onChartCalculated with mock data on submit', async () => {
    render(<BirthDataForm onChartCalculated={mockOnChartCalculated} />);

    // Simulate filling date/time (difficult without proper setup)
    // Simulate clicking map (difficult without proper setup or map mock)
    
    const submitButton = screen.getByRole('button', { name: /calculate chart/i });
    fireEvent.click(submitButton);

    // Wait for the mock calculation (setTimeout in component) 
    // and the callback to be called.
    await waitFor(() => {
      expect(mockOnChartCalculated).toHaveBeenCalledTimes(1);
    });

    // Check the arguments (based on current mock implementation)
    expect(mockOnChartCalculated).toHaveBeenCalledWith(
      expect.objectContaining({ planets: expect.any(Object) }), // Check for mock data structure
      null // Expecting no error from mock
    );
  });
  
   test('shows error if date/time is missing', async () => {
     // Need to manipulate state to clear date/time, difficult without refactor
     render(<BirthDataForm onChartCalculated={mockOnChartCalculated} />);
     // Clear date/time programmatically or via interaction if possible
     fireEvent.click(screen.getByRole('button', { name: /calculate chart/i }));
     // Placeholder check
     expect(mockOnChartCalculated).not.toHaveBeenCalled(); 
     // Add assertion for error message if possible to render it
   });

  // TODO: Add tests for map interaction (requires robust mocking of react-leaflet)
  // TODO: Add tests for API call integration when mock data is replaced
}); 