import { useState, useEffect } from 'react';
import { X, CheckCircle, Clock, Shield, FileText, Users, HardHat, TestTube, Rocket } from 'lucide-react';
import DelhiTrafficMap, { TrafficHotspot, OptimizationZone } from './DelhiTrafficMap';

interface Props {
  zone: OptimizationZone;
  allHotspots: TrafficHotspot[];
  onClose: () => void;
}

export default function ZoneVisualization({ zone, allHotspots, onClose }: Props) {
  const [animationStep, setAnimationStep] = useState<'intro' | 'optimizing' | 'building' | 'complete' | 'analysis'>('intro');
  const [progress, setProgress] = useState(0);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [activeRouteIndex, setActiveRouteIndex] = useState(0);

  useEffect(() => {
    const introTimer = setTimeout(() => {
      setAnimationStep('optimizing');
    }, 600);
    return () => clearTimeout(introTimer);
  }, []);

  useEffect(() => {
    if (animationStep === 'optimizing') {
      const interval = setInterval(() => {
        setOptimizationProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setAnimationStep('building'), 400);
            return 100;
          }
          return prev + 3;
        });
      }, 35);
      return () => clearInterval(interval);
    }
  }, [animationStep]);

  // Determine intervention type early for use in animation config
  const interventionType = zone.intervention.includes('Metro') ? 'metro' as const
    : zone.intervention.includes('Bicycle') ? 'bicycle' as const : 'bus' as const;

  // totalRoutes: metro 4 lines + traffic lights, bicycle 1 path + traffic lights, bus 3 routes + traffic lights
  const totalRoutes = interventionType === 'metro' ? 5 : interventionType === 'bicycle' ? 2 : 4;

  useEffect(() => {
    if (animationStep === 'building') {
      // Each route gets an equal share of the 0-100 progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setAnimationStep('complete'), 300);
            return 100;
          }
          // Update active route index based on progress
          const newRouteIdx = Math.min(Math.floor(prev / (100 / totalRoutes)), totalRoutes - 1);
          setActiveRouteIndex(newRouteIdx);
          return prev + 1.5;
        });
      }, 40);
      return () => clearInterval(interval);
    }
  }, [animationStep, totalRoutes]);

  useEffect(() => {
    if (animationStep === 'complete') {
      const timer = setTimeout(() => {
        setAnimationStep('analysis');
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [animationStep]);

  // Seeded random for deterministic but varied routes per zone
  const seed = zone.name.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
  const sr = (i: number) => { const x = Math.sin(seed * 9301 + i * 49297) * 49297; return x - Math.floor(x); };

  // Build an SVG path through waypoints with rounded corners
  const buildPath = (pts: [number, number][], radius = 14): string => {
    if (pts.length < 2) return '';
    let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const [px, py] = pts[i - 1];
      const [nx, ny] = pts[i];
      if (i < pts.length - 1) {
        const [nnx, nny] = pts[i + 1];
        const d1x = nx - px, d1y = ny - py, d2x = nnx - nx, d2y = nny - ny;
        const l1 = Math.sqrt(d1x * d1x + d1y * d1y);
        const l2 = Math.sqrt(d2x * d2x + d2y * d2y);
        const cr = Math.min(radius, l1 * 0.4, l2 * 0.4);
        if (l1 > 0 && l2 > 0) {
          d += ` L ${(nx - d1x / l1 * cr).toFixed(1)} ${(ny - d1y / l1 * cr).toFixed(1)}`;
          d += ` Q ${nx.toFixed(1)} ${ny.toFixed(1)} ${(nx + d2x / l2 * cr).toFixed(1)} ${(ny + d2y / l2 * cr).toFixed(1)}`;
          continue;
        }
      }
      d += ` L ${nx.toFixed(1)} ${ny.toFixed(1)}`;
    }
    return d;
  };

  // Station positions evenly spaced along polyline segments
  const stationsAlongPts = (pts: [number, number][], count: number) => {
    let totalLen = 0;
    const segLens: number[] = [];
    for (let i = 1; i < pts.length; i++) {
      const len = Math.sqrt((pts[i][0] - pts[i-1][0]) ** 2 + (pts[i][1] - pts[i-1][1]) ** 2);
      segLens.push(len);
      totalLen += len;
    }
    const stations: { x: number; y: number }[] = [];
    for (let s = 0; s < count; s++) {
      const targetDist = totalLen * (s + 1) / (count + 1);
      let cumDist = 0;
      for (let i = 0; i < segLens.length; i++) {
        if (cumDist + segLens[i] >= targetDist) {
          const t = (targetDist - cumDist) / segLens[i];
          stations.push({
            x: pts[i][0] + (pts[i+1][0] - pts[i][0]) * t,
            y: pts[i][1] + (pts[i+1][1] - pts[i][1]) * t,
          });
          break;
        }
        cumDist += segLens[i];
      }
    }
    return stations;
  };

  // ─── METRO: 4 lines forming a realistic network ───
  const zoneIdx = seed % 6;
  const metroLineDefs: { pts: [number, number][]; color: string; label: string; stationNames: string[] }[] = (() => {
    const ox = (zoneIdx % 3) * 12;
    const oy = (zoneIdx % 2) * 15;
    const jf1 = 0.35 + sr(1) * 0.3;
    const jf2 = 0.4 + sr(2) * 0.25;
    const jf3 = 0.3 + sr(3) * 0.35;
    const jf4 = 0.45 + sr(4) * 0.2;
    return [
      { pts: [[50+ox,165+oy],[50+ox+700*jf1,165+oy],[50+ox+700*jf1,225+oy],[750-ox,225+oy]], color:'#dc2626', label:'Red Line',
        stationNames:['Angered','Kortedala','Gamlestaden','Central Station','Brunnsparken','Hjalmar Branting'] },
      { pts: [[60+ox,375-oy],[60+ox+680*jf2,375-oy],[60+ox+680*jf2,430-oy],[740-ox,430-oy]], color:'#1e40af', label:'Blue Line',
        stationNames:['Lindholmen','Hisingen','Jarnvagsbron','Nordstan','Ullevi'] },
      { pts: [[275+ox,45+oy],[275+ox,45+oy+480*jf3],[335+ox,45+oy+480*jf3],[335+ox,555-oy]], color:'#ca8a04', label:'Yellow Line',
        stationNames:['Saltholmen','Frolunda Torg','Marklandsgatan','Korsvagen','Liseberg','Central Station'] },
      { pts: [[555-ox,55+oy],[555-ox,55+oy+200*jf4],[485-ox,55+oy+200*jf4],[485-ox,525-oy]], color:'#9333ea', label:'Magenta Line',
        stationNames:['Backaplan','Wieselgrensplatsen','Hjalmar Branting','Avenyn'] },
    ];
  })();

  const metroRoutes = metroLineDefs.map(def => ({
    path: buildPath(def.pts),
    color: def.color,
    label: def.label,
    stations: stationsAlongPts(def.pts, def.stationNames.length).map((s, i) => ({ ...s, name: def.stationNames[i] })),
  }));

  // ─── BICYCLE: 1 long realistic grid-following bike path ───
  // The path zigzags through the street grid like a real bike lane would
  const bicyclePath = (() => {
    // 10+ waypoints alternating H/V segments to simulate following roads
    const gridPts: [number, number][] = [
      [60 + sr(80)*30, 80 + sr(81)*30],        // start NW area
      [220 + sr(82)*40, 80 + sr(81)*30],        // go east
      [220 + sr(82)*40, 200 + sr(83)*40],       // go south
      [400 + sr(84)*30, 200 + sr(83)*40],       // go east
      [400 + sr(84)*30, 320 + sr(85)*30],       // go south
      [550 + sr(86)*40, 320 + sr(85)*30],       // go east
      [550 + sr(86)*40, 440 + sr(87)*30],       // go south
      [700 + sr(88)*40, 440 + sr(87)*30],       // go east to end
    ];
    return {
      path: buildPath(gridPts, 12),
      color: '#059669',
      stations: stationsAlongPts(gridPts, 4),
    };
  })();

  // ─── SMART TRAFFIC LIGHTS: placed at key intersections across the zone ───
  const smartLights = Array.from({ length: 6 }, (_, i) => ({
    x: 100 + sr(i + 100) * 600,
    y: 80 + sr(i + 106) * 440,
    id: `TL-${(i + 1).toString().padStart(2, '0')}`,
  }));

  // Bus routes: 3 medium routes with L-shaped grid paths
  const busRoutes = Array.from({ length: 3 }, (_, i) => {
    const sx = 80+sr(i+70)*80, sy = 120+i*160;
    const ex = 640+sr(i+71)*80, ey = 140+i*160+(sr(i+72)-0.5)*60;
    const midX = sx+(ex-sx)*(0.4+sr(i+73)*0.2);
    const goH = sr(i+74) > 0.5;
    const pts: [number,number][] = goH
      ? [[sx,sy],[midX,sy],[midX,ey],[ex,ey]]
      : [[sx,sy],[sx,(sy+ey)/2],[ex,(sy+ey)/2],[ex,ey]];
    return {
      path: buildPath(pts, 10),
      color: ['#2563eb','#3b82f6','#60a5fa'][i],
      label: `Route ${i+1}`,
      stops: stationsAlongPts(pts, 4),
    };
  });

  const centerX = 400;
  const centerY = 300;
  const zoom = interventionType === 'metro' ? 13 : interventionType === 'bicycle' ? 16 : 15;

  // Calculate OpenStreetMap tiles for this zone
  const tileX = Math.floor((zone.lng + 180) / 360 * Math.pow(2, zoom));
  const tileY = Math.floor((1 - Math.log(Math.tan(zone.lat * Math.PI / 180) + 1 / Math.cos(zone.lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));

  // Calculate cost metrics - vary based on zone
  const baseMultiplier = zone.name.length % 3 === 0 ? 1.1 : zone.name.length % 3 === 1 ? 0.95 : 1.05;
  const estimatedCost = zone.intervention.includes('Metro') ? 6000000 * baseMultiplier :
                       zone.intervention.includes('Tram') ? 3200000 * baseMultiplier : 750000 * baseMultiplier;
  const costPerImpactPoint = estimatedCost / (zone.impact.trafficFlow + zone.impact.citizenHappiness);
  const roi = ((zone.impact.trafficFlow * 50000 + zone.impact.citizenHappiness * 30000) / estimatedCost * 100);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 sm:p-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl mb-1">{zone.name}</h2>
            <p className="text-indigo-100">{zone.intervention}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-96px)] sm:max-h-[calc(90vh-100px)]">
          {/* Map Visualization */}
          <div className="mb-6">
            <div className="relative h-[320px] sm:h-[420px] lg:h-[500px] rounded-xl overflow-hidden border-2 border-indigo-200">
              {/* OpenStreetMap Background - 3x3 grid of tiles */}
              <div className="absolute inset-0" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(3, 1fr)' }}>
                {[-1, 0, 1].map(dy =>
                  [-1, 0, 1].map(dx => (
                    <img
                      key={`${dx}-${dy}`}
                      src={`https://tile.openstreetmap.org/${zoom}/${tileX + dx}/${tileY + dy}.png`}
                      alt=""
                      className="w-full h-full block"
                      style={{ display: 'block', objectFit: 'fill' }}
                      crossOrigin="anonymous"
                      draggable={false}
                    />
                  ))
                )}
              </div>

              {/* Zone label overlay */}
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border-2 border-indigo-500">
                <div className="font-bold text-indigo-900">{zone.name}</div>
                <div className="text-xs text-indigo-700">
                  {interventionType === 'metro' ? 'Metro Network + Smart Signals' :
                   interventionType === 'bicycle' ? 'Bike Lane + Smart Signals' :
                   'Bus Routes + Smart Signals'}
                </div>
              </div>

              {/* Overlay Animation */}
              <svg
                viewBox="0 0 800 600"
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ zIndex: 20 }}
              >
                <defs>
                  <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="cb"/><feMerge><feMergeNode in="cb"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                  <filter id="shd"><feDropShadow dx="0.5" dy="1" stdDeviation="1.5" floodOpacity="0.25"/></filter>
                </defs>

                {/* Intro scanning overlay */}
                {animationStep === 'intro' && (
                  <g>
                    <rect x="0" y="0" width="800" height="600" fill="black" opacity="0.15" />
                    <text x="400" y="300" textAnchor="middle" fill="white" fontSize="14" fontFamily="system-ui" opacity="0.9">Scanning zone...</text>
                  </g>
                )}

                {/* Metro Lines - sequential draw */}
                {interventionType === 'metro' && (animationStep === 'building' || animationStep === 'complete' || animationStep === 'analysis') && (
                  <>
                    {metroRoutes.map((route, ri) => {
                      const routeStart = ri * (100 / totalRoutes);
                      const routeEnd = (ri + 1) * (100 / totalRoutes);
                      const routeProgress = Math.max(0, Math.min(1, (progress - routeStart) / (routeEnd - routeStart)));
                      const isComplete = progress >= routeEnd || animationStep === 'complete' || animationStep === 'analysis';
                      const drawPct = isComplete ? 1 : routeProgress;

                      return (
                        <g key={ri} opacity={drawPct > 0 ? 1 : 0}>
                          <path d={route.path} stroke="rgba(0,0,0,0.15)" strokeWidth="11" fill="none"
                            strokeLinecap="round" strokeLinejoin="round"
                            strokeDasharray="2000" strokeDashoffset={2000 * (1 - drawPct)} />
                          <path d={route.path} stroke={route.color} strokeWidth="7" fill="none" opacity="0.92"
                            strokeLinecap="round" strokeLinejoin="round"
                            strokeDasharray="2000" strokeDashoffset={2000 * (1 - drawPct)} filter="url(#glow)" />
                          <path d={route.path} stroke="white" strokeWidth="1.5" fill="none" opacity="0.3"
                            strokeLinecap="round" strokeLinejoin="round"
                            strokeDasharray="2000" strokeDashoffset={2000 * (1 - drawPct)} />
                          {route.stations.map((st, si) => {
                            const stationThreshold = (si + 1) / (route.stations.length + 1);
                            const show = drawPct >= stationThreshold;
                            return show ? (
                              <g key={si} filter="url(#shd)">
                                <circle cx={st.x} cy={st.y} r="10" fill="white" stroke={route.color} strokeWidth="2.5" />
                                <circle cx={st.x} cy={st.y} r="4" fill={route.color} />
                                <rect x={st.x + 14} y={st.y - 10} width={st.name.length * 6.2 + 10} height="20" rx="4" fill="white" opacity="0.93" stroke={route.color} strokeWidth="0.6" />
                                <text x={st.x + 19} y={st.y + 4} fontSize="9" fill="#1f2937" fontFamily="system-ui">{st.name}</text>
                              </g>
                            ) : null;
                          })}
                          {drawPct > 0.1 && (
                            <g filter="url(#shd)">
                              <rect x={700} y={16 + ri * 28} width="80" height="22" rx="4" fill={route.color} />
                              <text x={740} y={31 + ri * 28} fontSize="10" fill="white" textAnchor="middle" fontFamily="system-ui">{route.label}</text>
                            </g>
                          )}
                        </g>
                      );
                    })}
                    {(animationStep === 'complete' || animationStep === 'analysis') && (
                      <g filter="url(#shd)">
                        <circle cx={400} cy={300} r="14" fill="white" stroke="#6366f1" strokeWidth="3" />
                        <text x={400} y={304} fontSize="9" fill="#6366f1" textAnchor="middle" fontFamily="system-ui">⇄</text>
                      </g>
                    )}
                    {/* Smart traffic lights - last phase for metro */}
                    {(() => {
                      const tlStart = 4 * (100 / totalRoutes);
                      const tlPct = Math.max(0, Math.min(1, progress >= 100 || animationStep === 'complete' || animationStep === 'analysis' ? 1 : (progress - tlStart) / (100 - tlStart)));
                      return smartLights.map((tl, i) => {
                        const show = tlPct >= (i + 1) / (smartLights.length + 1);
                        return show ? (
                          <g key={`tl-${i}`} filter="url(#shd)">
                            <rect x={tl.x - 8} y={tl.y - 14} width="16" height="28" rx="3" fill="#1f2937" />
                            <circle cx={tl.x} cy={tl.y - 7} r="4" fill="#ef4444" opacity="0.3" />
                            <circle cx={tl.x} cy={tl.y + 7} r="4" fill="#22c55e" opacity="0.95">
                              <animate attributeName="opacity" values="0.95;0.5;0.95" dur="2s" repeatCount="indefinite" />
                            </circle>
                            <rect x={tl.x - 18} y={tl.y + 16} width="36" height="12" rx="2" fill="white" opacity="0.9" />
                            <text x={tl.x} y={tl.y + 24} fontSize="7" fill="#1f2937" textAnchor="middle" fontFamily="system-ui">SMART</text>
                          </g>
                        ) : null;
                      });
                    })()}
                  </>
                )}

                {/* Bicycle: 1 realistic grid-following path + smart traffic lights */}
                {interventionType === 'bicycle' && (animationStep === 'building' || animationStep === 'complete' || animationStep === 'analysis') && (
                  <>
                    {/* Phase 1: Bike path */}
                    {(() => {
                      const routeEnd = 100 / totalRoutes;
                      const drawPct = Math.max(0, Math.min(1, progress >= routeEnd || animationStep === 'complete' || animationStep === 'analysis' ? 1 : progress / routeEnd));
                      return drawPct > 0 ? (
                        <g>
                          {/* Road-width background to show the lane is ON a road */}
                          <path d={bicyclePath.path} stroke="rgba(0,0,0,0.08)" strokeWidth="14" fill="none"
                            strokeLinecap="round" strokeLinejoin="round"
                            strokeDasharray="3000" strokeDashoffset={3000 * (1 - drawPct)} />
                          {/* Green dashed bike lane */}
                          <path d={bicyclePath.path} stroke={bicyclePath.color} strokeWidth="5" fill="none" opacity="0.9"
                            strokeLinecap="round" strokeLinejoin="round" strokeDasharray="14,7"
                            strokeDashoffset={3000 * (1 - drawPct)} filter="url(#glow)" />
                          {/* White center */}
                          <path d={bicyclePath.path} stroke="white" strokeWidth="1.5" fill="none" opacity="0.4"
                            strokeLinecap="round" strokeLinejoin="round"
                            strokeDasharray="3000" strokeDashoffset={3000 * (1 - drawPct)} />
                          {/* Bike share stations */}
                          {bicyclePath.stations.map((st, si) => {
                            const show = drawPct >= (si + 1) / (bicyclePath.stations.length + 1);
                            return show ? (
                              <g key={si} filter="url(#shd)">
                                <circle cx={st.x} cy={st.y} r="11" fill="white" stroke={bicyclePath.color} strokeWidth="2.5" />
                                <text x={st.x} y={st.y + 4} fontSize="11" textAnchor="middle">🚲</text>
                              </g>
                            ) : null;
                          })}
                          {drawPct > 0.1 && (
                            <g filter="url(#shd)">
                              <rect x={695} y={16} width="88" height="22" rx="4" fill={bicyclePath.color} />
                              <text x={739} y={31} fontSize="10" fill="white" textAnchor="middle" fontFamily="system-ui">Bike Lane</text>
                            </g>
                          )}
                        </g>
                      ) : null;
                    })()}

                    {/* Phase 2: Smart traffic lights */}
                    {(() => {
                      const tlStart = 100 / totalRoutes;
                      const tlPct = Math.max(0, Math.min(1, progress >= 100 || animationStep === 'complete' || animationStep === 'analysis' ? 1 : (progress - tlStart) / (100 - tlStart)));
                      return smartLights.map((tl, i) => {
                        const show = tlPct >= (i + 1) / (smartLights.length + 1);
                        return show ? (
                          <g key={`tl-${i}`} filter="url(#shd)">
                            <rect x={tl.x - 8} y={tl.y - 14} width="16" height="28" rx="3" fill="#1f2937" />
                            <circle cx={tl.x} cy={tl.y - 7} r="4" fill="#ef4444" opacity="0.3" />
                            <circle cx={tl.x} cy={tl.y + 7} r="4" fill="#22c55e" opacity="0.95">
                              <animate attributeName="opacity" values="0.95;0.5;0.95" dur="2s" repeatCount="indefinite" />
                            </circle>
                            <rect x={tl.x - 18} y={tl.y + 16} width="36" height="12" rx="2" fill="white" opacity="0.9" />
                            <text x={tl.x} y={tl.y + 24} fontSize="7" fill="#1f2937" textAnchor="middle" fontFamily="system-ui">SMART</text>
                          </g>
                        ) : null;
                      });
                    })()}

                    {/* Legend */}
                    {(animationStep === 'complete' || animationStep === 'analysis') && (
                      <g filter="url(#shd)">
                        <rect x="16" y="510" width="165" height="70" rx="8" fill="white" opacity="0.95" stroke="#059669" strokeWidth="0.8" />
                        <text x="26" y="528" fontSize="10" fill="#065f46" fontFamily="system-ui">Zone Improvements</text>
                        <line x1="26" y1="541" x2="52" y2="541" stroke="#059669" strokeWidth="3" strokeDasharray="6,4" />
                        <text x="58" y="544" fontSize="9" fill="#6b7280" fontFamily="system-ui">Protected bike lane</text>
                        <rect x="26" y="551" width="10" height="16" rx="2" fill="#1f2937" />
                        <circle cx="31" cy="563" r="3" fill="#22c55e" />
                        <text x="42" y="562" fontSize="9" fill="#6b7280" fontFamily="system-ui">Smart traffic light</text>
                        <text x="26" y="576" fontSize="9" fill="#6b7280" fontFamily="system-ui">🚲 Bike share station</text>
                      </g>
                    )}
                  </>
                )}

                {/* Bus Routes - sequential draw */}
                {interventionType === 'bus' && (animationStep === 'building' || animationStep === 'complete' || animationStep === 'analysis') && (
                  <>
                    {busRoutes.map((br, i) => {
                      const routeStart = i * (100 / totalRoutes);
                      const routeEnd = (i + 1) * (100 / totalRoutes);
                      const routeProgress = Math.max(0, Math.min(1, (progress - routeStart) / (routeEnd - routeStart)));
                      const isComplete = progress >= routeEnd || animationStep === 'complete' || animationStep === 'analysis';
                      const drawPct = isComplete ? 1 : routeProgress;

                      return (
                        <g key={i} opacity={drawPct > 0 ? 1 : 0}>
                          <path d={br.path} stroke="rgba(0,0,0,0.1)" strokeWidth="8" fill="none"
                            strokeLinecap="round" strokeLinejoin="round"
                            strokeDasharray="2000" strokeDashoffset={2000 * (1 - drawPct)} />
                          <path d={br.path} stroke={br.color} strokeWidth="5" fill="none" opacity="0.88"
                            strokeLinecap="round" strokeLinejoin="round" strokeDasharray="20,8"
                            strokeDashoffset={2000 * (1 - drawPct)} />
                          {br.stops.map((st, si) => {
                            const show = drawPct >= (si + 1) / (br.stops.length + 1);
                            return show ? (
                              <g key={si} filter="url(#shd)">
                                <rect x={st.x - 8} y={st.y - 8} width="16" height="16" rx="3" fill={br.color} stroke="white" strokeWidth="2" />
                                <circle cx={st.x} cy={st.y} r="2.5" fill="white" />
                              </g>
                            ) : null;
                          })}
                          {drawPct > 0.1 && (
                            <g filter="url(#shd)">
                              <rect x={700} y={16 + i * 28} width="80" height="22" rx="4" fill={br.color} opacity="0.92" />
                              <text x={740} y={31 + i * 28} fontSize="10" fill="white" textAnchor="middle" fontFamily="system-ui">{br.label}</text>
                            </g>
                          )}
                        </g>
                      );
                    })}
                    {/* Smart traffic lights - last phase for bus */}
                    {(() => {
                      const tlStart = 3 * (100 / totalRoutes);
                      const tlPct = Math.max(0, Math.min(1, progress >= 100 || animationStep === 'complete' || animationStep === 'analysis' ? 1 : (progress - tlStart) / (100 - tlStart)));
                      return smartLights.map((tl, i) => {
                        const show = tlPct >= (i + 1) / (smartLights.length + 1);
                        return show ? (
                          <g key={`tl-${i}`} filter="url(#shd)">
                            <rect x={tl.x - 8} y={tl.y - 14} width="16" height="28" rx="3" fill="#1f2937" />
                            <circle cx={tl.x} cy={tl.y - 7} r="4" fill="#ef4444" opacity="0.3" />
                            <circle cx={tl.x} cy={tl.y + 7} r="4" fill="#22c55e" opacity="0.95">
                              <animate attributeName="opacity" values="0.95;0.5;0.95" dur="2s" repeatCount="indefinite" />
                            </circle>
                            <rect x={tl.x - 18} y={tl.y + 16} width="36" height="12" rx="2" fill="white" opacity="0.9" />
                            <text x={tl.x} y={tl.y + 24} fontSize="7" fill="#1f2937" textAnchor="middle" fontFamily="system-ui">SMART</text>
                          </g>
                        ) : null;
                      });
                    })()}
                  </>
                )}
              </svg>

              {/* Cost Optimization */}
              {animationStep === 'optimizing' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                  <div className="bg-white rounded-xl p-5 sm:p-8 shadow-2xl max-w-md w-full mx-4">
                    <h3 className="text-lg sm:text-xl mb-4 text-center">Cost-Benefit Optimization</h3>

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Estimated Cost:</span>
                        <span className="font-semibold">SEK {(estimatedCost / 1000000).toFixed(2)}M</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Cost per Impact Point:</span>
                        <span className="font-semibold">SEK {(costPerImpactPoint / 1000).toFixed(0)}K</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Expected ROI:</span>
                        <span className="font-semibold text-emerald-600">{roi.toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">Analyzing alternatives...</span>
                        <span className="text-sm font-bold text-indigo-600">{optimizationProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-100 rounded-full"
                          style={{ width: `${optimizationProgress}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-xs text-center text-gray-500">
                      Comparing with {interventionType === 'metro' ? '3' : interventionType === 'tram' ? '2' : '4'} alternative solutions...
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Indicator - slim bottom bar */}
              {animationStep === 'building' && (
                <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm px-5 py-3 border-t border-indigo-100">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full transition-all duration-75 rounded-full"
                          style={{ width: `${Math.round(progress)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm text-indigo-700 tabular-nums w-10 text-right">{Math.round(progress)}%</span>
                  </div>
                  <div className="mt-1.5 text-xs text-gray-500 text-center">
                    {interventionType === 'metro'
                      ? activeRouteIndex < 4
                        ? `Building ${metroRoutes[Math.min(activeRouteIndex, 3)]?.label}...`
                        : 'Installing smart traffic signals...'
                      : interventionType === 'bicycle'
                      ? activeRouteIndex === 0
                        ? 'Constructing protected bike lane...'
                        : 'Installing smart traffic signals...'
                      : activeRouteIndex < 3
                      ? `Deploying ${busRoutes[Math.min(activeRouteIndex, 2)]?.label}...`
                      : 'Installing smart traffic signals...'}
                  </div>
                </div>
              )}

              {/* Completion Message - subtle */}
              {animationStep === 'complete' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/15 backdrop-blur-[2px]">
                  <div className="bg-white rounded-xl px-6 py-5 sm:px-8 sm:py-6 shadow-xl text-center">
                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <h3 className="text-lg mb-1">Construction Complete</h3>
                    <p className="text-sm text-gray-500">Analyzing impact on traffic flow...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Impact Analysis - Zone Specific */}
          {animationStep === 'analysis' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 sm:p-6 border border-indigo-200">
                <h3 className="text-lg sm:text-xl mb-4 text-gray-900">Zone-Specific Impact Analysis: {zone.name}</h3>
                <p className="text-gray-700 mb-4">{zone.details}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-600 mb-1">Traffic Flow</div>
                    <div className="text-2xl text-emerald-600">+{zone.impact.trafficFlow.toFixed(1)}%</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {interventionType === 'metro' ? 'High capacity impact' :
                       interventionType === 'bicycle' ? 'Eco-friendly impact' : 'Distributed impact'}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-600 mb-1">Happiness</div>
                    <div className="text-2xl text-emerald-600">+{zone.impact.citizenHappiness.toFixed(1)}%</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {zone.impact.citizenHappiness > 10 ? 'Excellent' : zone.impact.citizenHappiness > 6 ? 'Good' : 'Moderate'}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-600 mb-1">Avg Speed</div>
                    <div className="text-2xl text-emerald-600">+{zone.impact.avgSpeedIncrease.toFixed(1)} km/h</div>
                    <div className="text-xs text-gray-500 mt-1">
                      From ~{18} to ~{(18 + zone.impact.avgSpeedIncrease).toFixed(0)} km/h
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-600 mb-1">Time Saved</div>
                    <div className="text-2xl text-emerald-600">-{zone.impact.delayReduction.toFixed(0)} min</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Per peak hour trip
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-semibold mb-2">Cost-Benefit Summary</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Cost:</span>
                      <div className="font-semibold">SEK {(estimatedCost / 1000000).toFixed(2)}M</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Cost Efficiency:</span>
                      <div className="font-semibold">SEK {(costPerImpactPoint / 1000).toFixed(0)}K/point</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Expected ROI:</span>
                      <div className="font-semibold text-emerald-600">{roi.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
                <h3 className="text-lg sm:text-xl mb-4 text-gray-900">Zone-Specific Outcomes for {zone.name}</h3>
                <div className="space-y-3">
                  {interventionType === 'metro' && (
                    <>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-gray-900">Mass Transit Capacity</div>
                          <div className="text-sm text-gray-600">
                            New metro line adds 50,000+ daily passenger capacity, significantly reducing road congestion at {zone.name}.
                            Peak hour traffic flow improves by {zone.impact.trafficFlow.toFixed(1)}%.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-gray-900">Commuter Time Savings</div>
                          <div className="text-sm text-gray-600">
                            Average commute time reduced by {zone.impact.delayReduction.toFixed(0)} minutes per trip.
                            Annual time savings: ~{(zone.impact.delayReduction * 500).toFixed(0)} hours per commuter.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-gray-900">Sustainable Development</div>
                          <div className="text-sm text-gray-600">
                            Metro reduces ~2,500 cars/day from roads. Annual CO₂ reduction: ~1,200 tons.
                            Property values expected to increase 15-20% within 500m of stations.
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {interventionType === 'bicycle' && (
                    <>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-gray-900">Sustainable Mobility</div>
                          <div className="text-sm text-gray-600">
                            Protected bicycle paths reduce short-distance car trips by 15-20% at {zone.name}.
                            Traffic flow improves by {zone.impact.trafficFlow.toFixed(1)}% as cyclists shift from roads.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-gray-900">Health & Air Quality</div>
                          <div className="text-sm text-gray-600">
                            Cycling infrastructure promotes active transport and reduces emissions.
                            Average speed increases by {zone.impact.avgSpeedIncrease.toFixed(1)} km/h for remaining traffic.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-gray-900">Cost-Effective & Quick</div>
                          <div className="text-sm text-gray-600">
                            Bicycle paths are 10x cheaper than metro and can be built in 2-3 months.
                            Citizen satisfaction increases {zone.impact.citizenHappiness.toFixed(1)}% with safer cycling options.
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {interventionType === 'bus' && (
                    <>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-gray-900">Flexible Route Coverage</div>
                          <div className="text-sm text-gray-600">
                            New bus routes provide immediate relief to {zone.name} congestion.
                            {Math.floor(zone.impact.trafficFlow / 0.4)} additional buses with 5-7 minute frequency improve flow by {zone.impact.trafficFlow.toFixed(1)}%.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-gray-900">Last-Mile Connectivity</div>
                          <div className="text-sm text-gray-600">
                            Circular and express routes reduce peak hour delays by {zone.impact.delayReduction.toFixed(0)} minutes.
                            Serves areas not accessible by metro/tram with flexible scheduling.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-gray-900">Cost-Effective Solution</div>
                          <div className="text-sm text-gray-600">
                            Most affordable option with fastest deployment (3-6 months).
                            Citizen satisfaction increases {zone.impact.citizenHappiness.toFixed(1)}% due to improved accessibility.
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Implementation Plan with Political Gates */}
              <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
                <h3 className="text-lg sm:text-xl mb-4 text-gray-900 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-indigo-600" />
                  Step-by-Step Implementation Plan
                </h3>

                <div className="space-y-6">
                  {/* Phase 1: Planning & Design */}
                  <div className="border-l-4 border-indigo-500 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-indigo-600" />
                      <h4 className="font-semibold text-gray-900">Phase 1: Planning & Design (Months 1-3)</h4>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600 ml-7">
                      <div>• Week 1-2: Site surveys, traffic analysis, community consultation</div>
                      <div>• Week 3-5: Technical design, route optimization, cost estimation</div>
                      <div>• Week 6-8: Environmental impact assessment, feasibility study</div>
                      <div>• Week 9-12: Final design approval, blueprint preparation</div>
                    </div>
                  </div>

                  {/* Political Gate 1 */}
                  <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-amber-600" />
                      <h4 className="font-semibold text-amber-900">Political Gate 1: Municipal Planning Approval</h4>
                    </div>
                    <div className="text-sm text-amber-800 ml-7 space-y-1">
                      <div>• City Planning Office zoning approval</div>
                      <div>• District committee and council approval</div>
                      <div>• Public consultation and feedback</div>
                      <div>• Traffic authority approval for route changes</div>
                      <div className="pt-2 font-semibold">Timeline: 4-6 weeks | Risk Level: Medium</div>
                    </div>
                  </div>

                  {/* Phase 2: Regulatory Approvals */}
                  <div className="border-l-4 border-blue-500 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-900">Phase 2: Regulatory Approvals (Months 4-7)</h4>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600 ml-7">
                      <div>• Week 13-16: Environmental clearance from County Administrative Board</div>
                      <div>• Week 17-20: Utility coordination and land access agreements</div>
                      <div>• Week 21-24: Safety certification and technical audit</div>
                      <div>• Week 25-28: Financial approval and budget allocation</div>
                    </div>
                  </div>

                  {/* Political Gate 2 */}
                  <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-red-600" />
                      <h4 className="font-semibold text-red-900">Political Gate 2: City Council Approval</h4>
                    </div>
                    <div className="text-sm text-red-800 ml-7 space-y-1">
                      <div>• City Council approval for budget allocation</div>
                      <div>• Regional authority consent (Vastra Gotaland)</div>
                      <div>• National transport coordination (Trafikverket)</div>
                      <div>• City finance department authorization</div>
                      <div className="pt-2 font-semibold">Timeline: 6-10 weeks | Risk Level: High</div>
                    </div>
                  </div>

                  {/* Phase 3: Tendering & Procurement */}
                  <div className="border-l-4 border-purple-500 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      <h4 className="font-semibold text-gray-900">Phase 3: Tendering & Procurement (Months 8-10)</h4>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600 ml-7">
                      <div>• Week 29-32: Tender preparation and publication</div>
                      <div>• Week 33-36: Bid evaluation and contractor selection</div>
                      <div>• Week 37-40: Contract negotiation and signing</div>
                      <div>• Week 41-44: Pre-construction mobilization</div>
                    </div>
                  </div>

                  {/* Political Gate 3 */}
                  <div className="bg-orange-50 border border-orange-300 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-orange-600" />
                      <h4 className="font-semibold text-orange-900">Political Gate 3: Procurement Audit</h4>
                    </div>
                    <div className="text-sm text-orange-800 ml-7 space-y-1">
                      <div>• Procurement audit and compliance review</div>
                      <div>• Background checks on contractors</div>
                      <div>• Anti-corruption compliance certification</div>
                      <div>• Conflict of interest declarations</div>
                      <div className="pt-2 font-semibold">Timeline: 3-5 weeks | Risk Level: Medium</div>
                    </div>
                  </div>

                  {/* Phase 4: Construction */}
                  <div className="border-l-4 border-emerald-500 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <HardHat className="w-5 h-5 text-emerald-600" />
                      <h4 className="font-semibold text-gray-900">
                        Phase 4: Construction (Months 11-{interventionType === 'metro' ? '24' : interventionType === 'bicycle' ? '14' : '16'})
                      </h4>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600 ml-7">
                      {interventionType === 'metro' && (
                        <>
                          <div>• Months 11-15: Site preparation, tunneling/elevated structure</div>
                          <div>• Months 16-20: Track laying, station construction</div>
                          <div>• Months 21-23: Systems installation (signaling, electrification)</div>
                          <div>• Month 24: Final integration and finishing work</div>
                        </>
                      )}
                      {interventionType === 'bicycle' && (
                        <>
                          <div>• Months 11-12: Site preparation, road marking removal</div>
                          <div>• Month 13: Path construction, surface laying</div>
                          <div>• Month 14: Station installation, signage, safety barriers</div>
                        </>
                      )}
                      {interventionType === 'bus' && (
                        <>
                          <div>• Months 11-13: Bus procurement and customization</div>
                          <div>• Months 14-15: Bus stop construction and route setup</div>
                          <div>• Month 16: Driver training, scheduling system setup</div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Phase 5: Testing & Commissioning */}
                  <div className="border-l-4 border-cyan-500 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TestTube className="w-5 h-5 text-cyan-600" />
                      <h4 className="font-semibold text-gray-900">
                        Phase 5: Testing & Commissioning (Month {interventionType === 'metro' ? '25-26' : interventionType === 'bicycle' ? '15' : '17'})
                      </h4>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600 ml-7">
                      <div>• Safety testing and quality assurance</div>
                      <div>• Trial runs and load testing</div>
                      <div>• Staff training and operational readiness</div>
                      <div>• Final inspection and certification</div>
                    </div>
                  </div>

                  {/* Political Gate 4 */}
                  <div className="bg-green-50 border border-green-300 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      <h4 className="font-semibold text-green-900">Political Gate 4: Operational Clearance</h4>
                    </div>
                    <div className="text-sm text-green-800 ml-7 space-y-1">
                      <div>• Transport authority safety approval {interventionType === 'metro' ? '(rail if applicable)' : ''}</div>
                      <div>• Traffic authority operational approval</div>
                      <div>• Fire Department safety clearance</div>
                      <div>• City transport operating license</div>
                      <div className="pt-2 font-semibold">Timeline: 2-4 weeks | Risk Level: Low</div>
                    </div>
                  </div>

                  {/* Phase 6: Public Launch */}
                  <div className="border-l-4 border-pink-500 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Rocket className="w-5 h-5 text-pink-600" />
                      <h4 className="font-semibold text-gray-900">
                        Phase 6: Public Launch (Month {interventionType === 'metro' ? '27' : interventionType === 'bicycle' ? '16' : '18'})
                      </h4>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600 ml-7">
                      <div>• Soft launch with limited operations</div>
                      <div>• Public awareness campaign and inauguration</div>
                      <div>• Monitoring and performance tracking</div>
                      <div>• Feedback collection and iterative improvements</div>
                    </div>
                  </div>

                  {/* Summary Timeline */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Implementation Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Total Duration:</span>
                        <div className="font-semibold text-indigo-700">
                          {interventionType === 'metro' ? '24-27 months' : interventionType === 'bicycle' ? '14-16 months' : '16-18 months'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Political Gates:</span>
                        <div className="font-semibold text-indigo-700">4 major approvals</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Critical Path:</span>
                        <div className="font-semibold text-indigo-700">
                          {interventionType === 'metro' ? 'City Council approval + Construction' :
                           interventionType === 'bicycle' ? 'Municipal approval + Quick build' :
                           'Procurement + Deployment'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Success Rate:</span>
                        <div className="font-semibold text-emerald-600">
                          {interventionType === 'metro' ? '75%' : interventionType === 'bicycle' ? '90%' : '85%'}
                          {' '} (based on similar projects)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}