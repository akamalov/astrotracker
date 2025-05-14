import React, { useState, useRef } from 'react';
import { PLANET_GLYPHS, SIGN_SYMBOLS, SIGN_FULL_NAMES, ZODIAC_SIGNS } from '../../utils/astrologyConstants';
import type { ChartData, PlanetPosition, Aspect, HouseCusp } from '../../types/astrologyTypes';
import { toPng } from 'html-to-image';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import TarotWidget from './TarotWidget';
import type { TransitData } from "./ChartWithTransits";

interface NatalChartDisplayProps {
  chartData: ChartData;
  transitData?: TransitData;
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

// Helper to normalize sun sign for TarotWidget
function normalizeSunSign(sign: string) {
  if (!sign) return '';
  // Remove whitespace, lowercase, then capitalize first letter only
  const s = sign.trim().toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function NatalChartDisplay({ chartData, transitData }: NatalChartDisplayProps) {
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
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
  const transitRingRadius = planetRingRadius + 30;

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

  // Get Sun sign from astrological_data.sun.sign or fallback to planets.Sun.sign
  const sunSign = chartData.astrological_data?.sun?.sign || chartData.astrological_data?.planets?.Sun?.sign || '';
  const normalizedSunSign = normalizeSunSign(sunSign);
  console.log('Raw Sun sign:', sunSign, 'Normalized:', normalizedSunSign);

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

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column: Chart Details, Elements, Modes, Tarot */}
        <div className="flex flex-col gap-4 min-w-[260px] max-w-[340px] flex-1 rounded-lg p-2" ref={detailsRef} style={{ background: 'inherit' }}>
          {/* Chart Details Card */}
          <div className="rounded-md p-4 mb-0" style={{ background: 'inherit' }}>
            <h3 className="text-xl font-bold mb-3 text-pink-400">Chart Details</h3>
            <div className="mb-1 flex">
              <span className="font-bold w-24" style={{ color: '#f2ebf5' }}>Name:</span>
              <span style={{ color: '#f2ebf5' }}>{chartData.name || '—'}</span>
            </div>
            <div className="mb-1 flex">
              <span className="font-bold w-24" style={{ color: '#f2ebf5' }}>Birth Date:</span>
              <span style={{ color: '#f2ebf5' }}>{chartData.birth_datetime ? new Date(chartData.birth_datetime).toLocaleString() : '—'}</span>
            </div>
            <div className="mb-1 flex">
              <span className="font-bold w-24" style={{ color: '#f2ebf5' }}>Location:</span>
              <span style={{ color: '#f2ebf5' }}>
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
          {/* Indented group: Elements, Modes, Tarot */}
          <div className="flex flex-col gap-4 ml-8">
            {/* Elements Card */}
            <div className="rounded-md p-4" style={{ background: 'inherit' }}>
              <h3 className="text-lg font-bold mb-2 text-blue-300 flex items-center gap-2">Elements
                <span className="text-xs text-gray-400"><i className="fa fa-info-circle" /></span>
              </h3>
              {/* Bar Chart for Elements */}
              <div className="w-full max-w-xs mx-auto">
                {Object.entries(chartData.astrological_data?.element_counts ?? {}).map(([element, count]) => {
                  const colors: Record<string, string> = {
                    Fire: '#f87171', // red-400
                    Earth: '#a3e635', // lime-400
                    Air: '#38bdf8', // sky-400
                    Water: '#818cf8', // indigo-400
                  };
                  const max = Math.max(...Object.values(chartData.astrological_data?.element_counts ?? {}));
                  const width = max > 0 ? (100 * (count as number) / max) : 0;
                  return (
                    <div key={element} className="flex items-center mb-1">
                      <span className="w-14 text-xs" style={{ color: '#ecf4fa' }}>{element}</span>
                      <div className="flex-1 h-4 rounded bg-gray-200 ml-2 relative">
                        <div
                          className="h-4 rounded"
                          style={{ width: `${width}%`, backgroundColor: colors[element] || '#888' }}
                        ></div>
                        <span className="absolute right-2 top-0 text-xs text-gray-900">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Modes Card */}
            <div className="rounded-md p-4" style={{ background: 'inherit' }}>
              <h3 className="text-lg font-bold mb-2 text-green-300 flex items-center gap-2">Modes
                <span className="text-xs text-gray-400"><i className="fa fa-info-circle" /></span>
              </h3>
              {/* Bar Chart for Modes */}
              <div className="w-full max-w-xs mx-auto">
                {Object.entries(chartData.astrological_data?.mode_counts ?? {}).map(([mode, count]) => {
                  const colors: Record<string, string> = {
                    Cardinal: '#fbbf24', // amber-400
                    Fixed: '#f472b6', // pink-400
                    Mutable: '#34d399', // emerald-400
                  };
                  const max = Math.max(...Object.values(chartData.astrological_data?.mode_counts ?? {}));
                  const width = max > 0 ? (100 * (count as number) / max) : 0;
                  return (
                    <div key={mode} className="flex items-center mb-1">
                      <span className="w-14 text-xs" style={{ color: '#ecf4fa' }}>{mode}</span>
                      <div className="flex-1 h-4 rounded bg-gray-200 ml-2 relative">
                        <div
                          className="h-4 rounded"
                          style={{ width: `${width}%`, backgroundColor: colors[mode] || '#888' }}
                        ></div>
                        <span className="absolute right-2 top-0 text-xs text-gray-900">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Tarot Insight Widget */}
            <div className="mt-0">
              <TarotWidget sunSign={normalizedSunSign} birthDate={chartData.birth_datetime ? chartData.birth_datetime.slice(0, 10) : ''} />
            </div>
          </div>
        </div>
        {/* Right: Chart Wheel and Legend */}
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

                {/* Overlay: Render transiting planet glyphs (outer ring, blue) */}
                {transitData &&
                  Object.values(transitData.transiting_planets).map((planet: any, idx: number) => {
                    // Use longitude if present, else fallback to position
                    const degree = typeof planet?.longitude === "number" ? planet.longitude : planet?.position;
                    if (typeof degree !== "number") return null;
                    const pos = degreesToSvgCoords(degree, transitRingRadius, center);
                    const glyph = PLANET_GLYPHS[planet.name] || "?";
                    return (
                      <Tippy
                        key={"transit-" + planet.name}
                        content={
                          <div>
                            <strong>Transiting {planet.name}</strong><br />
                            {planet.sign} {degree.toFixed(2)}°
                          </div>
                        }
                        placement="top"
                        arrow={true}
                      >
                        <text
                          x={pos.x}
                          y={pos.y}
                          fontSize="16"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#38bdf8"
                          stroke="#222"
                          strokeWidth={0.5}
                          opacity={0.85}
                          style={{ fontWeight: "bold", cursor: "pointer" }}
                        >
                          {glyph}
                        </text>
                      </Tippy>
                    );
                  })}

                {/* Overlay: Render aspect lines between transiting and natal planets (blue) */}
                {transitData &&
                  transitData.aspects_to_natal.map((aspect: any, idx: number) => {
                    const transiting = transitData.transiting_planets[aspect.transiting_planet];
                    const natal = planets?.[aspect.natal_planet];
                    if (!transiting || !natal) return null;
                    // Use longitude if present, else fallback to position (if present)
                    const transitingDegree = typeof transiting?.longitude === "number"
                      ? transiting.longitude
                      : (typeof (transiting as any)?.position === "number" ? (transiting as any).position : undefined);
                    const natalDegree = typeof natal?.longitude === "number"
                      ? natal.longitude
                      : (typeof (natal as any)?.position === "number" ? (natal as any).position : undefined);
                    if (typeof transitingDegree !== "number" || typeof natalDegree !== "number") return null;
                    const pos1 = degreesToSvgCoords(transitingDegree, transitRingRadius, center);
                    const pos2 = degreesToSvgCoords(natalDegree, planetRingRadius, center);
                    const interpretation = aspect.interpretation || aspect.meaning;
                    return (
                      <Tippy
                        key={"aspect-transit-" + idx}
                        content={
                          <div style={{ maxWidth: 260 }}>
                            <strong>Transit {aspect.transiting_planet} {aspect.aspect_name} Natal {aspect.natal_planet}</strong><br />
                            Orb: {typeof aspect.orb === 'number' ? aspect.orb.toFixed(2) : '-'}
                            {interpretation && (
                              <>
                                <hr style={{ margin: '6px 0', borderColor: '#38bdf8' }} />
                                <span style={{ fontSize: 13, color: '#38bdf8' }}>{interpretation}</span>
                              </>
                            )}
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
                          stroke="#38bdf8"
                          strokeWidth={1.5}
                          opacity={0.7}
                        />
                      </Tippy>
                    );
                  })}
              </svg>
            </div>
            {/* Download Buttons */}
            <div className="flex justify-center mb-4 gap-2">
              <button
                onClick={handleDownloadChart}
                className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 focus:outline-none focus:ring"
              >
                Download Chart as PNG
              </button>
            </div>
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
                <span className="flex items-center gap-2">
                  <span style={{ width: 24, height: 0, borderTop: '2px solid #38bdf8', display: 'inline-block' }}></span>
                  <span>Transit Aspect</span>
                </span>
              </div>
            </div>
            {/* Transiting Planets */}
            <div>
              <div className="font-semibold mb-1 text-gray-200">Transiting Planets</div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 18, color: '#38bdf8' }}>☉</span>
                <span className="text-blue-300">Transiting Glyph (outer ring, blue)</span>
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
    </div>
  );
}

