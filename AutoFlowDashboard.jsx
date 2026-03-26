import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AutoFlowDashboard = () => {
  const [systemHealth, setSystemHealth] = useState({
    totalServices: 0,
    totalEvents: 0,
    totalAnomalies: 0,
    totalActions: 0,
    successRate: 0
  });

  const [recentEvents, setRecentEvents] = useState([]);
  const [agentPerformance, setAgentPerformance] = useState([]);
  const [recentActions, setRecentActions] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch data from n8n webhook endpoints
  useEffect(() => {
    const fetchData = async () => {
      try {
        // System Health
        const healthResponse = await fetch('/api/system-health');
        const healthData = await healthResponse.json();
        setSystemHealth(healthData);

        // Recent Events
        const eventsResponse = await fetch('/api/events?limit=50');
        const eventsData = await eventsResponse.json();
        setRecentEvents(eventsData);

        // Agent Performance
        const agentsResponse = await fetch('/api/agents');
        const agentsData = await agentsResponse.json();
        setAgentPerformance(agentsData);

        // Recent Actions
        const actionsResponse = await fetch('/api/actions?limit=20');
        const actionsData = await actionsResponse.json();
        setRecentActions(actionsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Sample data for demonstration
  const anomalyTrendData = [
    { time: '00:00', anomalies: 4, alerts: 2, actions: 1 },
    { time: '04:00', anomalies: 3, alerts: 1, actions: 1 },
    { time: '08:00', anomalies: 8, alerts: 5, actions: 3 },
    { time: '12:00', anomalies: 12, alerts: 7, actions: 4 },
    { time: '16:00', anomalies: 10, alerts: 6, actions: 3 },
    { time: '20:00', anomalies: 6, alerts: 3, actions: 2 },
  ];

  const agentScoresData = [
    { name: 'Anomaly Agent', score: 0.82, weight: 0.35 },
    { name: 'Risk Agent', score: 0.65, weight: 0.25 },
    { name: 'SLA Agent', score: 0.71, weight: 0.25 },
    { name: 'Context Agent', score: 0.58, weight: 0.15 },
  ];

  const actionDistribution = [
    { name: 'Restart Container', value: 35 },
    { name: 'Restart Pod', value: 28 },
    { name: 'Scale Service', value: 22 },
    { name: 'Reroute Traffic', value: 10 },
    { name: 'Isolate Node', value: 5 },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">AutoFlow AI</h1>
            <p className="text-gray-400">Autonomous IT Operations Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">Auto-refresh</span>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded ${autoRefresh ? 'bg-green-600' : 'bg-gray-600'}`}
              >
                {autoRefresh ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-500">System Active</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-2">Total Services</div>
          <div className="text-3xl font-bold">{systemHealth.totalServices || 24}</div>
          <div className="text-green-500 text-sm mt-2">↑ 2 new</div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-2">Events Today</div>
          <div className="text-3xl font-bold">{systemHealth.totalEvents || 1247}</div>
          <div className="text-blue-500 text-sm mt-2">~20/min</div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 border border-yellow-700 border-2">
          <div className="text-gray-400 text-sm mb-2">Anomalies</div>
          <div className="text-3xl font-bold text-yellow-500">{systemHealth.totalAnomalies || 43}</div>
          <div className="text-yellow-500 text-sm mt-2">3.4% of events</div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 border border-green-700 border-2">
          <div className="text-gray-400 text-sm mb-2">Actions Taken</div>
          <div className="text-3xl font-bold text-green-500">{systemHealth.totalActions || 18}</div>
          <div className="text-green-500 text-sm mt-2">100% automated</div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 border border-blue-700 border-2">
          <div className="text-gray-400 text-sm mb-2">Success Rate</div>
          <div className="text-3xl font-bold text-blue-500">{systemHealth.successRate || 94}%</div>
          <div className="text-blue-500 text-sm mt-2">↑ 3% vs yesterday</div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Anomaly Trend Chart */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-4">Anomaly Detection Trend (24h)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={anomalyTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Legend />
              <Line type="monotone" dataKey="anomalies" stroke="#FBBF24" strokeWidth={2} />
              <Line type="monotone" dataKey="alerts" stroke="#F59E0B" strokeWidth={2} />
              <Line type="monotone" dataKey="actions" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Agent Performance Chart */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-4">Multi-Agent Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={agentScoresData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" angle={-15} textAnchor="end" height={80} />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Legend />
              <Bar dataKey="score" fill="#3B82F6" name="Current Score" />
              <Bar dataKey="weight" fill="#10B981" name="Weight" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Second Row: Action Distribution and Recent Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Action Distribution Pie Chart */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-4">Action Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={actionDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {actionDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Actions Table */}
        <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-4">Recent Autonomous Actions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700">
                <tr className="text-left text-gray-400">
                  <th className="pb-2">Time</th>
                  <th className="pb-2">Action</th>
                  <th className="pb-2">Service</th>
                  <th className="pb-2">Reason</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-gray-700">
                  <td className="py-2">10:23:45</td>
                  <td className="py-2">
                    <span className="px-2 py-1 bg-blue-900 text-blue-300 rounded text-xs">
                      Restart Container
                    </span>
                  </td>
                  <td className="py-2">web-api-prod</td>
                  <td className="py-2">Memory usage 92%</td>
                  <td className="py-2">
                    <span className="px-2 py-1 bg-green-900 text-green-300 rounded text-xs">
                      ✓ Success
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-2">10:18:12</td>
                  <td className="py-2">
                    <span className="px-2 py-1 bg-purple-900 text-purple-300 rounded text-xs">
                      Scale Service
                    </span>
                  </td>
                  <td className="py-2">payment-gateway</td>
                  <td className="py-2">CPU usage 98%</td>
                  <td className="py-2">
                    <span className="px-2 py-1 bg-green-900 text-green-300 rounded text-xs">
                      ✓ Success
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-2">10:12:33</td>
                  <td className="py-2">
                    <span className="px-2 py-1 bg-yellow-900 text-yellow-300 rounded text-xs">
                      Reroute Traffic
                    </span>
                  </td>
                  <td className="py-2">auth-service</td>
                  <td className="py-2">Network latency 450ms</td>
                  <td className="py-2">
                    <span className="px-2 py-1 bg-green-900 text-green-300 rounded text-xs">
                      ✓ Success
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-2">10:05:21</td>
                  <td className="py-2">
                    <span className="px-2 py-1 bg-red-900 text-red-300 rounded text-xs">
                      Restart Pod
                    </span>
                  </td>
                  <td className="py-2">data-processor</td>
                  <td className="py-2">Error rate 8.5%</td>
                  <td className="py-2">
                    <span className="px-2 py-1 bg-green-900 text-green-300 rounded text-xs">
                      ✓ Success
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Agent Intelligence Panel */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
        <h2 className="text-xl font-bold mb-4">Live Agent Intelligence</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-900 rounded p-4 border border-blue-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Anomaly Agent</h3>
              <span className="text-blue-400 text-xl">🔍</span>
            </div>
            <div className="text-2xl font-bold text-blue-400 mb-1">0.82</div>
            <div className="text-xs text-gray-400">Weight: 35%</div>
            <div className="mt-2 text-xs text-gray-300">
              Currently monitoring 24 services for statistical anomalies
            </div>
          </div>

          <div className="bg-gray-900 rounded p-4 border border-purple-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Risk Agent</h3>
              <span className="text-purple-400 text-xl">⚠️</span>
            </div>
            <div className="text-2xl font-bold text-purple-400 mb-1">0.65</div>
            <div className="text-xs text-gray-400">Weight: 25%</div>
            <div className="mt-2 text-xs text-gray-300">
              Infrastructure health: 89% | Node reliability high
            </div>
          </div>

          <div className="bg-gray-900 rounded p-4 border border-green-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">SLA Agent</h3>
              <span className="text-green-400 text-xl">📊</span>
            </div>
            <div className="text-2xl font-bold text-green-400 mb-1">0.71</div>
            <div className="text-xs text-gray-400">Weight: 25%</div>
            <div className="mt-2 text-xs text-gray-300">
              All SLAs within target | 0 breaches in last 24h
            </div>
          </div>

          <div className="bg-gray-900 rounded p-4 border border-yellow-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Context Agent</h3>
              <span className="text-yellow-400 text-xl">🌐</span>
            </div>
            <div className="text-2xl font-bold text-yellow-400 mb-1">0.58</div>
            <div className="text-xs text-gray-400">Weight: 15%</div>
            <div className="mt-2 text-xs text-gray-300">
              Peak hours | 3 recent deployments | No regional issues
            </div>
          </div>
        </div>
      </div>

      {/* System Status Footer */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-6 border border-blue-700">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold mb-2">System Status</h3>
            <p className="text-gray-300">
              AutoFlow is actively monitoring your infrastructure. All agents are operating normally.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400 mb-1">Autonomy Level</div>
            <div className="text-4xl font-bold text-green-400">95%</div>
            <div className="text-xs text-gray-400 mt-1">Learning enabled</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoFlowDashboard;
