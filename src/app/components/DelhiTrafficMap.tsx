interface TrafficHotspot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  intensity: number;
  avgSpeed: number;
  peakHourDelay: number;
}

interface OptimizationZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  intervention: string;
  details: string;
  impact: {
    trafficFlow: number;
    citizenHappiness: number;
    avgSpeedIncrease: number;
    delayReduction: number;
  };
}

interface Props {
  hotspots: TrafficHotspot[];
  optimizationZones?: OptimizationZone[];
  showHeatmap?: boolean;
}

export default function DelhiTrafficMap({ hotspots, optimizationZones = [], showHeatmap = true }: Props) {
  const mapWidth = 800;
  const mapHeight = 600;

  // Center of Gothenburg
  const centerLat = 57.7089;
  const centerLng = 11.9746;
  const zoom = 12;

  // Gothenburg boundaries (approximate)
  const latRange = [57.62, 57.76];
  const lngRange = [11.85, 12.02];

  // Convert lat/lng to pixel coordinates
  const latToY = (lat: number) => {
    return ((latRange[1] - lat) / (latRange[1] - latRange[0])) * mapHeight;
  };

  const lngToX = (lng: number) => {
    return ((lng - lngRange[0]) / (lngRange[1] - lngRange[0])) * mapWidth;
  };

  // Generate OpenStreetMap static map URL
  const getMapImageUrl = () => {
    // Using StaticMap API-like approach with tile markers
    const baseUrl = 'https://tile.openstreetmap.org';
    // For zoom 11, we need specific tiles
    // Calculate tile numbers for Gothenburg area
    const x = Math.floor((centerLng + 180) / 360 * Math.pow(2, zoom));
    const y = Math.floor((1 - Math.log(Math.tan(centerLat * Math.PI / 180) + 1 / Math.cos(centerLat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));

    return { x, y, zoom, baseUrl };
  };

  const mapTile = getMapImageUrl();

  const getColorForIntensity = (intensity: number) => {
    if (intensity >= 90) return '#dc2626';
    if (intensity >= 75) return '#f59e0b';
    if (intensity >= 60) return '#fbbf24';
    return '#10b981';
  };

  const getRadiusForIntensity = (intensity: number) => {
    return (intensity / 100) * 40 + 20;
  };

  return (
    <div className="h-full w-full rounded-xl overflow-hidden shadow-lg relative">
      {/* OpenStreetMap Background - 3x3 grid of tiles */}
      <div className="absolute inset-0" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(3, 1fr)' }}>
        {[-1, 0, 1].map(dy =>
          [-1, 0, 1].map(dx => (
            <img
              key={`${dx}-${dy}`}
              src={`${mapTile.baseUrl}/${mapTile.zoom}/${mapTile.x + dx}/${mapTile.y + dy}.png`}
              alt=""
              className="w-full h-full block"
              style={{ display: 'block', objectFit: 'fill' }}
              crossOrigin="anonymous"
              draggable={false}
            />
          ))
        )}
      </div>

      {/* SVG Overlay - Traffic Markers */}
      <svg
        viewBox="0 0 800 600"
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 10 }}
      >

        {/* Traffic Heatmap Circles */}
        {showHeatmap && hotspots.map((hotspot) => {
          const x = lngToX(hotspot.lng);
          const y = latToY(hotspot.lat);
          const radius = getRadiusForIntensity(hotspot.intensity);
          const color = getColorForIntensity(hotspot.intensity);

          return (
            <g key={hotspot.id} className="pointer-events-auto">
              <circle
                cx={x}
                cy={y}
                r={radius}
                fill={color}
                opacity={0.4}
                stroke={color}
                strokeWidth={3}
                className="transition-all hover:opacity-70 cursor-pointer"
              >
                <title>
                  {hotspot.name}
                  {'\n'}Congestion: {hotspot.intensity}%
                  {'\n'}Avg Speed: {hotspot.avgSpeed} km/h
                  {'\n'}Peak Delay: {hotspot.peakHourDelay} min
                </title>
              </circle>
              <circle
                cx={x}
                cy={y}
                r={8}
                fill={color}
                opacity={0.9}
                stroke="white"
                strokeWidth={2}
                className="cursor-pointer"
              >
                <title>
                  {hotspot.name}
                  {'\n'}Congestion: {hotspot.intensity}%
                  {'\n'}Avg Speed: {hotspot.avgSpeed} km/h
                  {'\n'}Peak Delay: {hotspot.peakHourDelay} min
                </title>
              </circle>
            </g>
          );
        })}

        {/* Optimization Zone Markers */}
        {optimizationZones.map((zone) => {
          const x = lngToX(zone.lng);
          const y = latToY(zone.lat);

          return (
            <g key={zone.id} className="pointer-events-auto">
              <circle
                cx={x}
                cy={y}
                r={30}
                fill="#6366f1"
                opacity={0.15}
                stroke="#6366f1"
                strokeWidth={3}
                strokeDasharray="5,5"
                className="transition-all hover:opacity-30"
              >
                <animate
                  attributeName="r"
                  values="30;35;30"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle
                cx={x}
                cy={y}
                r={15}
                fill="#6366f1"
                stroke="white"
                strokeWidth={3}
                className="cursor-pointer transition-all hover:r-18"
              >
                <title>
                  {zone.name}
                  {'\n'}{zone.intervention}
                  {'\n'}{zone.details}
                  {'\n'}Traffic Flow: +{zone.impact.trafficFlow.toFixed(1)}%
                  {'\n'}Happiness: +{zone.impact.citizenHappiness.toFixed(1)}%
                  {'\n'}Speed: +{zone.impact.avgSpeedIncrease.toFixed(1)} km/h
                  {'\n'}Delay: -{zone.impact.delayReduction.toFixed(0)} min
                </title>
              </circle>
              <text
                x={x}
                y={y + 5}
                textAnchor="middle"
                fill="white"
                fontSize="16"
                fontWeight="bold"
                className="pointer-events-none"
              >
                ✓
              </text>
            </g>
          );
        })}
      </svg>

      {/* Interactive Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 sm:p-3 shadow-lg text-[10px] sm:text-xs z-20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600"></div>
            <span>Critical (&gt;90%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span>High (75-90%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <span>Medium (60-75%)</span>
          </div>
          {optimizationZones.length > 0 && (
            <div className="flex items-center gap-2 pt-1 border-t border-gray-300">
              <div className="w-3 h-3 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[8px]">✓</div>
              <span>Intervention Zone</span>
            </div>
          )}
        </div>
      </div>

      {/* Hover instruction */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-2 sm:px-3 py-1 shadow text-[10px] sm:text-xs text-gray-600">
        Tap or hover for details
      </div>
    </div>
  );
}

export type { TrafficHotspot, OptimizationZone };