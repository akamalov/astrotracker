import React, { useState, useRef } from 'react';
import { PLANET_GLYPHS, SIGN_SYMBOLS, SIGN_FULL_NAMES, ZODIAC_SIGNS } from '../../utils/astrologyConstants';
import type { ChartData, PlanetPosition, Aspect, HouseCusp } from '../../types/astrologyTypes';
import { toPng } from 'html-to-image';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

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

// Helper to normalize planet names for comparison
function normalizeName(name: string) {
  return name.replace(/ /g, '_').toLowerCase();
}

export default function NatalChartDisplay({ chartData }: NatalChartDisplayProps) {
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const { planets, aspects, houses } = chartData.astrological_data || {};
  console.log("Planet names in chart:", Object.values(planets || {}).map((p: any) => p.name));
  const hasPlanetData = planets && typeof planets === 'object' && !Array.isArray(planets);
  const hasAspectData = Array.isArray(aspects) && aspects.length > 0;
  const hasHouseData = Array.isArray(houses) && houses.length > 0;

  // SVG chart dimensions
  const svgSize = 750;
  const center = svgSize / 2;
  const zodiacOuterRadius = svgSize * 0.45;
  const zodiacInnerRadius = svgSize * 0.35;
  const signGlyphRadius = (zodiacOuterRadius + zodiacInnerRadius) / 2;
  const houseCuspLineRadius = zodiacInnerRadius;
  const houseLabelRadius = zodiacInnerRadius - 15;
  const planetRingRadius = houseLabelRadius - 30;

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

  const handleDownloadChart = async () => {
    if (chartRef.current) {
      const dataUrl = await toPng(chartRef.current, { cacheBust: true });
      const link = document.createElement('a');
      link.download = `${chartData.name || 'natal-chart'}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  return (
    <div className="p-4 sm:p-6 border border-gray-700 rounded-lg shadow-lg bg-gray-900 text-gray-200">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-100 mb-4 sm:mb-6 text-center">{chartData.name || 'Unnamed Chart'}</h2>
      <div className="text-center text-gray-400 mb-2">
        {typeof chartData.latitude === 'number' && typeof chartData.longitude === 'number' ? (
          <>
            <span>Coordinates: </span>
            <span className="font-mono">{chartData.latitude.toFixed(5)}, {chartData.longitude.toFixed(5)}</span>
          </>
        ) : (
          <span className="italic text-yellow-400">Coordinates not available</span>
        )}
      </div>
      {/* Advanced Points */}
      {chartData.astrological_data && (
        <div className="text-center text-gray-300 mb-2">
          {chartData.astrological_data.ascendant && (
            <div>
              <span className="font-semibold">Ascendant: </span>
              <span>{chartData.astrological_data.ascendant.sign} ({chartData.astrological_data.ascendant.position.toFixed(2)}°)</span>
            </div>
          )}
          {chartData.astrological_data.midheaven && (
            <div>
              <span className="font-semibold">Midheaven: </span>
              <span>{chartData.astrological_data.midheaven.sign} ({chartData.astrological_data.midheaven.position.toFixed(2)}°)</span>
            </div>
          )}
          {chartData.astrological_data.calculation_error && (
            <div className="text-red-400 font-semibold mt-2">
              Calculation Error: {chartData.astrological_data.calculation_error}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-8">
        {/* Customer Data Panel */}
        <div
          className="flex-1 min-w-[260px] max-w-[340px] bg-gray-900 rounded-md p-4 mb-6"
          style={{ minHeight: 180 }}
        >
          <div className="text-xl font-extrabold text-pink-300 mb-3 tracking-tight">Chart Details</div>
          <div className="mb-1 flex">
            <span className="font-bold text-white w-24">Name:</span>
            <span className="text-white">{chartData.name || '—'}</span>
          </div>
          <div className="mb-1 flex">
            <span className="font-bold text-white w-24">Birth Date:</span>
            <span className="text-white">{chartData.birth_datetime ? new Date(chartData.birth_datetime).toLocaleString() : '—'}</span>
          </div>
          <div className="mb-1 flex">
            <span className="font-bold text-white w-24">Location:</span>
            <span className="text-white">
              {((chartData.city || chartData.country) && (
                <>
                  {chartData.city}{chartData.city && chartData.country ? ', ' : ''}{chartData.country}
                  <br />
                </>
              ))}
              {(typeof chartData.latitude === 'number' && typeof chartData.longitude === 'number')
                ? `${chartData.latitude.toFixed(5)}, ${chartData.longitude.toFixed(5)}`
                : (!chartData.city && !chartData.country ? '—' : null)}
            </span>
          </div>
        </div>

        {/* Chart and legend */}
        <div className="flex-1 flex flex-col items-center">
          <div ref={chartRef}>
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
                    const isHighlighted = selectedPlanet && (
                      normalizeName(aspect.p1_name) === normalizeName(selectedPlanet) ||
                      normalizeName(aspect.p2_name) === normalizeName(selectedPlanet)
                    );
                    return (
                      <Tippy
                        key={idx}
                        content={
                          <div>
                            <strong>{aspect.p1_name} {aspect.aspect_name} {aspect.p2_name}</strong><br />
                            Orb: {typeof aspect.orb === 'number' ? aspect.orb.toFixed(2) : '-'}
                          </div>
                        }
                        placement="top"
                        arrow={true}
                      >
                        <line
                          x1={pos1.x}
                          y1={pos1.y}
                          x2={pos2.x}
                          y2={pos2.y}
                          stroke={isHighlighted ? '#FF4081' : '#FFD600'}
                          strokeWidth={isHighlighted ? 2.5 : 1}
                          opacity={isHighlighted ? 1 : 0.7}
                          style={{ transition: 'all 0.2s' }}
                        />
                      </Tippy>
                    );
                  })}
                </g>

                {/* Planet glyphs */}
                <g id="planets" fill="#f3f4f6">
                  {hasPlanetData && Object.entries(planets as Record<string, PlanetPosition>).map(([planetKey, planet]: [string, PlanetPosition]) => {
                    const degree = planet?.longitude;
                    if (typeof degree !== 'number') return null;
                    const planetPos = degreesToSvgCoords(degree, planetRingRadius, center);
                    const glyph = PLANET_GLYPHS[planet.name] || '?';
                    const isSelected = selectedPlanet === planetKey;
                    return (
                      <Tippy
                        key={planetKey}
                        content={
                          <div>
                            <strong>{planet.name}</strong><br />
                            {planet.sign} {planet.longitude?.toFixed(2)}°<br />
                            {planet.deg_within_sign !== undefined && (
                              <>Deg in Sign: {planet.deg_within_sign.toFixed(2)}°<br /></>
                            )}
                            {planet.dignity && <>Dignity: {planet.dignity}</>}
                          </div>
                        }
                        placement="top"
                        arrow={true}
                      >
                        <text
                          x={planetPos.x}
                          y={planetPos.y}
                          fontSize="16"
                          textAnchor="middle"
                          dominantBaseline="central"
                          className={`planet-glyph ${isSelected ? 'highlighted' : ''}`}
                          style={{
                            cursor: 'pointer',
                            fill: isSelected ? '#FFD600' : '#f3f4f6',
                            fontWeight: isSelected ? 'bold' : 'normal',
                            stroke: isSelected ? '#FFD600' : 'none',
                            strokeWidth: isSelected ? 1 : 0,
                          }}
                          onClick={() => setSelectedPlanet(planetKey)}
                        >
                          {glyph}
                        </text>
                      </Tippy>
                    );
                  })}
                </g>
              </svg>
            </div>

            {/* Legend/Key */}
            <div className="mt-4 flex flex-col sm:flex-row sm:justify-center gap-6">
              {/* Planet Glyphs */}
              <div>
                <div className="font-semibold mb-1 text-gray-200">Planets</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(PLANET_GLYPHS).map(([name, glyph]) => (
                    <span key={name} className="flex items-center gap-1 text-sm text-gray-100 border border-gray-700 rounded px-2 py-1 bg-gray-800">
                      <span style={{ fontSize: 18 }}>{glyph}</span>
                      <span>{name.replace(/_/g, ' ')}</span>
                    </span>
                  ))}
                </div>
              </div>
              {/* Aspect Lines */}
              <div>
                <div className="font-semibold mb-1 text-gray-200">Aspect Lines</div>
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-2">
                    <span style={{ width: 24, height: 0, borderTop: '2px solid #FFD600', display: 'inline-block' }}></span>
                    <span>Aspect</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span style={{ width: 24, height: 0, borderTop: '2.5px solid #FF4081', display: 'inline-block' }}></span>
                    <span>Highlighted Aspect</span>
                  </span>
                </div>
              </div>
              {/* House Cusps */}
              <div>
                <div className="font-semibold mb-1 text-gray-200">House Cusps</div>
                <div className="flex items-center gap-2">
                  <span style={{ width: 24, height: 0, borderTop: '2px solid pink', display: 'inline-block' }}></span>
                  <span>House Cusp</span>
                </div>
              </div>
            </div>
          </div>
          <button
            className="mt-4 px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={handleDownloadChart}
          >
            Download Chart as PNG
          </button>
        </div>
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
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Dignity</th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-800">
              {Object.values(planets as Record<string, PlanetPosition>).map((planet) => (
                <tr key={planet.name}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-100 flex items-center gap-1">
                    {planet.name}
                    {planet.retrograde && (
                      <span
                        title="Retrograde"
                        className="ml-1 text-red-400 font-bold text-xs align-middle"
                        style={{ fontWeight: 'bold', fontSize: '1rem', verticalAlign: 'middle' }}
                      >
                        R
                      </span>
                    )}
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
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    {planet.dignity ? planet.dignity : '-'}
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

      {/* Element and Mode Balances */}
      {chartData.astrological_data && (
        <div className="flex flex-col sm:flex-row justify-center gap-8 mb-4">
          {/* Elements */}
          {chartData.astrological_data.element_counts && (
            <div>
              <h4 className="text-lg font-semibold text-gray-200 mb-2 text-center">
                Elements
                <span
                  className="ml-1 cursor-pointer text-blue-300 align-middle"
                  title="Fire: Aries, Leo, Sagittarius — Energetic, passionate.\nEarth: Taurus, Virgo, Capricorn — Practical, grounded.\nAir: Gemini, Libra, Aquarius — Intellectual, social.\nWater: Cancer, Scorpio, Pisces — Emotional, intuitive."
                  aria-label="Element Info"
                >
                  ℹ️
                </span>
              </h4>
              <table className="min-w-[120px] mx-auto text-sm border border-gray-700 rounded-lg mb-2">
                <tbody>
                  {Object.entries(chartData.astrological_data.element_counts).map(([element, count]) => (
                    <tr key={element}>
                      <td className="px-3 py-1 text-gray-300">{element}</td>
                      <td className="px-3 py-1 text-right font-mono text-gray-100">{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Bar Chart for Elements */}
              <div className="w-full max-w-xs mx-auto">
                {Object.entries(chartData.astrological_data.element_counts).map(([element, count]) => {
                  const colors: Record<string, string> = {
                    Fire: '#f87171', // red-400
                    Earth: '#a3e635', // lime-400
                    Air: '#38bdf8', // sky-400
                    Water: '#818cf8', // indigo-400
                  };
                  const max = Math.max(...Object.values(chartData.astrological_data.element_counts));
                  const width = max > 0 ? (100 * (count as number) / max) : 0;
                  return (
                    <div key={element} className="flex items-center mb-1">
                      <span className="w-14 text-xs text-gray-300">{element}</span>
                      <div className="flex-1 h-4 rounded bg-gray-800 ml-2 relative">
                        <div
                          className="h-4 rounded"
                          style={{ width: `${width}%`, backgroundColor: colors[element] || '#888' }}
                        ></div>
                        <span className="absolute right-2 top-0 text-xs text-gray-200">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* Modes */}
          {chartData.astrological_data.mode_counts && (
            <div>
              <h4 className="text-lg font-semibold text-gray-200 mb-2 text-center">
                Modes
                <span
                  className="ml-1 cursor-pointer text-blue-300 align-middle"
                  title="Cardinal: Aries, Cancer, Libra, Capricorn — Initiating, dynamic.\nFixed: Taurus, Leo, Scorpio, Aquarius — Stable, persistent.\nMutable: Gemini, Virgo, Sagittarius, Pisces — Adaptable, flexible."
                  aria-label="Mode Info"
                >
                  ℹ️
                </span>
              </h4>
              <table className="min-w-[120px] mx-auto text-sm border border-gray-700 rounded-lg mb-2">
                <tbody>
                  {Object.entries(chartData.astrological_data.mode_counts).map(([mode, count]) => (
                    <tr key={mode}>
                      <td className="px-3 py-1 text-gray-300">{mode}</td>
                      <td className="px-3 py-1 text-right font-mono text-gray-100">{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Bar Chart for Modes */}
              <div className="w-full max-w-xs mx-auto">
                {Object.entries(chartData.astrological_data.mode_counts).map(([mode, count]) => {
                  const colors: Record<string, string> = {
                    Cardinal: '#fbbf24', // amber-400
                    Fixed: '#f472b6', // pink-400
                    Mutable: '#34d399', // emerald-400
                  };
                  const max = Math.max(...Object.values(chartData.astrological_data.mode_counts));
                  const width = max > 0 ? (100 * (count as number) / max) : 0;
                  return (
                    <div key={mode} className="flex items-center mb-1">
                      <span className="w-14 text-xs text-gray-300">{mode}</span>
                      <div className="flex-1 h-4 rounded bg-gray-800 ml-2 relative">
                        <div
                          className="h-4 rounded"
                          style={{ width: `${width}%`, backgroundColor: colors[mode] || '#888' }}
                        ></div>
                        <span className="absolute right-2 top-0 text-xs text-gray-200">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

