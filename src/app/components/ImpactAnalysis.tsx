import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Users, Gauge, Clock } from 'lucide-react';

interface ImpactMetrics {
  totalTrafficFlowImprovement: number;
  citizenHappinessIncrease: number;
  avgSpeedIncrease: number;
  totalDelayReduction: number;
  affectedPopulation: number;
  co2Reduction: number;
}

interface Props {
  metrics: ImpactMetrics;
}

export default function ImpactAnalysis({ metrics }: Props) {
  const impactData = [
    { id: 'flow', name: 'Traffic Flow', before: 100, after: 100 + metrics.totalTrafficFlowImprovement },
    { id: 'speed', name: 'Avg Speed (km/h)', before: 18, after: 18 + metrics.avgSpeedIncrease },
    { id: 'happiness', name: 'Happiness Index', before: 60, after: 60 + metrics.citizenHappinessIncrease },
  ];

  const timelineData = [
    { id: 'now', month: 'Current', efficiency: 100 },
    { id: 'm3', month: '3 months', efficiency: 100 + metrics.totalTrafficFlowImprovement * 0.4 },
    { id: 'm6', month: '6 months', efficiency: 100 + metrics.totalTrafficFlowImprovement * 0.7 },
    { id: 'm12', month: '12 months', efficiency: 100 + metrics.totalTrafficFlowImprovement },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl mb-6 text-gray-900 flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-indigo-600" />
        Impact Analysis
      </h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-indigo-200">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="w-5 h-5 text-indigo-600" />
            <span className="text-sm text-gray-600">Traffic Flow</span>
          </div>
          <div className="text-2xl text-indigo-700">+{metrics.totalTrafficFlowImprovement.toFixed(1)}%</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-4 border border-emerald-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span className="text-sm text-gray-600">Happiness</span>
          </div>
          <div className="text-2xl text-emerald-700">+{metrics.citizenHappinessIncrease.toFixed(1)}%</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600">Avg Speed</span>
          </div>
          <div className="text-2xl text-purple-700">+{metrics.avgSpeedIncrease.toFixed(1)} km/h</div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <span className="text-sm text-gray-600">Time Saved</span>
          </div>
          <div className="text-2xl text-amber-700">-{metrics.totalDelayReduction.toFixed(0)} min</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Before/After Comparison */}
        <div>
          <h3 className="text-lg mb-4 text-gray-800">Before vs After</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={impactData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
              <Bar key="bar-before" dataKey="before" fill="#94a3b8" name="Before" radius={[4, 4, 0, 0]} />
              <Bar key="bar-after" dataKey="after" fill="#6366f1" name="After" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Implementation Timeline */}
        <div>
          <h3 className="text-lg mb-4 text-gray-800">Expected Improvement Timeline</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis label={{ value: 'Efficiency Index', angle: -90, position: 'insideLeft', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Line
                key="line-efficiency"
                type="monotone"
                dataKey="efficiency"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ fill: '#6366f1', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Affected Population</div>
          <div className="text-xl text-gray-900">{(metrics.affectedPopulation / 1000000).toFixed(2)}M citizens</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">CO₂ Reduction (Annual)</div>
          <div className="text-xl text-gray-900">{metrics.co2Reduction.toFixed(0)} tons</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Economic Value (Annual)</div>
          <div className="text-xl text-gray-900">SEK {(metrics.totalDelayReduction * metrics.affectedPopulation * 0.005).toFixed(0)}M</div>
        </div>
      </div>
    </div>
  );
}

export type { ImpactMetrics };
