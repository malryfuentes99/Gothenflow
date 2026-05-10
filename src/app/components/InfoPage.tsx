import { X, Info, Users, Clock, TrendingUp, MapPin, Bus, Train, TramFront, TrafficCone, Route, Bike } from 'lucide-react';
import Logo from './Logo';

interface Props {
  onClose: () => void;
}

export default function InfoPage({ onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl max-w-5xl w-full my-0 sm:my-8 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 sm:p-6 sm:rounded-t-2xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="bg-white rounded-lg p-2">
              <Logo size="medium" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl mb-1">Gothenburg Transport Optimization Platform</h2>
              <p className="text-indigo-100 text-sm">Municipal Infrastructure Planning System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors self-start sm:self-auto"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-h-[calc(100vh-180px)] sm:max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* About GTOP */}
          <section>
            <h3 className="text-xl sm:text-2xl mb-4 text-gray-900 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-indigo-600" />
              About GTOP
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 border border-indigo-200">
                <div className="text-2xl sm:text-3xl mb-2">1.1M+</div>
                <div className="text-sm text-gray-700">Population</div>
                <div className="text-xs text-gray-600 mt-1">Metro Area</div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-5 border border-amber-200">
                <div className="text-2xl sm:text-3xl mb-2">~22 km/h</div>
                <div className="text-sm text-gray-700">Avg Traffic Speed</div>
                <div className="text-xs text-gray-600 mt-1">Peak Hours</div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-5 border border-red-200">
                <div className="text-2xl sm:text-3xl mb-2">45%+</div>
                <div className="text-sm text-gray-700">Congestion Rate</div>
                <div className="text-xs text-gray-600 mt-1">High-Traffic Zones</div>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed">
              The Gothenburg Transport Optimization Platform (GTOP) is a municipal decision support system designed to address
              Gothenburg's traffic congestion, safety, and climate targets. With a growing commuter region, GTOP leverages
              real-time data from 12 major traffic hotspots including Gothenburg Central Station, Brunnsparken, and Korsvagen to recommend
              evidence-based, cost-effective infrastructure improvements aligned with the Gothenburg Mobility Strategy.
            </p>
          </section>

          {/* Input Parameters */}
          <section>
            <h3 className="text-xl sm:text-2xl mb-4 text-gray-900">Input Parameters Explained</h3>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="font-semibold text-gray-900 mb-2">💰 Available Budget</div>
                <p className="text-sm text-gray-700">
                  Total investment budget in Swedish Krona (SEK). The optimizer will allocate this across multiple
                  zones to maximize overall impact. Typical range: SEK 20M - 500M.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="font-semibold text-gray-900 mb-2">📝 Preferences & Constraints</div>
                <p className="text-sm text-gray-700 mb-2">
                  Specify your priorities and limitations. Examples:
                </p>
                <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc">
                  <li>"Prioritize tram lines for mass transit"</li>
                  <li>"Avoid construction near schools during term time"</li>
                  <li>"Focus on eco-friendly and sustainable solutions"</li>
                  <li>"Must improve Hisingen connectivity"</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="font-semibold text-gray-900 mb-2">🏛️ Government Restrictions</div>
                <p className="text-sm text-gray-700">
                  Enable this to apply regulatory constraints such as rail construction limitations in heritage districts,
                  zoning laws, environmental clearances, and urban planning restrictions. This may reduce rail
                  options but ensures compliance with the Gothenburg city plan.
                </p>
              </div>
            </div>
          </section>

          {/* Optimization Options */}
          <section>
            <h3 className="text-xl sm:text-2xl mb-4 text-gray-900">Infrastructure Solutions</h3>
            <p className="text-gray-700 mb-4">
              Our AI analyzes congestion patterns and recommends optimal combinations of the following interventions:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border-2 border-red-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <Train className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="font-semibold text-gray-900">Metro Line Extension</div>
                </div>
                <p className="text-sm text-gray-700">
                  High-capacity rapid transit (50,000+ passengers/day). Ideal for critical congestion zones.
                  Cost: SEK 2M/km
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border-2 border-amber-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <TramFront className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="font-semibold text-gray-900">Tram Line</div>
                </div>
                <p className="text-sm text-gray-700">
                  Medium-capacity street-level transit (15-20K passengers/day). Great for local connectivity.
                  Cost: SEK 800K/km
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border-2 border-blue-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Bus className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="font-semibold text-gray-900">Bus Routes</div>
                </div>
                <p className="text-sm text-gray-700">
                  Flexible, cost-effective solution with quick deployment. Circular and express routes.
                  Cost: SEK 50K/bus
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border-2 border-emerald-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <TrafficCone className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="font-semibold text-gray-900">Smart Traffic Lights</div>
                </div>
                <p className="text-sm text-gray-700">
                  AI-powered adaptive signals reduce delays by 20-30%. Real-time traffic flow optimization.
                  Cost: SEK 150K/intersection
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border-2 border-purple-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Route className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="font-semibold text-gray-900">New Roads/Lanes</div>
                </div>
                <p className="text-sm text-gray-700">
                  Road widening, new bypasses, and dedicated lanes. Increases capacity immediately.
                  Cost: SEK 1.5M/km
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border-2 border-teal-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Bike className="w-6 h-6 text-teal-600" />
                  </div>
                  <div className="font-semibold text-gray-900">Bicycle Paths</div>
                </div>
                <p className="text-sm text-gray-700">
                  Protected cycling infrastructure. Eco-friendly, reduces short-distance car trips.
                  Cost: SEK 200K/km
                </p>
              </div>
            </div>
          </section>

          {/* Analysis Metrics */}
          <section>
            <h3 className="text-xl sm:text-2xl mb-4 text-gray-900">What We Analyze</h3>
            <p className="text-gray-700 mb-4">
              Our optimizer evaluates multiple data sources to predict infrastructure impact:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 border border-indigo-200">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <div className="font-semibold text-gray-900">Traffic Flow Analysis</div>
                </div>
                <p className="text-sm text-gray-700">
                  Real-time data from 12 traffic hotspots measuring vehicle density, average speed,
                  and congestion levels. Updated every 15 minutes using GPS and sensor networks.
                </p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-5 border border-amber-200">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <div className="font-semibold text-gray-900">Delay Metrics</div>
                </div>
                <p className="text-sm text-gray-700">
                  Peak hour delay measurements, average commute times, and bottleneck identification.
                  Historical data compared with optimal flow scenarios to calculate time savings.
                </p>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-5 border border-emerald-200">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <div className="font-semibold text-gray-900">Citizen Happiness Prediction</div>
                </div>
                <p className="text-sm text-gray-700">
                  Based on surveys of commuters across Gothenburg rating transport quality, comfort, reliability,
                  and overall satisfaction. ML models predict happiness increase from improvements.
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-5 border border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-purple-600" />
                  <div className="font-semibold text-gray-900">Population & Demographics</div>
                </div>
                <p className="text-sm text-gray-700">
                  District-level population density, employment centers, school locations, and commute patterns.
                  Ensures interventions serve areas with highest demand and benefit most citizens.
                </p>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
            <h3 className="text-lg sm:text-xl mb-4 text-gray-900">How the Optimizer Works</h3>
            <ol className="space-y-3 text-gray-700">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">1</span>
                <div>
                  <strong>Data Collection:</strong> Gathers real-time traffic data, congestion levels, and existing infrastructure
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">2</span>
                <div>
                  <strong>Priority Calculation:</strong> Ranks zones by congestion severity, population impact, and infrastructure gaps
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">3</span>
                <div>
                  <strong>Cost-Benefit Analysis:</strong> Evaluates ROI for each intervention type considering your budget and constraints
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">4</span>
                <div>
                  <strong>Optimization:</strong> Uses greedy algorithm to allocate budget across zones for maximum total impact
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">5</span>
                <div>
                  <strong>Impact Prediction:</strong> Simulates improvements to predict traffic flow, happiness, and time savings
                </div>
              </li>
            </ol>
          </section>

          {/* CTA */}
          <div className="text-center">
            <button
              onClick={onClose}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
            >
              Start Optimizing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
