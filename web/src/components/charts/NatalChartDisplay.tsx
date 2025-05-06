import React from 'react';

// --- Updated Interfaces (Anticipated Structure) ---
interface PlanetPosition {
  name: string; 
  sign: string; 
  sign_symbol?: string; // Optional glyph
  longitude: number; 
  deg_within_sign?: number; 
  is_retrograde?: boolean;
  absolute_position?: number;
}

interface HouseCusp {
  house_number: number;
  sign: string;
  longitude: number;
}

interface Aspect {
   planet1: string;
   planet2: string;
   aspect_type: string;
   orb: number;
}

// Main data structure expected from API
interface ChartData {
  id: string;
  name: string;
  birth_datetime?: string;
  city?: string;
  [key: string]: any; // Keep flexible for other basic info

  // Astrological Data (Actual names/structure might differ)
  planets?: PlanetPosition[]; 
  houses?: HouseCusp[]; 
  aspects?: Aspect[]; 
  ascendant_longitude?: number; 
  mc_longitude?: number;      
}
// --- End of Interfaces ---

interface NatalChartDisplayProps {
  chartData: ChartData | null;
}

// --- SVG Helper Functions and Constants ---

const ZODIAC_SIGNS = [
  { name: 'Aries', symbol: '♈' }, { name: 'Taurus', symbol: '♉' }, { name: 'Gemini', symbol: '♊' },
  { name: 'Cancer', symbol: '♋' }, { name: 'Leo', symbol: '♌' }, { name: 'Virgo', symbol: '♍' },
  { name: 'Libra', symbol: '♎' }, { name: 'Scorpio', symbol: '♏' }, { name: 'Sagittarius', symbol: '♐' },
  { name: 'Capricorn', symbol: '♑' }, { name: 'Aquarius', symbol: '♒' }, { name: 'Pisces', symbol: '♓' }
];

// Define planet glyphs
const PLANET_GLYPHS: { [key: string]: string } = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂', 
  Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇',
  // Nodes, Asc, MC etc. can be added if needed
  Asc: 'Asc', MC: 'MC' // Use text for axes for now
};

// Function to convert astrological degrees (0-360, 0 = Aries 0) to SVG coordinates
const degreesToSvgCoords = (degree: number, radius: number, center: number): { x: number; y: number } => {
  // Convert astrological degrees (counter-clockwise from Aries 0 at 9 o'clock) 
  // to SVG angles (clockwise from 3 o'clock)
  // Astrological 0° (Aries) is at the left (-1, 0). SVG 0° is at the right (1, 0).
  // We need to rotate by -90 degrees and adjust y-coordinate direction.
  const svgAngleRad = ((degree - 90) * Math.PI) / 180;
  const x = center + radius * Math.cos(svgAngleRad);
  const y = center + radius * Math.sin(svgAngleRad); // SVG y increases downwards
  return { x, y };
};

// Function to describe an SVG arc path (for zodiac segments)
// See: https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths#arcs
const describeArc = (x: number, y: number, radius: number, startAngleDeg: number, endAngleDeg: number): string => {
    const start = degreesToSvgCoords(startAngleDeg, radius, x);
    const end = degreesToSvgCoords(endAngleDeg, radius, y);
    const largeArcFlag = endAngleDeg - startAngleDeg <= 180 ? "0" : "1";
    // Sweep flag 1 = clockwise (which we use after adjusting degrees)
    const d = [
        "M", start.x, start.y, 
        "A", radius, radius, 0, largeArcFlag, 1, end.x, end.y
    ].join(" ");
    return d;       
}

// --- Component Implementation ---
const NatalChartDisplay: React.FC<NatalChartDisplayProps> = ({ chartData }) => {
  if (!chartData) {
    return <p className="text-center text-gray-500 py-8">Loading chart data or chart not found...</p>;
  }

  const svgSize = 500; 
  const center = svgSize / 2;
  const zodiacOuterRadius = svgSize * 0.45;
  const zodiacInnerRadius = svgSize * 0.35;
  const signGlyphRadius = (zodiacOuterRadius + zodiacInnerRadius) / 2;
  const houseCuspLineRadius = zodiacInnerRadius; // Lines go to inner zodiac edge
  const houseLabelRadius = zodiacInnerRadius - 10; // Place labels slightly inside the lines
  const planetRadius = houseLabelRadius - 15; // Place planets inside house labels

  const astroData = chartData.astrological_data;
  const hasPlanetData = astroData?.planets;
  const hasHouseData = astroData?.houses;
  const hasAstroData = hasPlanetData || hasHouseData; // Render wheel if we have something

  // Extract data safely
  // Handle planets being an object in placeholder data, but potentially an array later
  const planetsArray = hasPlanetData 
    ? (Array.isArray(astroData.planets) ? astroData.planets : Object.values(astroData.planets))
    : [];
  const houses = hasHouseData ? astroData.houses : [];

  return (
    <div className="p-4 sm:p-6 border border-gray-200 rounded-lg shadow-lg bg-white">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">{chartData.name || 'Unnamed Chart'}</h2>
      
      <div className="mb-6 w-full flex justify-center">
        <svg 
          width={svgSize} 
          height={svgSize} 
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          className="border border-gray-300 rounded-full bg-white shadow-inner"
        >
          {/* Optional: Outer border */}
          {/* <circle cx={center} cy={center} r={zodiacOuterRadius} fill="none" stroke="#ccc" /> */}
          
          {/* Draw Zodiac Ring Segments and Glyphs */}
          <g id="zodiac-ring">
            {ZODIAC_SIGNS.map((sign, index) => {
              const startAngle = index * 30; // Each sign is 30 degrees
              const endAngle = (index + 1) * 30;
              const midAngle = startAngle + 15;
              
              // Calculate path for the arc segment
              const arcPath = describeArc(center, center, zodiacOuterRadius, startAngle, endAngle) + 
                              ` L ${degreesToSvgCoords(endAngle, zodiacInnerRadius, center).x} ${degreesToSvgCoords(endAngle, zodiacInnerRadius, center).y}` + 
                              describeArc(center, center, zodiacInnerRadius, endAngle, startAngle) +
                              ` L ${degreesToSvgCoords(startAngle, zodiacOuterRadius, center).x} ${degreesToSvgCoords(startAngle, zodiacOuterRadius, center).y}`;
              
              // Position for the glyph
              const glyphPos = degreesToSvgCoords(midAngle, signGlyphRadius, center);
              
              // Basic alternating fill for visual separation
              const fill = index % 2 === 0 ? '#f3f4f6' : '#e5e7eb'; // Tailwind gray-100 and gray-200

              return (
                <g key={sign.name}>
                  {/* Draw the segment shape */}
                  <path d={arcPath} fill={fill} stroke="#d1d5db" strokeWidth="0.5" />
                  {/* Draw the sign glyph */}
                  <text 
                    x={glyphPos.x}
                    y={glyphPos.y}
                    fontSize="18" 
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#4b5563" // gray-600
                  >
                    {sign.symbol}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Groups for other elements (placeholder if data exists) */}
          {hasAstroData && (
            <g id="chart-wheel">
              {/* Draw House Cusps and Labels */}
              <g id="house-cusps" stroke="#9ca3af" strokeWidth="0.5"> {/* gray-400 */}
                {houses.map((house) => {
                  // Calculate end point of cusp line
                  const cuspEndPos = degreesToSvgCoords(house.longitude, houseCuspLineRadius, center);
                  // Calculate position for house number label
                  const labelPos = degreesToSvgCoords(house.longitude + 2, houseLabelRadius, center); // Offset slightly into the house

                  // Style ASC and MC lines differently (optional but common)
                  const isAxis = house.house_number === 1 || house.house_number === 10;
                  const lineStyle = {
                    stroke: isAxis ? '#374151' : '#9ca3af', // gray-700 for axes, gray-400 otherwise
                    strokeWidth: isAxis ? 1 : 0.5,
                  };

                  return (
                    <g key={`house-${house.house_number}`}>
                      <line 
                        x1={center} 
                        y1={center} 
                        x2={cuspEndPos.x} 
                        y2={cuspEndPos.y} 
                        style={lineStyle}
                      />
                      <text
                        x={labelPos.x}
                        y={labelPos.y}
                        fontSize="10"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#6b7280" // gray-500
                      >
                        {house.house_number}
                      </text>
                    </g>
                  );
                })}
              </g>

              {/* Draw Planets */}
              <g id="planets" fill="#1f2937"> {/* gray-800 */}
                {planetsArray.map((planet) => {
                  // Use absolute_position if available (like placeholder), otherwise longitude
                  const degree = planet.absolute_position ?? planet.longitude;
                  if (typeof degree !== 'number') return null; // Skip if no position

                  const planetPos = degreesToSvgCoords(degree, planetRadius, center);
                  const glyph = PLANET_GLYPHS[planet.name] || '?'; // Default to ? if glyph unknown

                  return (
                    <text 
                      key={planet.name}
                      x={planetPos.x}
                      y={planetPos.y}
                      fontSize="16" // Adjust size as needed
                      textAnchor="middle"
                      dominantBaseline="central"
                      // Add class for potential styling or interaction later
                      className="planet-glyph"
                    >
                      {glyph}
                    </text>
                  );
                })}
              </g>

              <g id="aspects"></g>
            </g>
          )}
          
          {/* Placeholder Text if data is missing */}
          {!hasAstroData && (
            <text x={center} y={center} textAnchor="middle" dominantBaseline="middle" fill="#9ca3af" fontSize="16">
              Astrological data missing
            </text>
          )}
        </svg>
      </div>

      {/* Section to display raw chart data for debugging/development */}
      <div className="mt-6 sm:mt-8 pt-4 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Raw Chart Data (for debugging):</h3>
        <pre className="mt-2 p-3 bg-gray-50 text-xs text-gray-700 rounded-md overflow-x-auto shadow-sm border border-gray-200">
          {JSON.stringify(chartData, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default NatalChartDisplay; 