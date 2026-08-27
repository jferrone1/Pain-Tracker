import React, { useState, useRef } from "react";
import { X, FileSpreadsheet, Download, Upload, CheckCircle2, AlertCircle, FileUp, Sparkles, ArrowRight } from "lucide-react";
import { PainRecord } from "../types";
import { parseExcelOrCsvFile, ParsedImportResult, exportRecordsToExcel } from "../lib/excelImporter";

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (importedRecords: PainRecord[], mode: "merge" | "replace") => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParsedImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (selectedFile: File) => {
    if (!selectedFile) return;

    const validExts = [".xlsx", ".xls", ".csv"];
    const fileName = selectedFile.name.toLowerCase();
    const isValid = validExts.some((ext) => fileName.endsWith(ext));

    if (!isValid) {
      setError("Please select a valid Excel (.xlsx, .xls) or CSV (.csv) spreadsheet file.");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setLoading(true);

    try {
      const parsed = await parseExcelOrCsvFile(selectedFile);
      setResult(parsed);
    } catch (err: any) {
      setError("Failed to parse spreadsheet file. Please check file format and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadTemplate = () => {
    const sampleRecords: PainRecord[] = [
      {
        id: "sample-1",
        date: new Date().toISOString().split("T")[0],
        timeOfDay: "morning",
        painLevel: 4,
        location: "Lower Back",
        activityLevel: "moderate",
        medications: "Ibuprofen 400mg",
        triggers: "Prolonged sitting",
        notes: "Morning stiffness upon waking"
      },
      {
        id: "sample-2",
        date: new Date().toISOString().split("T")[0],
        timeOfDay: "evening",
        painLevel: 6,
        location: "Neck & Shoulders",
        activityLevel: "high",
        medications: "Warm compress",
        triggers: "Desk posture, screen time",
        notes: "Tightness radiating up neck"
      }
    ];
    exportRecordsToExcel(sampleRecords);
  };

  const handleConfirmImport = () => {
    if (!result || result.records.length === 0) return;
    onImportComplete(result.records, importMode);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-600 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">Import Pain Logs from Excel</h3>
              <p className="text-xs text-slate-500">Upload .xlsx, .xls, or .csv files to import historical records</p>
            </div>
          </div>
          <button
            onClick={() => { handleReset(); onClose(); }}
            className="w-8 h-8 rounded-full hover:bg-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Download Template Banner */}
          <div className="p-4 bg-teal-50/60 border border-teal-100 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-teal-900">Need an Excel spreadsheet template?</p>
              <p className="text-xs text-teal-700/80 mt-0.5">Download our pre-formatted sample spreadsheet with header columns ready for your entries.</p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download Template
            </button>
          </div>

          {!result ? (
            /* Upload Drop Area */
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-teal-500 bg-slate-50/50 hover:bg-teal-50/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              />
              <div className="w-14 h-14 bg-white border border-slate-200 group-hover:border-teal-300 rounded-2xl shadow-xs flex items-center justify-center text-slate-400 group-hover:text-teal-600 group-hover:scale-105 transition-all mb-3">
                <FileUp className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-slate-800">
                Click to browse or drop spreadsheet here
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) files
              </p>

              {loading && (
                <div className="mt-4 flex items-center gap-2 text-teal-600 text-xs font-semibold">
                  <span className="w-3.5 h-3.5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></span>
                  Reading spreadsheet structure...
                </div>
              )}
            </div>
          ) : (
            /* Parsed Preview Section */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 text-emerald-900 text-xs">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Successfully detected {result.records.length} pain log entries from "{file?.name}"
                </div>
                <button
                  onClick={handleReset}
                  className="text-emerald-700 underline font-medium hover:text-emerald-900 cursor-pointer"
                >
                  Change File
                </button>
              </div>

              {/* Data Import Mode Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                  Import Action Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    onClick={() => setImportMode("merge")}
                    className={`p-3.5 border rounded-xl cursor-pointer transition-all flex items-start gap-3 ${
                      importMode === "merge"
                        ? "border-teal-500 bg-teal-50/40 ring-1 ring-teal-500"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === "merge"}
                      onChange={() => setImportMode("merge")}
                      className="mt-0.5 text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Merge with existing logs</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Combine spreadsheet entries with your current history without losing existing data.</p>
                    </div>
                  </label>

                  <label
                    onClick={() => setImportMode("replace")}
                    className={`p-3.5 border rounded-xl cursor-pointer transition-all flex items-start gap-3 ${
                      importMode === "replace"
                        ? "border-amber-500 bg-amber-50/40 ring-1 ring-amber-500"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === "replace"}
                      onChange={() => setImportMode("replace")}
                      className="mt-0.5 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Replace current history</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Overwrite existing local entries with the newly imported spreadsheet records.</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Table Preview */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Sample Log Entries Preview (Showing top 5)
                </p>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Time</th>
                        <th className="py-2 px-3">Pain</th>
                        <th className="py-2 px-3">Location</th>
                        <th className="py-2 px-3">Meds / Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {result.records.slice(0, 5).map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50/80 text-slate-700">
                          <td className="py-2 px-3 font-medium text-slate-900">{r.date}</td>
                          <td className="py-2 px-3 capitalize">{r.timeOfDay === "custom" ? r.customTime || "custom" : r.timeOfDay}</td>
                          <td className="py-2 px-3">
                            <span className="inline-flex items-center justify-center font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                              {r.painLevel} / 10
                            </span>
                          </td>
                          <td className="py-2 px-3">{r.location}</td>
                          <td className="py-2 px-3 truncate max-w-[150px] text-slate-500">{r.medications || r.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => { handleReset(); onClose(); }}
            className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {result && (
            <button
              type="button"
              onClick={handleConfirmImport}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
            >
              Confirm & Import {result.records.length} Entries
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
