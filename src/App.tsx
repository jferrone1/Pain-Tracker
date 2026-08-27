import React, { useState, useEffect } from "react";
import { PainRecord } from "./types";
import { PainLogForm } from "./components/PainLogForm";
import { PainCharts } from "./components/PainCharts";
import { PainHistory } from "./components/PainHistory";
import { PatternReportView } from "./components/PatternReportView";
import { SampleDataButton } from "./components/SampleDataButton";
import { AuthModal } from "./components/AuthModal";
import { ExcelImportModal } from "./components/ExcelImportModal";
import { exportRecordsToExcel } from "./lib/excelImporter";
import { 
  auth, 
  db, 
  onAuthStateChanged, 
  firebaseSignOut, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  writeBatch,
  User 
} from "./lib/firebase";
import { 
  ShieldCheck, 
  HeartPulse, 
  FileSpreadsheet, 
  Cloud, 
  CloudCheck, 
  Download, 
  User as UserIcon,
  Smartphone,
  CheckCircle2
} from "lucide-react";

export default function App() {
  const [records, setRecords] = useState<PainRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "history" | "reports">("dashboard");
  
  // Auth & Cloud Sync State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. Listen to Firebase Authentication State
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Load and Sync Records (LocalStorage + Firestore Real-Time)
  useEffect(() => {
    if (!currentUser) {
      // Fallback to local storage when not signed in
      const saved = localStorage.getItem("pain_tracking_records");
      if (saved) {
        try {
          setRecords(JSON.parse(saved));
        } catch (e) {
          console.error("Error parsing local records:", e);
        }
      }
      return;
    }

    // Signed in: Set up Firestore real-time listener for current user
    setIsSyncing(true);
    const userRecordsRef = collection(db, "users", currentUser.uid, "painRecords");

    const unsubscribeSnapshot = onSnapshot(userRecordsRef, async (snapshot) => {
      const cloudRecords: PainRecord[] = [];
      snapshot.forEach((docSnap) => {
        cloudRecords.push(docSnap.data() as PainRecord);
      });

      // Sort records by date descending
      cloudRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // If user has local records that aren't in Firestore yet, auto-migrate them
      const savedLocal = localStorage.getItem("pain_tracking_records");
      if (savedLocal && snapshot.empty) {
        try {
          const localParsed: PainRecord[] = JSON.parse(savedLocal);
          if (localParsed.length > 0) {
            const batch = writeBatch(db);
            localParsed.forEach((rec) => {
              const recRef = doc(db, "users", currentUser.uid, "painRecords", rec.id);
              batch.set(recRef, rec);
            });
            await batch.commit();
          }
        } catch (err) {
          console.error("Failed to migrate local logs to cloud:", err);
        }
      }

      setRecords(cloudRecords);
      localStorage.setItem("pain_tracking_records", JSON.stringify(cloudRecords));
      setIsSyncing(false);
    }, (error) => {
      console.error("Firestore snapshot error:", error);
      setIsSyncing(false);
    });

    return () => unsubscribeSnapshot();
  }, [currentUser]);

  // Save helper for local & cloud
  const saveRecordToStorageAndCloud = async (newRecord: PainRecord) => {
    if (currentUser) {
      try {
        const docRef = doc(db, "users", currentUser.uid, "painRecords", newRecord.id);
        await setDoc(docRef, newRecord);
      } catch (err) {
        console.error("Failed to sync record to Firestore:", err);
      }
    }
  };

  const handleAddRecord = (record: Omit<PainRecord, "id">) => {
    const newRecord: PainRecord = {
      id: `record-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...record
    };
    const updated = [newRecord, ...records];
    setRecords(updated);
    localStorage.setItem("pain_tracking_records", JSON.stringify(updated));
    saveRecordToStorageAndCloud(newRecord);
  };

  const handleDeleteRecord = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this pain log entry?")) {
      const updated = records.filter((r) => r.id !== id);
      setRecords(updated);
      localStorage.setItem("pain_tracking_records", JSON.stringify(updated));

      if (currentUser) {
        try {
          const docRef = doc(db, "users", currentUser.uid, "painRecords", id);
          await deleteDoc(docRef);
        } catch (err) {
          console.error("Failed to delete record from Firestore:", err);
        }
      }
    }
  };

  const handleLoadSamples = async (sampleRecords: PainRecord[]) => {
    setRecords(sampleRecords);
    localStorage.setItem("pain_tracking_records", JSON.stringify(sampleRecords));

    if (currentUser) {
      try {
        const batch = writeBatch(db);
        sampleRecords.forEach((rec) => {
          const recRef = doc(db, "users", currentUser.uid, "painRecords", rec.id);
          batch.set(recRef, rec);
        });
        await batch.commit();
      } catch (err) {
        console.error("Error pushing sample data to Firestore:", err);
      }
    }
  };

  const handleClearAll = async () => {
    if (window.confirm("Are you sure you want to delete all tracking history? This will clear all logged pain levels.")) {
      if (currentUser) {
        try {
          const batch = writeBatch(db);
          records.forEach((rec) => {
            const recRef = doc(db, "users", currentUser.uid, "painRecords", rec.id);
            batch.delete(recRef);
          });
          await batch.commit();
        } catch (err) {
          console.error("Failed to clear cloud records:", err);
        }
      }

      setRecords([]);
      localStorage.removeItem("pain_tracking_records");
      localStorage.removeItem("pain_pattern_reports");
    }
  };

  const handleImportExcelRecords = async (importedRecords: PainRecord[], mode: "merge" | "replace") => {
    let finalRecords: PainRecord[] = [];
    if (mode === "replace") {
      finalRecords = importedRecords;
      if (currentUser) {
        // Delete previous records
        const batch = writeBatch(db);
        records.forEach((r) => {
          const ref = doc(db, "users", currentUser.uid, "painRecords", r.id);
          batch.delete(ref);
        });
        await batch.commit();
      }
    } else {
      finalRecords = [...importedRecords, ...records];
    }

    setRecords(finalRecords);
    localStorage.setItem("pain_tracking_records", JSON.stringify(finalRecords));

    if (currentUser) {
      try {
        const batch = writeBatch(db);
        importedRecords.forEach((rec) => {
          const ref = doc(db, "users", currentUser.uid, "painRecords", rec.id);
          batch.set(ref, rec);
        });
        await batch.commit();
      } catch (err) {
        console.error("Failed to save imported records to Firestore:", err);
      }
    }
  };

  const handleSignOut = async () => {
    await firebaseSignOut(auth);
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          
          {/* Brand/Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 w-full md:w-auto">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-500 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
              <HeartPulse className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 id="app-title-header" className="text-base sm:text-xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                Pain Level Tracking
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate sm:normal-case">
                Empirical tracking for physical wellness & trend correlations
              </p>
            </div>
          </div>

          {/* Quick Actions, Excel Import & Multi-Device Auth Controls */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            
            {/* Excel / CSV Import & Export Buttons */}
            <button
              type="button"
              onClick={() => setIsExcelModalOpen(true)}
              className="px-3 py-1.5 sm:px-3.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-slate-700 hover:text-teal-700 bg-slate-100/80 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 rounded-full transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
              Import Excel / CSV
            </button>

            {records.length > 0 && (
              <button
                type="button"
                onClick={() => exportRecordsToExcel(records)}
                title="Export logs to Excel file"
                className="px-3 py-1.5 sm:px-3.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-full transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                Export
              </button>
            )}

            {/* Multi-Device Sync / Account Button */}
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 text-[10px] sm:text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                currentUser
                  ? "bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100/70"
                  : "bg-teal-600 text-white hover:bg-teal-700 shadow-xs"
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              {currentUser ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                  {currentUser.displayName || currentUser.email?.split("@")[0] || "Account"}
                </span>
              ) : (
                "Multi-Device Sync"
              )}
            </button>

            <SampleDataButton onLoadSamples={handleLoadSamples} />

            {records.length > 0 && (
              <button
                id="clear-all-data-btn"
                type="button"
                onClick={handleClearAll}
                className="px-3 py-1.5 sm:px-3.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-100 rounded-full transition-all cursor-pointer whitespace-nowrap"
              >
                Clear History
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-8">
        
        {/* Banner Informational Overview & Multi-Device Sync Callout */}
        {records.length === 0 && (
          <div className="bg-teal-50/55 border border-teal-100 p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
            <div className="flex gap-3 items-start text-teal-900">
              <ShieldCheck className="w-6 h-6 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm">Welcome to Pain Level Tracking</h3>
                <p className="text-xs text-teal-800 mt-0.5 leading-relaxed max-w-2xl">
                  Log your morning, afternoon, and evening pain scores to generate comprehensive charts and pattern intelligence reports. You can also **Import data directly from Excel** spreadsheets or sign in to **Sync across phone, tablet, and computer**.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="text-xs text-teal-700 bg-white hover:bg-teal-50 border border-teal-200 font-semibold px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5 text-teal-600" />
                Enable Device Sync
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation - Swipeable / Horizontal Scrolling on Phone */}
        <div className="flex border-b border-slate-200 overflow-x-auto whitespace-nowrap scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            id="tab-dashboard-btn"
            onClick={() => setActiveTab("dashboard")}
            className={`shrink-0 py-2.5 sm:py-3 px-4 sm:px-6 font-semibold text-xs sm:text-sm transition-all border-b-2 -mb-px ${
              activeTab === "dashboard"
                ? "border-teal-500 text-teal-600 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-800"
            }`}
          >
            📊 Analytics & Logs
          </button>
          <button
            id="tab-history-btn"
            onClick={() => setActiveTab("history")}
            className={`shrink-0 py-2.5 sm:py-3 px-4 sm:px-6 font-semibold text-xs sm:text-sm transition-all border-b-2 -mb-px ${
              activeTab === "history"
                ? "border-teal-500 text-teal-600 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-800"
            }`}
          >
            📋 Log History ({records.length})
          </button>
          <button
            id="tab-reports-btn"
            onClick={() => setActiveTab("reports")}
            className={`shrink-0 py-2.5 sm:py-3 px-4 sm:px-6 font-semibold text-xs sm:text-sm transition-all border-b-2 -mb-px ${
              activeTab === "reports"
                ? "border-teal-500 text-teal-600 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-800"
            }`}
          >
            🧠 Pattern Intelligence
          </button>
        </div>

        {/* Tab Content Rendering */}
        <div className="animate-fade-in">
          {activeTab === "dashboard" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Input Form */}
              <div className="lg:col-span-5">
                <PainLogForm onAddRecord={handleAddRecord} />
              </div>

              {/* Right Column: Visualization Charts */}
              <div className="lg:col-span-7">
                <PainCharts records={records} />
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <PainHistory records={records} onDeleteRecord={handleDeleteRecord} />
          )}

          {activeTab === "reports" && (
            <PatternReportView records={records} />
          )}
        </div>
      </main>

      {/* Auth Modal for Account & Multi-Device Sync */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onSignOut={handleSignOut}
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onImportComplete={handleImportExcelRecords}
      />

      {/* Footer Disclaimer */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400 space-y-1">
          <p>Pain Level Tracking applet built for medical journaling & doctor-patient dialogue.</p>
          <p>© 2026 Patient Insights. All tracking metrics are processed safely with optional Cloud Firestore sync.</p>
        </div>
      </footer>
    </div>
  );
}
