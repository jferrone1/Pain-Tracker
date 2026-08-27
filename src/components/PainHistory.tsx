import React, { useState } from "react";
import { PainRecord } from "../types";
import { Trash2, Search, Calendar, Filter, FileText, ChevronDown, ChevronUp } from "lucide-react";

interface PainHistoryProps {
  records: PainRecord[];
  onDeleteRecord: (id: string) => void;
}

export const PainHistory: React.FC<PainHistoryProps> = ({ records, onDeleteRecord }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [timeFilter, setTimeFilter] = useState<string>("all");
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedRecordId(expandedRecordId === id ? null : id);
  };

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.triggers.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.medications.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTime = timeFilter === "all" || r.timeOfDay === timeFilter;

    return matchesSearch && matchesTime;
  }).sort((a, b) => {
    // Sort descending by date, then custom time if available
    const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    // Fallback: order by time slots roughly
    const slots = { morning: 1, afternoon: 2, evening: 3, custom: 4 };
    return (slots[b.timeOfDay] || 4) - (slots[a.timeOfDay] || 4);
  });

  const getIntensityBadge = (level: number) => {
    if (level === 0) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (level <= 3) return "bg-green-50 text-green-700 border-green-200";
    if (level <= 6) return "bg-amber-50 text-amber-700 border-amber-200";
    if (level <= 8) return "bg-orange-50 text-orange-700 border-orange-200";
    return "bg-red-50 text-red-700 border-red-200 animate-pulse";
  };

  const formatRecordTime = (timeStr?: string, category?: string) => {
    if (!timeStr) return category || "";
    try {
      const [hoursStr, minutesStr] = timeStr.split(":");
      const hours = parseInt(hoursStr, 10);
      if (isNaN(hours)) return `${timeStr} (${category})`;
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 === 0 ? 12 : hours % 12;
      return `${displayHours}:${minutesStr} ${ampm} (${category})`;
    } catch (e) {
      return `${timeStr} (${category})`;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header & Controls */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/50">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-teal-500" />
          History Log entries ({filteredRecords.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-8 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              id="history-search-input"
              type="text"
              placeholder="Search by location, notes, meds, or triggers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>

          {/* Time Filter */}
          <div className="md:col-span-4 relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <select
              id="history-time-filter"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm appearance-none cursor-pointer"
            >
              <option value="all">All Times of Day</option>
              <option value="morning">Morning Logs Only</option>
              <option value="afternoon">Afternoon Logs Only</option>
              <option value="evening">Evening Logs Only</option>
              <option value="custom">Custom Logs Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* List Container */}
      {filteredRecords.length === 0 ? (
        <div className="p-12 text-center text-slate-400">
          <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="font-semibold text-slate-700">No matching logs found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search text.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200">
          {filteredRecords.map((r) => {
            const isExpanded = expandedRecordId === r.id;
            return (
              <div id={`record-row-${r.id}`} key={r.id} className="p-4 hover:bg-slate-50/70 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  {/* Left content click to expand */}
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleExpand(r.id)}>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-sm font-semibold text-slate-800">
                        {r.date}
                      </span>
                      <span className="text-xs font-semibold text-teal-600 bg-teal-50/70 border border-teal-100 px-2.5 py-0.5 rounded-full capitalize">
                        {formatRecordTime(r.customTime, r.timeOfDay)}
                      </span>
                      <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full capitalize">
                        Activity: {r.activityLevel}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 text-xs font-bold rounded-lg border ${getIntensityBadge(r.painLevel)}`}>
                        Pain Level {r.painLevel}/10
                      </span>
                      <span className="text-sm font-semibold text-slate-700 truncate">
                        {r.location}
                      </span>
                    </div>

                    {r.notes && !isExpanded && (
                      <p className="text-xs text-slate-400 mt-1.5 truncate max-w-xl">
                        {r.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions & Expand Toggle */}
                  <div className="flex items-center gap-1.5 self-center">
                    <button
                      id={`delete-record-btn-${r.id}`}
                      onClick={() => onDeleteRecord(r.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete log"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      id={`toggle-expand-btn-${r.id}`}
                      onClick={() => toggleExpand(r.id)}
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Notes and Metadata */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-500 bg-slate-50/50 p-3.5 rounded-xl animate-fade-in">
                    <div>
                      <p className="font-semibold text-slate-600 mb-1">Triggers & Factors</p>
                      <p className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-700">
                        {r.triggers || <span className="text-slate-400 italic">None logged</span>}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-600 mb-1">Medications or Relief</p>
                      <p className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-700">
                        {r.medications || <span className="text-slate-400 italic">None logged</span>}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-600 mb-1">Notes</p>
                      <p className="bg-white p-2.5 rounded-lg border border-slate-200 min-h-[34px] text-slate-700">
                        {r.notes || <span className="text-slate-400 italic">No notes added</span>}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
