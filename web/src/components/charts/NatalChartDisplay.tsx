import React from 'react';
import { PLANET_GLYPHS, SIGN_SYMBOLS, SIGN_FULL_NAMES, ZODIAC_SIGNS } from '../../utils/astrologyConstants';
import type { ChartData, PlanetPosition, Aspect, HouseCusp } from '../../types/astrologyTypes';

interface NatalChartDisplayProps {
  chartData: ChartData;
}

// Helper functions for SVG math
function degreesToRadians(deg: number) {
  return (deg - 90) * (Math.PI / 180);
}

function round(num: number, decimals = 2) {
  return Number(num.toFixed(decimals));
}

function degreesToSvgCoords(deg: number, radius: number, center: number) {
  const rad = degreesToRadians(deg);
  return {
    x: round(center + radius * Math.cos(rad), 2),
    y: round(center + radius * Math.sin(rad), 2),
  };
}

export default function NatalChartDisplay({ chartData }: NatalChartDisplayProps) {
  const { planets, aspects, houses } = chartData.astrological_data || {};
  console.log("Planet names in chart:", Object.values(planets || {}).map((p: any) => p.name));
  const hasPlanetData = planets && typeof planets === 'object' && !Array.isArray(planets);
  const hasAspectData = Array.isArray(aspects) && aspects.length > 0;
  const hasHouseData = Array.isArray(houses) && houses.length > 0;

  // SVG chart dimensions
  const svgSize = 500;
  const center = svgSize / 2;
  const zodiacOuterRadius = svgSize * 0.45;
  const zodiacInnerRadius = svgSize * 0.35;
  const signGlyphRadius = (zodiacOuterRadius + zodiacInnerRadius) / 2;
  const houseCuspLineRadius = zodiacInnerRadius;
  const houseLabelRadius = zodiacInnerRadius - 10;
  const planetRingRadius = houseLabelRadius - 20;

  // Helper for SVG arc
  function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
    const start = degreesToSvgCoords(startAngle, r, cx);
    const end = degreesToSvgCoords(endAngle, r, cx);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return [
      'M', start.x, start.y,
      'A', r, r, 0, largeArcFlag, 1, end.x, end.y
    ].join(' ');
  }

  return (
    <div className="p-4 sm:p-6 border border-gray-700 rounded-lg shadow-lg bg-gray-900 text-gray-200">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-100 mb-4 sm:mb-6 text-center">{chartData.name || 'Unnamed Chart'}</h2>

      {/* SVG Chart Wheel */}
      <div className="mb-6 w-full flex justify-center">
        <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} className="rounded-full">
          {/* Zodiac ring */}
          <g id="zodiac-ring">
            {ZODIAC_SIGNS.map((sign, index) => {
              const startAngle = index * 30;
              const endAngle = (index + 1) * 30;
              const midAngle = startAngle + 15;
              const arcPath = describeArc(center, center, zodiacOuterRadius, startAngle, endAngle) +
                              ` L ${degreesToSvgCoords(endAngle, zodiacInnerRadius, center).x} ${degreesToSvgCoords(endAngle, zodiacInnerRadius, center).y}` +
                              ` A ${zodiacInnerRadius} ${zodiacInnerRadius} 0 0 0 ${degreesToSvgCoords(startAngle, zodiacInnerRadius, center).x} ${degreesToSvgCoords(startAngle, zodiacInnerRadius, center).y}` +
                              ' Z';
              const fill = index % 2 === 0 ? '#181d28' : '#23293a';
              const mid = degreesToSvgCoords(midAngle, signGlyphRadius, center);
              return (
                <g key={sign}>
                  <path d={arcPath} fill={fill} stroke="#444" strokeWidth={1} />
                  <text x={mid.x} y={mid.y} fontSize="22" textAnchor="middle" dominantBaseline="central" fill="#b6b6e0">
                    {SIGN_SYMBOLS[sign]}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Zodiac sector lines (every 30°) */}
          <g id="zodiac-sector-lines">
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = i * 30;
              const start = degreesToSvgCoords(angle, 0, center);
              const end = degreesToSvgCoords(angle, zodiacOuterRadius, center);
              return (
                <line
                  key={i}
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke="#8884"
                  strokeWidth={1}
                />
              );
            })}
          </g>

          {/* House cusp lines */}
          <g id="house-cusps">
            {hasHouseData && houses.map((house: HouseCusp, idx: number) => {
              const angle = house.absolute_position;
              const start = degreesToSvgCoords(angle, 0, center);
              const end = degreesToSvgCoords(angle, houseCuspLineRadius, center);
              return (
                <line
                  key={idx}
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke="pink"
                  strokeWidth={idx % 3 === 0 ? 0.7 : 0.3}
                />
              );
            })}
          </g>

          {/* Aspect lines (yellow) */}
          <g id="aspect-lines">
            {hasAspectData && aspects.map((aspect: Aspect, idx: number) => {
              const p1 = planets?.[aspect.p1_name];
              const p2 = planets?.[aspect.p2_name];
              if (!p1 || !p2) return null;
              const pos1 = degreesToSvgCoords(p1.longitude, planetRingRadius, center);
              const pos2 = degreesToSvgCoords(p2.longitude, planetRingRadius, center);
              return (
                <line
                  key={idx}
                  x1={pos1.x}
                  y1={pos1.y}
                  x2={pos2.x}
                  y2={pos2.y}
                  stroke="#FFD600"
                  strokeWidth={1}
                  opacity={0.7}
                />
              );
            })}
          </g>

          {/* Planet glyphs */}
          <g id="planets" fill="#f3f4f6">
            {hasPlanetData && Object.values(planets as Record<string, PlanetPosition>).map((planet: PlanetPosition) => {
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
        </svg>
      </div>

      {/* Planet Data Table */}
      {hasPlanetData && (
        <div className="mt-8 overflow-x-auto">
          <h3 className="text-xl font-semibold text-gray-100 mb-3 text-center sm:text-left">Planetary Positions</h3>
          <table className="min-w-full divide-y divide-gray-700 border border-gray-700 rounded-lg">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Planet</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Glyph</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Sign</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Sign Glyph</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Longitude</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Deg in Sign</th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-800">
              {Object.values(planets as Record<string, PlanetPosition>).map((planet) => (
                <tr key={planet.name}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-100">
                    {planet.name}{planet.retrograde ? ' (R)' : ''}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 text-center">
                    {PLANET_GLYPHS[planet.name] || '?'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                    {SIGN_FULL_NAMES[planet.sign] || planet.sign}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 text-center">
                    {SIGN_SYMBOLS[planet.sign] || '?'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 text-right">
                    {typeof planet.longitude === 'number' ? `${planet.longitude.toFixed(2)}°` : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 text-right">
                    {typeof planet.deg_within_sign === 'number' ? `${planet.deg_within_sign.toFixed(2)}°` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Aspect Data Table */}
      {hasAspectData && (
        <div className="mt-8 overflow-x-auto">
          <h3 className="text-xl font-semibold text-gray-100 mb-3 text-center sm:text-left">Aspects</h3>
          <table className="min-w-full divide-y divide-gray-700 border border-gray-700 rounded-lg">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Planet 1</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Aspect</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Planet 2</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Orb</th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-800">
              {aspects.map((aspect: Aspect, idx: number) => (
                <tr key={idx}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-100">
                    {aspect.p1_name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 text-center">
                    {aspect.aspect_name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-100">
                    {aspect.p2_name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 text-right">
                    {typeof aspect.orb === 'number' ? aspect.orb.toFixed(2) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* House Cusps Data Table */}
      {hasHouseData && (
        <div className="mt-8 overflow-x-auto">
          <h3 className="text-xl font-semibold text-gray-100 mb-3 text-center sm:text-left">House Cusps</h3>
          <table className="min-w-full divide-y divide-gray-700 border border-gray-700 rounded-lg">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">House</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Sign</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Glyph</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Longitude</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Deg in Sign</th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-800">
              {houses.map((house: HouseCusp, idx: number) => {
                const sign = SIGN_FULL_NAMES[house.sign] || house.sign;
                const glyph = SIGN_SYMBOLS[house.sign] || '?';
                const positionInSign = typeof house.absolute_position === 'number' ? house.absolute_position % 30 : null;
                return (
                  <tr key={idx}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-100">
                      {house.house_number}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                      {sign}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 text-center">
                      {glyph}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 text-right">
                      {typeof house.absolute_position === 'number' ? `${house.absolute_position.toFixed(2)}°` : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 text-right">
                      {positionInSign !== null ? `${positionInSign.toFixed(2)}°` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

