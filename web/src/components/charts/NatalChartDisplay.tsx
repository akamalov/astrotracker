import React from 'react';

// --- Constants --- 
const ZODIAC_SIGNS = [
  { name: 'Aries', symbol: '♈' }, { name: 'Taurus', symbol: '♉' }, { name: 'Gemini', symbol: '♊' },
  { name: 'Cancer', symbol: '♋' }, { name: 'Leo', symbol: '♌' }, { name: 'Virgo', symbol: '♍' },
  { name: 'Libra', symbol: '♎' }, { name: 'Scorpio', symbol: '♏' }, { name: 'Sagittarius', symbol: '♐' },
  { name: 'Capricorn', symbol: '♑' }, { name: 'Aquarius', symbol: '♒' }, { name: 'Pisces', symbol: '♓' }
];

const PLANET_SYMBOLS: { [key: string]: string } = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂', 
  Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇',
  Ascendant: 'Asc', Midheaven: 'MC', // Common points
  // Add nodes, asteroids etc. if needed
};

// TODO: Refine color scheme
const ASPECT_COLORS: { [key: string]: string } = {
    Conjunction: 'blue', Sextile: 'lightblue', Square: 'red',
    Trine: 'green', Opposition: 'orange',
    // Add other aspects
};

// TODO: Import the detailed chart data type (e.g., ChartCalculationResult)
// TODO: Import the detailed transit data type (e.g., TransitCalculationResult)
interface NatalChartDisplayProps {
  chartData: any | null; 
  transitData?: any | null; // Optional transit data prop
}

const NatalChartDisplay: React.FC<NatalChartDisplayProps> = ({ chartData, transitData }) => {

  // Initial checks for chartData (keep existing)
  if (!chartData) {
    return <div className="text-center text-gray-500">No chart data available.</div>;
  }
  // Use calculation_error field if present
  const natalError = chartData.calculation_error || chartData.error;
  if (natalError) {
    return <div className="text-center text-red-500">Error calculating natal chart: {natalError}</div>;
  }

  // --- SVG Rendering Logic --- 
  const renderSVGChart = () => {
    const width = 500;
    const height = 500;
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(centerX, centerY) * 0.9; // Base radius
    const ringOuterRadius = baseRadius;
    const ringInnerRadius = baseRadius * 0.85;
    const houseRingRadius = baseRadius * 0.8;
    const planetRingRadius = baseRadius * 0.65; // Radius for placing natal planets
    const transitPlanetRadius = planetRingRadius * 1.15; // <<< Slightly outer radius for transits

    // Helper to convert degrees (0-360, 0=Aries point) to SVG coords
    const getCoords = (degree: number, r: number): { x: number; y: number } => {
      const angleRad = ((degree - 90) * Math.PI) / 180;
      return {
        x: centerX + r * Math.cos(angleRad),
        y: centerY + r * Math.sin(angleRad),
      };
    };
    
    // Helper to get absolute degree from sign/position
    const getAbsoluteDegree = (planet: any): number => {
        if (typeof planet.absolute_position === 'number') {
            return planet.absolute_position;
        }
        const signIndex = ZODIAC_SIGNS.findIndex(s => s.name === planet.sign);
        if (signIndex === -1 || typeof planet.position !== 'number') {
            return NaN; // Invalid data
        }
        return signIndex * 30 + planet.position;
    };

    // Extract data, using empty defaults if missing
    const natalPlanets = chartData?.planets || {};
    const natalHouses = chartData?.houses || []; 
    const natalAspects = chartData?.aspects || []; 
    
    // Extract transit data only if transitData is provided and valid
    const transitingPlanets = transitData && !transitData.calculation_error ? transitData.transiting_planets || {} : {};
    const transitAspects = transitData && !transitData.calculation_error ? transitData.aspects_to_natal || [] : [];

    // --- Calculate and Store Coordinates --- <<< NEW
    const natalCoords: { [key: string]: { x: number; y: number } } = {};
    Object.entries(natalPlanets).forEach(([name, planet]) => {
        const degree = getAbsoluteDegree(planet);
        if (!isNaN(degree)) {
            natalCoords[name] = getCoords(degree, planetRingRadius);
        }
    });

    const transitCoords: { [key: string]: { x: number; y: number } } = {};
    Object.entries(transitingPlanets).forEach(([name, planet]) => {
        const degree = getAbsoluteDegree(planet);
        if (!isNaN(degree)) {
            transitCoords[name] = getCoords(degree, transitPlanetRadius);
        }
    });
    // --- End Coordinate Calculation ---

    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <title>Natal Chart</title>
        <defs>
            {/* Define gradients or patterns if needed */}
        </defs>

        {/* Outer border */}
        <circle cx={centerX} cy={centerY} r={ringOuterRadius} fill="none" stroke="#ccc" strokeWidth="1" />

        {/* 1. Zodiac Ring */}
        {ZODIAC_SIGNS.map((sign, index) => {
          const startAngle = index * 30;
          const endAngle = (index + 1) * 30;
          const startCoordsOuter = getCoords(startAngle, ringOuterRadius);
          const endCoordsOuter = getCoords(endAngle, ringOuterRadius);
          const startCoordsInner = getCoords(startAngle, ringInnerRadius);
          const endCoordsInner = getCoords(endAngle, ringInnerRadius);

          // Arc path for the ring segment
          const largeArcFlag = 0; // 30 degrees is less than 180
          const pathData = [
            `M ${startCoordsOuter.x} ${startCoordsOuter.y}`, // Move to outer start
            `A ${ringOuterRadius} ${ringOuterRadius} 0 ${largeArcFlag} 1 ${endCoordsOuter.x} ${endCoordsOuter.y}`, // Outer arc
            `L ${endCoordsInner.x} ${endCoordsInner.y}`, // Line to inner end
            `A ${ringInnerRadius} ${ringInnerRadius} 0 ${largeArcFlag} 0 ${startCoordsInner.x} ${startCoordsInner.y}`, // Inner arc (reverse sweep)
            'Z' // Close path
          ].join(' ');

          // Calculate position for the symbol
          const midAngle = startAngle + 15;
          const symbolCoords = getCoords(midAngle, (ringOuterRadius + ringInnerRadius) / 2);
          const lineStartCoords = getCoords(startAngle, ringInnerRadius);
          const lineEndCoords = getCoords(startAngle, ringOuterRadius);

          return (
            <g key={sign.name}>
              <path d={pathData} fill={index % 2 === 0 ? '#f9f9f9' : '#ffffff'} stroke="#ccc" strokeWidth="0.5" />
              {/* Sign Symbol */}
              <text 
                x={symbolCoords.x} y={symbolCoords.y} 
                fontSize="14" 
                textAnchor="middle" 
                dominantBaseline="middle"
              >
                {sign.symbol}
              </text>
              {/* Dividing Line */}
              <line 
                x1={lineStartCoords.x} y1={lineStartCoords.y} 
                x2={lineEndCoords.x} y2={lineEndCoords.y} 
                stroke="#ccc" strokeWidth="0.5"
              />
            </g>
          );
        })}

        {/* 2. House Cusps/Lines */}
        {natalHouses.map((house: any) => {
          const degree = getAbsoluteDegree(house);
          if (isNaN(degree)) return null;
          const houseCoords = getCoords(degree, ringInnerRadius); 
          const centerCoords = { x: centerX, y: centerY };
          const textCoords = getCoords(degree + 5, houseRingRadius); // Position text inside cusp

          return (
            <g key={`house-${house.cusp}`}>
              <line 
                x1={centerCoords.x} y1={centerCoords.y}
                x2={houseCoords.x} y2={houseCoords.y}
                stroke="#aaa" 
                strokeWidth={house.cusp === 1 || house.cusp === 10 ? 1.5 : 0.5} // Emphasize Asc/MC
                strokeDasharray={house.cusp !== 1 && house.cusp !== 10 ? "2 2" : undefined}
              />
              <text 
                x={textCoords.x} y={textCoords.y}
                fontSize="10" 
                fill="#555"
                textAnchor="middle"
                dominantBaseline="middle"
               >
                 {house.cusp} 
               </text>
            </g>
          );
        })}

        {/* 3. Natal Planets */}
        {Object.entries(natalPlanets).map(([name, planet]: [string, any]) => {
          const coords = natalCoords[name];
          if (!coords) return null;
          const symbol = PLANET_SYMBOLS[name] || name.substring(0, 2);

          return (
            <text
              key={`natal-${name}`}
              x={coords.x}
              y={coords.y}
              fontSize="16"
              fill="blue" // Example color for natal
              textAnchor="middle"
              dominantBaseline="middle"
              // Add tooltip or interaction if desired
            >
              {symbol}
            </text>
          );
        })}
        
        {/* 4. Transiting Planets (if transitData is available) <<< NEW */}
        {Object.entries(transitingPlanets).map(([name, planet]: [string, any]) => {
          const coords = transitCoords[name];
          if (!coords) return null;
          const symbol = PLANET_SYMBOLS[name] || name.substring(0, 2);

          return (
            <text
              key={`transit-${name}`}
              x={coords.x}
              y={coords.y}
              fontSize="14" // Slightly smaller for transits?
              fill="green" // Example color for transits
              textAnchor="middle"
              dominantBaseline="middle"
              opacity={0.8} // Slightly transparent?
            >
              {symbol}
            </text>
          );
        })}
        
        {/* TODO: Render Aspect Lines (Transit to Natal) <<< NEW */}
        {transitAspects.map((aspect: any, index: number) => {
            const transitPlanetName = aspect.transiting_planet;
            const natalPlanetName = aspect.natal_planet;
            const aspectName = aspect.aspect_name;
            
            const coord1 = transitCoords[transitPlanetName]; // Get transit planet coords
            const coord2 = natalCoords[natalPlanetName];     // Get natal planet coords

            if (coord1 && coord2) {
                const color = ASPECT_COLORS[aspectName] || '#888'; // Fallback color
                let strokeDash = undefined;
                // Example: Dashed lines for minor aspects or squares/oppositions?
                if (aspectName === 'Square' || aspectName === 'Opposition') {
                     // strokeDash = "4 2"; // Example dash pattern
                }
                
                return (
                    <line
                        key={`transit-aspect-${index}`}
                        x1={coord1.x}
                        y1={coord1.y}
                        x2={coord2.x}
                        y2={coord2.y}
                        stroke={color}
                        strokeWidth="0.5"
                        strokeDasharray={strokeDash}
                        opacity={0.7} // Make aspects slightly less prominent?
                    />
                );
            }
            return null; // Skip if coordinates are missing
        })}

        {/* Center area (optional) */}
        <circle cx={centerX} cy={centerY} r={planetRingRadius * 0.3} fill="white" stroke="#ccc" />

      </svg>
    );
  };

  // --- Component Render --- 
  // Decide whether to render placeholder or SVG
  // For now, always try SVG if no error, add toggle later if needed.
  return (
    <div className="flex justify-center items-center">
       {renderSVGChart()}
       {/* {renderPlaceholder()} */}
    </div>
  );

};

export default NatalChartDisplay;
