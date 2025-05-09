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
  cusp: number;
  sign: string;
  absolute_position: number;
}

interface Aspect {
   p1_name: string;
   p2_name: string;
   aspect_name: string;
   orb: number;
   aspect_degrees?: number;
}

// Main data structure expected from API
interface ChartData {
  id: string;
  name: string;
  birth_datetime?: string;
  city?: string;
  [key: string]: any; // Keep flexible for other basic info

  // Astrological Data (Actual names/structure might differ)
  astrological_data?: {
    info?: any; // Keep flexible for now
    planets?: { [key: string]: PlanetPosition }; // Corrected type
    houses?: HouseCusp[];
    aspects?: Aspect[];
  };
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
  "Ascendant": "Asc",
  "Medium_Coeli": "MC",
  "Descendant": "Desc",
  "IC": "IC",
  "Chiron": "Chi",
  "Mean_Lilith": "Lil",
  "Mean_Node": "NN",
  "True_Node": "NN",
  "Mean_South_Node": "SN",
  "True_South_Node": "SN"
};

// Function to convert astrological degrees to SVG coordinates
const degreesToSvgCoords = (degree: number, radius: number, center: number): { x: number; y: number } => {
  const svgAngleRad = ((degree - 90) * Math.PI) / 180;
  const x = center + radius * Math.cos(svgAngleRad);
  const y = center + radius * Math.sin(svgAngleRad);
  const precision = 5;
  return {
    x: parseFloat(x.toFixed(precision)),
    y: parseFloat(y.toFixed(precision))
  };
};

// Function to describe an SVG arc path
const describeArc = (x: number, y: number, radius: number, startAngleDeg: number, endAngleDeg: number): string => {
    const start = degreesToSvgCoords(startAngleDeg, radius, x);
    const end = degreesToSvgCoords(endAngleDeg, radius, y);
    const largeArcFlag = endAngleDeg - startAngleDeg <= 180 ? "0" : "1";
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
  const houseCuspLineRadius = zodiacInnerRadius;
  const houseLabelRadius = zodiacInnerRadius - 10;
  const planetRingRadius = houseLabelRadius - 20;
  const aspectLineInnerRadius = svgSize * 0.1;

  const { name } = chartData;
  const astroData = chartData.astrological_data;
  const planets = astroData?.planets || {};
  const houses = astroData?.houses || [];
  const aspects = astroData?.aspects || [];

  const planetPositionsMap = new Map<string, PlanetPosition>();
  if (planets && typeof planets === 'object' && !Array.isArray(planets)) {
    (Object.values(planets) as PlanetPosition[]).forEach(p => {
      if (p && p.name && typeof p.longitude === 'number') {
        planetPositionsMap.set(p.name, p);
      }
    });
  }

  const hasPlanetData = planetPositionsMap.size > 0;
  const hasHouseData = houses.length > 0;
  const hasAspectData = aspects.length > 0;
  const hasAstroData = hasPlanetData || hasHouseData;

  const aspectStyles: { [key: string]: { stroke: string; strokeDasharray?: string, strokeWidth?: number } } = {
    'Conjunction': { stroke: 'blue', strokeWidth: 1.5 },
    'Sextile': { stroke: '#3b82f6', strokeDasharray: '4 2', strokeWidth: 1 },
    'Square': { stroke: 'red', strokeWidth: 1.5 },
    'Trine': { stroke: 'green', strokeWidth: 1.5 },
    'Opposition': { stroke: '#b91c1c', strokeWidth: 1.5 },
    'Quincunx': { stroke: 'orange', strokeDasharray: '2 2', strokeWidth: 1 },
    'SemiSextile': { stroke: 'teal', strokeDasharray: '3 1', strokeWidth: 1 },
  };

  return (
    <div className="p-4 sm:p-6 border border-gray-700 rounded-lg shadow-lg bg-gray-900 text-gray-200">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-100 mb-4 sm:mb-6 text-center">{chartData.name || 'Unnamed Chart'}</h2>
      <div className="mb-6 w-full flex justify-center">
        <svg
          width={svgSize}
          height={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          className="rounded-full"
        >
          <g id="zodiac-ring">
            {ZODIAC_SIGNS.map((sign, index) => {
              const startAngle = index * 30;
              const endAngle = (index + 1) * 30;
              const midAngle = startAngle + 15;
              const arcPath = describeArc(center, center, zodiacOuterRadius, startAngle, endAngle) +
                              ` L ${degreesToSvgCoords(endAngle, zodiacInnerRadius, center).x} ${degreesToSvgCoords(endAngle, zodiacInnerRadius, center).y}` +
                              describeArc(center, center, zodiacInnerRadius, endAngle, startAngle) +
                              ` L ${degreesToSvgCoords(startAngle, zodiacOuterRadius, center).x} ${degreesToSvgCoords(startAngle, zodiacOuterRadius, center).y}`;
              const glyphPos = degreesToSvgCoords(midAngle, signGlyphRadius, center);
              const fill = index % 2 === 0 ? '#374151' : '#4b5563';

              return (
                <g key={sign.name}>
                  <path d={arcPath} fill={fill} stroke="#1f2937" strokeWidth="0.5" />
                  <text
                    x={glyphPos.x}
                    y={glyphPos.y}
                    fontSize="18"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#d1d5db"
                  >
                    {sign.symbol}
                  </text>
                </g>
              );
            })}
          </g>

          {hasAstroData && (
            <g id="chart-wheel">
              <g id="house-cusps" stroke="#6b7280" strokeWidth="0.3">
                {houses.map((house: HouseCusp) => {
                  const cuspEndPos = degreesToSvgCoords(house.absolute_position, houseCuspLineRadius, center);
                  const labelAngle = house.absolute_position + (30 / 15);
                  const labelPos = degreesToSvgCoords(labelAngle, houseLabelRadius, center);
                  const isAxis = house.cusp === 1 || house.cusp === 10;
                  const lineStyle = {
                    stroke: isAxis ? '#e5e7eb' : '#6b7280',
                    strokeWidth: isAxis ? 0.7 : 0.3,
                  };
                  return (
                    <g key={`house-${house.cusp}`}>
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
                        fill="#9ca3af"
                      >
                        {house.cusp}
                      </text>
                    </g>
                  );
                })}
              </g>

              {hasAspectData && (
                <g id="aspects">
                  {aspects.map((aspect: Aspect, index: number) => {
                    const planet1 = planetPositionsMap.get(aspect.p1_name);
                    const planet2 = planetPositionsMap.get(aspect.p2_name);
                    if (!planet1 || !planet2) {
                      console.warn(`Could not find planet positions for aspect: ${aspect.p1_name} to ${aspect.p2_name}`);
                      return null;
                    }
                    const p1Coords = degreesToSvgCoords(planet1.longitude, aspectLineInnerRadius, center);
                    const p2Coords = degreesToSvgCoords(planet2.longitude, aspectLineInnerRadius, center);
                    const style = aspectStyles[aspect.aspect_name.toLowerCase()] || { stroke: '#6b7280', strokeDasharray: '1 1', strokeWidth: 0.5 };
                    return (
                      <line
                        key={`aspect-${index}`}
                        x1={p1Coords.x}
                        y1={p1Coords.y}
                        x2={p2Coords.x}
                        y2={p2Coords.y}
                        stroke={style.stroke}
                        strokeWidth={style.strokeWidth || 0.5}
                        strokeDasharray={style.strokeDasharray || undefined}
                      />
                    );
                  })}
                </g>
              )}

              <g id="planets" fill="#f3f4f6">
                {planets && typeof planets === 'object' && !Array.isArray(planets) &&
                  (Object.values(planets) as PlanetPosition[]).map((planet: PlanetPosition) => {
                  const degree = planet?.longitude;
                  if (typeof degree !== 'number') return null;
                  const planetPos = degreesToSvgCoords(degree, planetRingRadius, center);
                  const glyph = PLANET_GLYPHS[planet.name] || '?';
                  return (
                    <text
                      key={planet.name}
                      x={planetPos.x}
                      y={planetPos.y}
                      fontSize="16"
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="planet-glyph"
                    >
                      {glyph}
                    </text>
                  );
                })}
              </g>
            </g>
          )}
        </svg>
      </div>

      {/* Planet Data Table */}
      {hasPlanetData && (
        <div className="mt-8 overflow-x-auto">
          <h3 className="text-xl font-semibold text-gray-100 mb-3 text-center sm:text-left">Planetary Positions</h3>
          <table className="min-w-full divide-y divide-gray-700 border border-gray-700 rounded-lg">
            <thead className="bg-gray-800">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Planet</th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Glyph</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Sign</th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Sign Glyph</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Longitude</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Position in Sign</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800/50 divide-y divide-gray-700">
              {(Object.values(planets) as PlanetPosition[]).map((planet) => (
                <tr key={planet.name} className="hover:bg-gray-700/50 transition-colors duration-150">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-100">
                    {planet.name}{planet.is_retrograde ? ' (R)' : ''}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 text-center text-lg">
                    {PLANET_GLYPHS[planet.name] || '?'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                    {planet.sign}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 text-center text-lg">
                    {ZODIAC_SIGNS.find(s => s.name === planet.sign)?.symbol || '?'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 text-right">
                    {planet.longitude?.toFixed(2)}°
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 text-right">
                    {planet.deg_within_sign?.toFixed(2)}°
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default NatalChartDisplay;

