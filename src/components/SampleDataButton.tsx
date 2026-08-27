import React from "react";
import { PainRecord } from "../types";
import { Sparkles, RefreshCw } from "lucide-react";

interface SampleDataButtonProps {
  onLoadSamples: (records: PainRecord[]) => void;
}

export const SampleDataButton: React.FC<SampleDataButtonProps> = ({ onLoadSamples }) => {
  const loadClinicalSamples = () => {
    // Generate realistic pain logs over the last 7 days representing a lower-back issue triggered by prolonged sitting
    const sampleRecords: PainRecord[] = [];
    const today = new Date();

    const locations = ["Lower Back", "Shoulders", "Neck", "Right Knee"];
    const triggers = [
      "Prolonged sitting, poor posture",
      "Strenuous physical activity",
      "Lack of sleep, stress",
      "Rainy weather, high humidity"
    ];

    const medications = ["Ibuprofen 400mg", "Acetaminophen 500mg", "Muscle Relaxant", "Cold Compress"];

    for (let i = 9; i >= 0; i--) {
      const logDate = new Date();
      logDate.setDate(today.getDate() - i);
      const dateString = logDate.toISOString().split("T")[0];

      // Morning log (generally lower pain, stiff back)
      sampleRecords.push({
        id: `sample-morning-${i}`,
        date: dateString,
        timeOfDay: "morning",
        painLevel: i % 3 === 0 ? 4 : 3,
        location: "Lower Back",
        notes: "Woke up feeling somewhat stiff. Stretches helped ease the tension.",
        triggers: "Cold morning temperatures",
        medications: "None",
        activityLevel: "low"
      });

      // Afternoon log (higher pain after working at desk)
      sampleRecords.push({
        id: `sample-afternoon-${i}`,
        date: dateString,
        timeOfDay: "afternoon",
        painLevel: i % 2 === 0 ? 6 : 5,
        location: "Lower Back",
        notes: "Sitting at desk for 4 hours. Pain increased significantly near the tailbone.",
        triggers: triggers[0], // Prolonged sitting
        medications: i % 2 === 0 ? medications[0] : "None", // Ibuprofen occasionally
        activityLevel: "low"
      });

      // Evening log (pain decreases after gym or resting, but shoulders get tight)
      sampleRecords.push({
        id: `sample-evening-${i}`,
        date: dateString,
        timeOfDay: "evening",
        painLevel: i % 3 === 0 ? 2 : 3,
        location: "Lower Back",
        notes: "Felt better after a short walk and warm bath. Applied heat pack.",
        triggers: "Fatigue from full day of work",
        medications: "Warm compress",
        activityLevel: "moderate"
      });

      // Occasionally add a custom late night pain record
      if (i % 3 === 1) {
        sampleRecords.push({
          id: `sample-custom-${i}`,
          date: dateString,
          timeOfDay: "custom",
          customTime: "22:15",
          painLevel: 7,
          location: "Lower Back",
          notes: "Sudden sharp muscle spasm while bending to pick up laundry.",
          triggers: "Sudden heavy bending",
          medications: medications[2], // Muscle relaxant
          activityLevel: "high"
        });
      }
    }

    onLoadSamples(sampleRecords);
  };

  return (
    <button
      id="load-sample-data-btn"
      type="button"
      onClick={loadClinicalSamples}
      className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-semibold text-xs tracking-wide uppercase transition-colors duration-200 shadow-sm active:scale-95 cursor-pointer"
    >
      <Sparkles className="w-3.5 h-3.5" />
      Load Sample History
    </button>
  );
};
