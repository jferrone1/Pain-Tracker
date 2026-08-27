import React, { useState, useEffect } from "react";
import { PainRecord, PatternReport } from "../types";
import { BrainCircuit, Loader2, Sparkles, AlertCircle, Calendar, Plus, ChevronRight, Check } from "lucide-react";
import { analyzePainPatterns } from "../lib/analyzer";

interface PatternReportViewProps {
  records: PainRecord[];
}

export const PatternReportView: React.FC<PatternReportViewProps> = ({ records }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<PatternReport[]>([]);
  const [activeReport, setActiveReport] = useState<PatternReport | null>(null);

  // Load saved session reports from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("pain_pattern_reports");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setReports(parsed);
        if (parsed.length > 0) {
          setActiveReport(parsed[0]);
        }
      } catch (e) {
        console.error("Error parsing reports:", e);
      }
    }
  }, []);

  const saveReportsToStorage = (newReports: PatternReport[]) => {
    setReports(newReports);
    localStorage.setItem("pain_pattern_reports", JSON.stringify(newReports));
  };

  const handleGenerateReport = async () => {
    if (records.length < 3) {
      setError("Please add at least 3 pain logs before running the pattern analysis to ensure high quality clinical correlations.");
      return;
    }

    setLoading(true);
    setError(null);

    // Provide a beautiful 800ms loading scanning feel, then execute offline analysis
    setTimeout(() => {
      try {
        const analysis = analyzePainPatterns(records);

        const newReport: PatternReport = {
          id: `report-${Date.now()}`,
          createdAt: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          }),
          ...analysis
        };

        const updatedReports = [newReport, ...reports];
        saveReportsToStorage(updatedReports);
        setActiveReport(newReport);
      } catch (err: any) {
        console.error(err);
        setError("Failed to compile local clinical report.");
      } finally {
        setLoading(false);
      }
    }, 800);
  };

  const handleDeleteReport = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = reports.filter((r) => r.id !== id);
    saveReportsToStorage(updated);
    if (activeReport?.id === id) {
      setActiveReport(updated[0] || null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Interactive Trigger Section */}
      <div className="bg-slate-950 rounded-2xl p-6 text-white shadow-sm border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-teal-400" />
            Clinical Pattern Intelligence
          </h2>
          <p className="text-sm text-slate-300 max-w-xl">
            Analyze your pain logs, medication routines, and custom notes locally to isolate triggers, track wellness trends, and output structured digital reports instantly.
          </p>
          <div className="text-xs text-slate-400">
            Current session tracking count: <span className="font-bold text-white bg-slate-800 px-2.5 py-0.5 rounded-full">{records.length} records</span>
          </div>
        </div>

        <button
          id="generate-ai-report-btn"
          onClick={handleGenerateReport}
          disabled={loading || records.length < 3}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all duration-200 cursor-pointer ${
            records.length < 3
              ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
              : "bg-white hover:bg-slate-100 text-slate-900 font-bold shadow-sm active:scale-95"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
              Scanning and correlating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-teal-600" />
              Analyze Patterns
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-800 text-sm border border-rose-100 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Analysis Notice</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Reports Split Panel Layout */}
      {reports.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Side: Report selector (Mobile Dropdown & Desktop List) */}
          <div className="lg:col-span-4 space-y-3">
            {/* Mobile Selector Dropdown */}
            <div className="lg:hidden bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Select Report Session
              </label>
              <div className="flex gap-2">
                <select
                  id="mobile-report-selector"
                  value={activeReport?.id || ""}
                  onChange={(e) => {
                    const selected = reports.find((rep) => rep.id === e.target.value);
                    if (selected) setActiveReport(selected);
                  }}
                  className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700"
                >
                  {reports.map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.createdAt} - {rep.summary.slice(0, 30)}...
                    </option>
                  ))}
                </select>
                {activeReport && (
                  <button
                    id="delete-active-report-mobile-btn"
                    onClick={(e) => handleDeleteReport(activeReport.id, e)}
                    className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 hover:border-rose-300 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            {/* Desktop Side List */}
            <div className="hidden lg:block bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2 mb-2">Saved Session Reports</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {reports.map((rep) => {
                  const isActive = activeReport?.id === rep.id;
                  return (
                    <div
                      id={`report-tab-${rep.id}`}
                      key={rep.id}
                      onClick={() => setActiveReport(rep)}
                      className={`p-3 rounded-xl border transition-all duration-150 cursor-pointer flex justify-between items-start ${
                        isActive
                          ? "bg-teal-50/50 border-teal-200 shadow-sm"
                          : "bg-white border-slate-100 hover:bg-slate-50"
                      }`}
                    >
                      <div className="space-y-1 pr-2">
                        <p className="text-xs font-semibold text-slate-800">{rep.createdAt}</p>
                        <p className="text-xs text-slate-400 line-clamp-2">{rep.summary}</p>
                      </div>
                      <button
                        id={`delete-report-tab-btn-${rep.id}`}
                        onClick={(e) => handleDeleteReport(rep.id, e)}
                        className="text-slate-400 hover:text-rose-500 text-xs py-0.5 px-1.5 rounded transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Side: Active report viewer */}
          {activeReport && (
            <div id="active-report-viewer" className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
              <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full">
                    Clinical Digital Report
                  </span>
                  <h3 className="text-lg font-semibold text-slate-900 mt-2">Analytical Physical Insights</h3>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p className="font-mono">ID: {activeReport.id.slice(0, 10)}</p>
                  <p className="mt-0.5">{activeReport.createdAt}</p>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Clinical Summary Overview</h4>
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {activeReport.summary}
                </p>
              </div>

              {/* Grid factors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Time of Day Patterns */}
                <div className="border border-slate-200 rounded-xl p-4 space-y-2 bg-slate-50/20">
                  <h4 className="text-xs font-bold text-teal-700 uppercase tracking-wider">Time-of-day Correlation</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{activeReport.timeOfDayPatterns}</p>
                </div>

                {/* Medication Effectiveness */}
                <div className="border border-slate-200 rounded-xl p-4 space-y-2 bg-slate-50/20">
                  <h4 className="text-xs font-bold text-teal-700 uppercase tracking-wider">Medication / Relief Efficacy</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{activeReport.medicationEffectiveness}</p>
                </div>
              </div>

              {/* Suspected Triggers */}
              {activeReport.suspectedTriggers && activeReport.suspectedTriggers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Identified Primary Triggers</h4>
                  <div className="flex flex-wrap gap-2">
                    {activeReport.suspectedTriggers.map((trig, index) => (
                      <span
                        key={index}
                        className="text-xs font-semibold px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-full"
                      >
                        ⚠️ {trig}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {activeReport.recommendations && activeReport.recommendations.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Actionable Lifestyle Recommendations</h4>
                  <ul className="space-y-2">
                    {activeReport.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2.5 text-sm text-slate-600 leading-relaxed">
                        <span className="bg-emerald-100 text-emerald-700 p-0.5 rounded-full shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Disclaimer */}
              <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-400 italic">
                Disclaimer: This tracking report is powered by AI and generated for informational purposes to facilitate physician-patient communication. It does not constitute formal medical diagnosis or prescription. Always consult a qualified medical professional for medication adjustments.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State when no reports */}
      {reports.length === 0 && !loading && (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center max-w-xl mx-auto flex flex-col items-center">
          <BrainCircuit className="w-12 h-12 text-teal-400 mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No Reports Generated Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Once you log at least 3 pain tracker scores, you can trigger the AI correlation engine to generate full analytics.
          </p>
        </div>
      )}
    </div>
  );
};
