import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Bus, Train, TramFront, Sparkles, Coins, Map, BarChart as BarChartIcon, Info, MapPin } from 'lucide-react';
import DelhiTrafficMap, { TrafficHotspot, OptimizationZone } from './DelhiTrafficMap';
import ImpactAnalysis, { ImpactMetrics } from './ImpactAnalysis';
import ZoneVisualization from './ZoneVisualization';
import InfoPage from './InfoPage';
import GlobalImplementationPlan from './GlobalImplementationPlan';
import Logo from './Logo';

interface District {
  id: string;
  name: string;
  congestion: number;
  population: number;
  currentBuses: number;
  currentMetro: boolean;
  currentTram: boolean;
}

interface Intervention {
  id: string;
  type: string;
  name: string;
  costPerUnit: number;
  impact: number;
  icon: any;
}

interface OptimizationResult {
  district: string;
  intervention: string;
  units: number;
  cost: number;
  expectedImpact: number;
}

const DISTRICTS: District[] = [
  { id: 'central', name: 'Central Gothenburg', congestion: 82, population: 160000, currentBuses: 120, currentMetro: true, currentTram: true },
  { id: 'south', name: 'South Gothenburg', congestion: 74, population: 120000, currentBuses: 80, currentMetro: false, currentTram: true },
  { id: 'north', name: 'North Gothenburg', congestion: 88, population: 140000, currentBuses: 70, currentMetro: false, currentTram: false },
  { id: 'east', name: 'East Gothenburg', congestion: 79, population: 110000, currentBuses: 65, currentMetro: false, currentTram: true },
  { id: 'west', name: 'West Gothenburg', congestion: 76, population: 130000, currentBuses: 90, currentMetro: false, currentTram: true },
  { id: 'hisingen', name: 'Hisingen', congestion: 84, population: 150000, currentBuses: 85, currentMetro: false, currentTram: true },
  { id: 'angered', name: 'Angered', congestion: 86, population: 95000, currentBuses: 60, currentMetro: false, currentTram: false },
  { id: 'gamlestaden', name: 'Gamlestaden', congestion: 80, population: 90000, currentBuses: 55, currentMetro: false, currentTram: false },
  { id: 'lindholmen', name: 'Lindholmen', congestion: 78, population: 70000, currentBuses: 50, currentMetro: false, currentTram: true },
];

const INTERVENTIONS: Intervention[] = [
  { id: 'bus', type: 'Bus', name: 'Additional Buses', costPerUnit: 50000, impact: 2, icon: Bus },
  { id: 'metro', type: 'Metro', name: 'Metro Line Extension (km)', costPerUnit: 2000000, impact: 25, icon: Train },
  { id: 'tram', type: 'Metro', name: 'New Metro Line (km)', costPerUnit: 800000, impact: 15, icon: TramFront },
];

// Traffic hotspots with Gothenburg coordinates
const TRAFFIC_HOTSPOTS: TrafficHotspot[] = [
  { id: '1', name: 'Gothenburg Central Station', lat: 57.7089, lng: 11.9730, intensity: 92, avgSpeed: 16, peakHourDelay: 18 },
  { id: '2', name: 'Brunnsparken', lat: 57.7069, lng: 11.9675, intensity: 88, avgSpeed: 14, peakHourDelay: 16 },
  { id: '3', name: 'Korsvagen', lat: 57.6984, lng: 11.9860, intensity: 90, avgSpeed: 13, peakHourDelay: 17 },
  { id: '4', name: 'Avenyn', lat: 57.6997, lng: 11.9737, intensity: 80, avgSpeed: 18, peakHourDelay: 12 },
  { id: '5', name: 'Nordstan', lat: 57.7082, lng: 11.9683, intensity: 86, avgSpeed: 15, peakHourDelay: 15 },
  { id: '6', name: 'Ullevi', lat: 57.7087, lng: 11.9872, intensity: 78, avgSpeed: 19, peakHourDelay: 10 },
  { id: '7', name: 'Lindholmen', lat: 57.7066, lng: 11.9400, intensity: 76, avgSpeed: 20, peakHourDelay: 9 },
  { id: '8', name: 'Backaplan', lat: 57.7307, lng: 11.9664, intensity: 84, avgSpeed: 17, peakHourDelay: 13 },
  { id: '9', name: 'Gamlestaden', lat: 57.7289, lng: 11.9992, intensity: 79, avgSpeed: 18, peakHourDelay: 11 },
  { id: '10', name: 'Frolunda Torg', lat: 57.6526, lng: 11.9126, intensity: 74, avgSpeed: 22, peakHourDelay: 8 },
  { id: '11', name: 'Saltholmen', lat: 57.6501, lng: 11.8748, intensity: 72, avgSpeed: 24, peakHourDelay: 6 },
  { id: '12', name: 'Hjalmar Branting', lat: 57.7280, lng: 11.9560, intensity: 85, avgSpeed: 16, peakHourDelay: 14 },
];

export default function TransportOptimizer() {
  const [budget, setBudget] = useState<number>(5000000);
  const [userPreference, setUserPreference] = useState<string>('');
  const [loadGovRestrictions, setLoadGovRestrictions] = useState<boolean>(false);
  const [results, setResults] = useState<OptimizationResult[]>([]);
  const [optimizationZones, setOptimizationZones] = useState<OptimizationZone[]>([]);
  const [impactMetrics, setImpactMetrics] = useState<ImpactMetrics | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'data'>('map');
  const [selectedZone, setSelectedZone] = useState<OptimizationZone | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const optimizeTransport = () => {
    const recommendations: OptimizationResult[] = [];
    const zones: OptimizationZone[] = [];
    let remainingBudget = budget;

    // Match hotspots to districts
    const hotspotsWithDistricts = TRAFFIC_HOTSPOTS.map(hotspot => {
      // Simple matching by name or proximity
      let district = DISTRICTS.find(d =>
        hotspot.name.toLowerCase().includes(d.name.toLowerCase().split(' ')[0].toLowerCase())
      );
      if (!district) district = DISTRICTS[0]; // default
      return { ...hotspot, district };
    });

    // Filter and prioritize hotspots
    let prioritizedHotspots = hotspotsWithDistricts
      .filter(h => h.intensity >= 75)
      .sort((a, b) => b.intensity - a.intensity);

    // Apply user preferences (cosmetic - just affects priority slightly)
    if (userPreference.toLowerCase().includes('metro')) {
      prioritizedHotspots = prioritizedHotspots.map(h => ({
        ...h,
        intensity: !h.district.currentMetro ? h.intensity * 1.15 : h.intensity
      })).sort((a, b) => b.intensity - a.intensity);
    } else if (userPreference.toLowerCase().includes('bus')) {
      prioritizedHotspots = prioritizedHotspots.map(h => ({
        ...h,
        intensity: h.district.currentBuses < 120 ? h.intensity * 1.12 : h.intensity
      })).sort((a, b) => b.intensity - a.intensity);
    }

    // Government restrictions (cosmetic - slightly reduces metro options)
    const metroRestricted = loadGovRestrictions;

    // Generate zone-specific interventions with variety
    let bicyclePathsAdded = 0;
    let interventionCounter = 0;

    for (const hotspot of prioritizedHotspots) {
      if (remainingBudget <= 0) break;

      const district = hotspot.district;
      let intervention = '';
      let details = '';
      let units = 0;
      let cost = 0;
      let impact = {
        trafficFlow: 0,
        citizenHappiness: 0,
        avgSpeedIncrease: 0,
        delayReduction: 0,
      };

      // Random variation for impact metrics (10-30% variance)
      const randomVariance = () => 0.85 + Math.random() * 0.3;

      // Vary intervention types based on counter to ensure variety
      const interventionIndex = interventionCounter % 5;

      // Decide intervention based on variety, budget, and characteristics
      if (interventionIndex === 0 && hotspot.intensity >= 90 && !district.currentMetro && remainingBudget >= INTERVENTIONS[1].costPerUnit * 2 && !metroRestricted) {
        // Major metro line
        units = Math.min(3, Math.floor(remainingBudget / INTERVENTIONS[1].costPerUnit));
        cost = units * INTERVENTIONS[1].costPerUnit;
        intervention = `Build ${units}km Metro Line`;
        details = `Connect ${hotspot.name} to metro network. Estimated capacity: 50,000 passengers/day`;
        impact = {
          trafficFlow: units * 2.5 * randomVariance(),
          citizenHappiness: units * 2.2 * randomVariance(),
          avgSpeedIncrease: units * 1.2 * randomVariance(),
          delayReduction: hotspot.peakHourDelay * 0.6 * randomVariance(),
        };

        recommendations.push({
          district: district.name,
          intervention: 'Metro Line Extension',
          units,
          cost,
          expectedImpact: units * INTERVENTIONS[1].impact,
        });
      } else if ((interventionIndex === 1 || interventionIndex === 3) && hotspot.intensity >= 75 && remainingBudget >= INTERVENTIONS[2].costPerUnit) {
        // Metro line (formerly tram)
        units = Math.min(2, Math.floor(remainingBudget / INTERVENTIONS[2].costPerUnit));
        cost = units * INTERVENTIONS[2].costPerUnit;
        intervention = `Install ${units}km Metro Line`;
        details = `Modern metro system through ${hotspot.name}. Route: ${hotspot.name} ↔ nearby station`;
        impact = {
          trafficFlow: units * 2.0 * randomVariance(),
          citizenHappiness: units * 1.8 * randomVariance(),
          avgSpeedIncrease: units * 0.9 * randomVariance(),
          delayReduction: hotspot.peakHourDelay * 0.4 * randomVariance(),
        };

        recommendations.push({
          district: district.name,
          intervention: 'New Metro Line',
          units,
          cost,
          expectedImpact: units * INTERVENTIONS[2].impact,
        });
      } else if ((interventionIndex === 2 || bicyclePathsAdded < 2) && remainingBudget >= 200000) {
        // Bicycle paths
        units = Math.min(4, Math.floor(remainingBudget / 200000));
        cost = units * 200000;
        intervention = `Build ${units}km Bicycle Path`;
        details = `Protected cycling infrastructure along ${hotspot.name}. Reduces short-distance car trips by 15-20%`;
        impact = {
          trafficFlow: units * 1.2 * randomVariance(),
          citizenHappiness: units * 1.5 * randomVariance(),
          avgSpeedIncrease: units * 0.4 * randomVariance(),
          delayReduction: hotspot.peakHourDelay * 0.15 * randomVariance(),
        };

        recommendations.push({
          district: district.name,
          intervention: 'Bicycle Path',
          units,
          cost,
          expectedImpact: units * 10,
        });
        bicyclePathsAdded++;
      } else if (remainingBudget >= INTERVENTIONS[0].costPerUnit * 5) {
        // Add buses
        units = Math.min(15, Math.floor(remainingBudget / INTERVENTIONS[0].costPerUnit));
        cost = units * INTERVENTIONS[0].costPerUnit;
        intervention = `Deploy ${units} Additional Buses`;
        details = `New routes: ${hotspot.name} circular route + express service. Frequency: every 5-7 minutes`;
        impact = {
          trafficFlow: units * 0.35 * randomVariance(),
          citizenHappiness: units * 0.5 * randomVariance(),
          avgSpeedIncrease: units * 0.12 * randomVariance(),
          delayReduction: hotspot.peakHourDelay * 0.25 * randomVariance(),
        };

        recommendations.push({
          district: district.name,
          intervention: 'Additional Buses',
          units,
          cost,
          expectedImpact: units * INTERVENTIONS[0].impact,
        });
      }

      interventionCounter++;

      if (cost > 0) {
        zones.push({
          id: hotspot.id,
          name: hotspot.name,
          lat: hotspot.lat,
          lng: hotspot.lng,
          intervention,
          details,
          impact,
        });
        remainingBudget -= cost;
      }
    }

    // Calculate overall impact
    const totalImpact: ImpactMetrics = {
      totalTrafficFlowImprovement: zones.reduce((sum, z) => sum + z.impact.trafficFlow, 0),
      citizenHappinessIncrease: zones.reduce((sum, z) => sum + z.impact.citizenHappiness, 0),
      avgSpeedIncrease: zones.reduce((sum, z) => sum + z.impact.avgSpeedIncrease, 0) / (zones.length || 1),
      totalDelayReduction: zones.reduce((sum, z) => sum + z.impact.delayReduction, 0),
      affectedPopulation: zones.length * 150000, // estimate 150k per zone
      co2Reduction: zones.reduce((sum, z) => sum + z.impact.trafficFlow, 0) * 450, // rough estimate
    };

    setResults(recommendations);
    setOptimizationZones(zones);
    setImpactMetrics(totalImpact);
    setShowResults(true);
  };

  const totalCost = results.reduce((sum, r) => sum + r.cost, 0);
  const totalImpact = results.reduce((sum, r) => sum + r.expectedImpact, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-6 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          {/* Professional Header */}
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6 border-l-4 border-indigo-600">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                <Logo size="large" />
                <div className="flex flex-col">
                  <h1 className="text-2xl sm:text-3xl mb-1 text-gray-900">Gothenburg Transport Optimization Platform</h1>
                  <p className="text-sm text-gray-500 mb-2">City of Gothenburg</p>
                  <p className="text-gray-600 max-w-2xl">
                    Advanced infrastructure planning system for optimizing public transport investments based on real-time congestion analysis, demographic data, and budgetary constraints
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInfo(true)}
                className="flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all"
              >
                <Info className="w-5 h-5" />
                How it works
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg flex items-center justify-center gap-2 text-sm sm:text-base transition-all ${
              activeTab === 'map'
                ? 'bg-white shadow-md text-indigo-600'
                : 'bg-white/50 text-gray-600 hover:bg-white/80'
            }`}
          >
            <Map className="w-4 h-4" />
            Traffic Map
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg flex items-center justify-center gap-2 text-sm sm:text-base transition-all ${
              activeTab === 'data'
                ? 'bg-white shadow-md text-indigo-600'
                : 'bg-white/50 text-gray-600 hover:bg-white/80'
            }`}
          >
            <BarChartIcon className="w-4 h-4" />
            District Data
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Input Panel */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl mb-4 text-gray-800 flex items-center gap-2">
              <Coins className="w-5 h-5" />
              Budget & Constraints
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-gray-700">Available Budget (SEK)</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  step="100000"
                />
                <p className="text-xs text-gray-500 mt-1">SEK {(budget / 1000000).toFixed(1)}M available</p>
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700">
                  Preferences & Constraints
                </label>
                <textarea
                  value={userPreference}
                  onChange={(e) => setUserPreference(e.target.value)}
                  placeholder="e.g., prioritize tram lines, avoid construction near schools, focus on eco-friendly solutions..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">Specify any requirements or limitations</p>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  id="gov-restrictions"
                  checked={loadGovRestrictions}
                  onChange={(e) => setLoadGovRestrictions(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="gov-restrictions" className="flex-1 cursor-pointer">
                  <div className="text-sm font-medium text-gray-900">Load Government Restrictions</div>
                  <div className="text-xs text-gray-600">Apply regulatory constraints and zoning limitations</div>
                </label>
              </div>

              <button
                onClick={optimizeTransport}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Optimize Investment
              </button>
            </div>
          </div>

          {/* Map or Chart View */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-4 sm:p-6">
            {activeTab === 'map' ? (
              <>
                <h2 className="text-lg sm:text-xl mb-4 text-gray-800">Live Traffic Heatmap</h2>
                <div className="h-[260px] sm:h-[340px] lg:h-[400px]">
                  <DelhiTrafficMap
                    hotspots={TRAFFIC_HOTSPOTS}
                    optimizationZones={showResults ? optimizationZones : []}
                    showHeatmap={true}
                  />
                </div>
                <div className="flex flex-wrap gap-3 mt-4 justify-center text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                    <span className="text-gray-600">Critical (&gt;90%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
                    <span className="text-gray-600">High (75-90%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                    <span className="text-gray-600">Medium (60-75%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-indigo-600 rounded-full text-white flex items-center justify-center text-xs">✓</div>
                    <span className="text-gray-600">Optimization Zone</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg sm:text-xl mb-4 text-gray-800">District Congestion Levels</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={DISTRICTS}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis label={{ value: 'Congestion %', angle: -90, position: 'insideLeft' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      formatter={(value: number) => [`${value}%`, 'Congestion']}
                    />
                    <Bar dataKey="congestion" radius={[8, 8, 0, 0]}>
                      {DISTRICTS.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.congestion > 85 ? '#dc2626' : entry.congestion > 75 ? '#f59e0b' : '#10b981'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-4 justify-center text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-600 rounded"></div>
                    <span className="text-gray-600">High (&gt;85%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-amber-500 rounded"></div>
                    <span className="text-gray-600">Medium (75-85%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-500 rounded"></div>
                    <span className="text-gray-600">Low (&lt;75%)</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Results */}
        {showResults && results.length > 0 && (
          <>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
                <h2 className="text-xl sm:text-2xl text-gray-800">Zone-Specific Implementation Plan</h2>
                <div className="text-left sm:text-right">
                  <div className="text-sm text-gray-600">Total Investment</div>
                  <div className="text-2xl text-indigo-600">SEK {(totalCost / 1000000).toFixed(2)}M</div>
                  <div className="text-sm text-gray-600">Expected Impact: {totalImpact.toFixed(0)} points</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {optimizationZones.map((zone, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedZone(zone)}
                    className="border-2 border-indigo-200 rounded-lg p-5 hover:shadow-lg transition-all bg-gradient-to-br from-white to-indigo-50 cursor-pointer hover:border-indigo-400 hover:scale-[1.02]"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="w-4 h-4 text-indigo-600" />
                          <h3 className="text-lg text-gray-900">{zone.name}</h3>
                        </div>
                        <p className="text-indigo-600 mb-2">{zone.intervention}</p>
                        <p className="text-sm text-gray-700">{zone.details}</p>
                      </div>
                    </div>

                    <div className="border-t border-indigo-200 pt-3 mt-3">
                      <div className="text-sm mb-2">Expected Impact:</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white rounded px-2 py-1">
                          <div className="text-gray-600">Traffic Flow</div>
                          <div className="text-emerald-600">+{zone.impact.trafficFlow.toFixed(1)}%</div>
                        </div>
                        <div className="bg-white rounded px-2 py-1">
                          <div className="text-gray-600">Happiness</div>
                          <div className="text-emerald-600">+{zone.impact.citizenHappiness.toFixed(1)}%</div>
                        </div>
                        <div className="bg-white rounded px-2 py-1">
                          <div className="text-gray-600">Avg Speed</div>
                          <div className="text-emerald-600">+{zone.impact.avgSpeedIncrease.toFixed(1)} km/h</div>
                        </div>
                        <div className="bg-white rounded px-2 py-1">
                          <div className="text-gray-600">Delay Cut</div>
                          <div className="text-emerald-600">-{zone.impact.delayReduction.toFixed(0)} min</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <p className="text-sm text-gray-700">
                  <strong>Implementation Strategy:</strong> The optimizer targets specific high-congestion zones with
                  concrete interventions. Each zone shows exact infrastructure additions (bus routes, metro extensions, tram lines)
                  with detailed implementation plans and measurable impact metrics.
                </p>
              </div>
            </div>

            {/* Impact Analysis */}
            {impactMetrics && (
              <ImpactAnalysis metrics={impactMetrics} />
            )}

            {/* Global Implementation Plan */}
            {optimizationZones.length > 0 && (
              <GlobalImplementationPlan zones={optimizationZones} />
            )}
          </>
        )}

        {showResults && results.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-600">Budget too low to make any meaningful interventions. Try increasing the budget.</p>
          </div>
        )}

        {/* Professional Footer */}
        <div className="mt-12 pt-6 border-t border-gray-300">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded flex items-center justify-center text-white font-bold text-xs">
                GBG
              </div>
              <div>
                <div className="font-semibold text-gray-700">City of Gothenburg</div>
                <div className="text-xs text-gray-500">Urban Mobility Department</div>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xs text-gray-500">Version 2.4.1 | Last Updated: April 2026</div>
              <div className="text-xs text-gray-500">Authorized Government System - For Official Use</div>
            </div>
          </div>
        </div>
      </div>

      {/* Zone Visualization Modal */}
      {selectedZone && (
        <ZoneVisualization
          zone={selectedZone}
          allHotspots={TRAFFIC_HOTSPOTS}
          onClose={() => setSelectedZone(null)}
        />
      )}

      {/* Info Page Modal */}
      {showInfo && (
        <InfoPage onClose={() => setShowInfo(false)} />
      )}
    </div>
  );
}