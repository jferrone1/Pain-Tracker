import React from "react";
import { PainRecord } from "../types";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  Legend
} from "recharts";
import { Calendar, BarChart2, Activity, ShieldAlert, CheckCircle } from "lucide-react";

interface PainChartsProps {
  records: PainRecord[];
}

export const PainCharts: React.FC<PainChartsProps> = ({ records }) => {
  // If no records, display a placeholder state
  if (records.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center flex flex-col items-center justify-center min-h-[350px]">
        <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-400">
          <Activity className="w-8 h-8 text-teal-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">No Tracking Analytics Available</h3>
        <p className="text-sm text-slate-400 max-w-sm mb-4">
          Please add some pain logs or load our realistic sample history to visualize your physical wellness charts.
        </p>
      </div>
    );
  }

  // --- STATS COMPUTATIONS ---
  const totalEntries = records.length;

  const totalPain = records.reduce((sum, r) => sum + r.painLevel, 0);
  const averagePain = (totalPain / totalEntries).toFixed(1);

  // Compute location counts and averages
  const locationStats: { [key: string]: { sum: number; count: number } } = {};
  records.forEach((r) => {
    const loc = r.location || "General";
    if (!locationStats[loc]) {
      locationStats[loc] = { sum: 0, count: 0 };
    }
    locationStats[loc].sum += r.painLevel;
    locationStats[loc].count += 1;
  });

  const locationData = Object.entries(locationStats).map(([name, stat]) => ({
    name,
    avgPain: parseFloat((stat.sum / stat.count).toFixed(1)),
    count: stat.count
  })).sort((a, b) => b.avgPain - a.avgPain);

  const primaryLocation = locationData[0]?.name || "N/A";

  // Compute Time of Day Averages
  const timeStats: { [key: string]: { sum: number; count: number } } = {
    morning: { sum: 0, count: 0 },
    afternoon: { sum: 0, count: 0 },
    evening: { sum: 0, count: 0 },
    custom: { sum: 0, count: 0 }
  };

  records.forEach((r) => {
    if (timeStats[r.timeOfDay]) {
      timeStats[r.timeOfDay].sum += r.painLevel;
      timeStats[r.timeOfDay].count += 1;
    }
  });

  const timeOfDayData = [
    { name: "Morning", avgPain: timeStats.morning.count > 0 ? parseFloat((timeStats.morning.sum / timeStats.morning.count).toFixed(1)) : 0, count: timeStats.morning.count },
    { name: "Afternoon", avgPain: timeStats.afternoon.count > 0 ? parseFloat((timeStats.afternoon.sum / timeStats.afternoon.count).toFixed(1)) : 0, count: timeStats.afternoon.count },
    { name: "Evening", avgPain: timeStats.evening.count > 0 ? parseFloat((timeStats.evening.sum / timeStats.evening.count).toFixed(1)) : 0, count: timeStats.evening.count },
    { name: "Other (Custom)", avgPain: timeStats.custom.count > 0 ? parseFloat((timeStats.custom.sum / timeStats.custom.count).toFixed(1)) : 0, count: timeStats.custom.count }
  ];

  // Group pain levels chronologically by date
  // For duplicate dates, let's group by date and find the max pain, average pain, or keep individual records.
  // A chronological history is cleaner: sort records by date
  const chronologicalRecords = [...records].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  // Keep last 15 entries for a clean, non-cluttered area chart
  const trendData = chronologicalRecords.slice(-15).map((r) => ({
    date: r.date.split("-").slice(1).join("/"), // MM/DD format
    painLevel: r.painLevel,
    time: r.timeOfDay.charAt(0).toUpperCase() + r.timeOfDay.slice(1) + (r.customTime ? ` (${r.customTime})` : ""),
    location: r.location
  }));

  // Analyze most frequent trigger
  const triggerCounts: { [key: string]: number } = {};
  records.forEach((r) => {
    if (r.triggers && r.triggers.toLowerCase() !== "none") {
      const parts = r.triggers.split(",").map(t => t.trim().toLowerCase());
      parts.forEach(t => {
        if (t) triggerCounts[t] = (triggerCounts[t] || 0) + 1;
      });
    }
  });
  const topTrigger = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "None recorded yet";

  return (
    <div className="space-y-6">
      {/* Bento Stats Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div id="stat-avg-pain" className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">Avg Pain Score</span>
            <Activity className="w-5 h-5 text-teal-500" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{averagePain} <span className="text-xs sm:text-sm font-normal text-slate-400">/ 10</span></div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Overall physical intensity average</p>
          </div>
        </div>

        {/* Stat 2 */}
        <div id="stat-top-hotspot" className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">Top Hotspot</span>
            <ShieldAlert className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <div className="text-base sm:text-xl font-bold text-slate-900 truncate max-w-full">{primaryLocation}</div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Most logged body pain location</p>
          </div>
        </div>

        {/* Stat 3 */}
        <div id="stat-primary-trigger" className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">Primary Trigger</span>
            <BarChart2 className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-slate-900 capitalize truncate max-w-full">{topTrigger}</div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Most recurring trigger factor</p>
          </div>
        </div>

        {/* Stat 4 */}
        <div id="stat-total-logs" className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">Logs Saved</span>
            <CheckCircle className="w-5 h-5 text-teal-500" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{totalEntries} <span className="text-xs sm:text-sm font-normal text-slate-400">records</span></div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Total clinical entries logged</p>
          </div>
        </div>
      </div>

      {/* Main Charts Block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Chronic Trend Over Time */}
        <div id="chart-timeline-panel" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm lg:col-span-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-500" />
                Chronological Pain Levels
              </h3>
              <p className="text-xs text-slate-400">Visualization of your last 15 consecutive pain scores</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="painGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={11} tickLine={false} tickCount={6} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "10px", border: "none", color: "#fff", fontSize: "12px" }}
                  itemStyle={{ color: "#2dd4bf" }}
                  labelStyle={{ fontWeight: "bold", color: "#fff" }}
                  formatter={(value) => [`Score: ${value}/10`, "Pain Level"]}
                />
                <Area type="monotone" dataKey="painLevel" stroke="#14b8a6" strokeWidth={2.5} fillOpacity={1} fill="url(#painGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Daily Fluctuations by Time of Day */}
        <div id="chart-daily-fluctuations-panel" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm lg:col-span-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-teal-500" />
                Time of Day Fluctuations
              </h3>
              <p className="text-xs text-slate-400">Average pain level by time slot</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeOfDayData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={10} tickLine={false} tickCount={6} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "10px", border: "none", color: "#fff", fontSize: "12px" }}
                  formatter={(value) => [`Avg Level: ${value}/10`]}
                />
                <Bar dataKey="avgPain" radius={[8, 8, 0, 0]}>
                  {timeOfDayData.map((entry, index) => {
                    const colors = ["#0d9488", "#14b8a6", "#5eead4", "#0f766e"];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid bottom for body locations breakdown */}
      {locationData.length > 0 && (
        <div id="chart-locations-breakdown" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-500 mb-4 text-xs uppercase tracking-wider">Pain Hotspots Severity Index</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locationData.map((loc) => {
              // Calculate a visual progress percentage for average pain level (avgPain / 10 * 100)
              const percentage = Math.min((loc.avgPain / 10) * 100, 100);
              let barColor = "bg-teal-500";
              if (loc.avgPain > 7) barColor = "bg-rose-500";
              else if (loc.avgPain > 4) barColor = "bg-amber-500";

              return (
                <div key={loc.name} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-sm text-slate-800">{loc.name}</span>
                    <span className="text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">{loc.avgPain} / 10 avg</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div className={`h-full ${barColor}`} style={{ width: `${percentage}%` }}></div>
                  </div>
                  <span className="text-xs text-slate-400 mt-1">{loc.count} {loc.count === 1 ? "entry" : "entries"} logged</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
