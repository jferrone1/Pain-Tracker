import React, { useState } from "react";
import { PainRecord, TimeOfDay } from "../types";
import { Clock, Plus, AlertCircle, Sparkles, Smile, Frown, Meh, SmilePlus } from "lucide-react";

interface PainLogFormProps {
  onAddRecord: (record: Omit<PainRecord, "id">) => void;
}

const COMMON_LOCATIONS = [
  "Lower Back",
  "Head / Migraine",
  "Neck",
  "Shoulders",
  "Knees",
  "Right Hip",
  "Left Hip",
  "Wrists / Hands",
  "Ankles / Feet",
  "Abdomen"
];

const COMMON_TRIGGERS = [
  "Prolonged sitting",
  "Poor posture",
  "Heavy lifting",
  "Stress",
  "Lack of sleep",
  "Dehydration",
  "Weather changes",
  "High sodium/sugar",
  "Strenuous workout",
  "Prolonged screen time"
];

const COMMON_MEDS = [
  "None",
  "Ibuprofen",
  "Acetaminophen",
  "Naproxen",
  "Aspirin",
  "Prescribed Muscle Relaxant",
  "Heat Pack / Warm Bath",
  "Ice Pack",
  "CBD / Topical Cream"
];

const getCurrentTimeHHMM = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const getTimeOfDayFromTime = (timeStr: string): TimeOfDay => {
  if (!timeStr) return "custom";
  const [hoursStr] = timeStr.split(":");
  const hour = parseInt(hoursStr, 10);
  if (isNaN(hour)) return "custom";
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "custom"; // 22:00 to 04:59 maps to "custom"
};

export const PainLogForm: React.FC<PainLogFormProps> = ({ onAddRecord }) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [customTime, setCustomTime] = useState<string>(getCurrentTimeHHMM());
  const [painLevel, setPainLevel] = useState<number>(3);
  const [location, setLocation] = useState<string>("Lower Back");
  const [customLocation, setCustomLocation] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [triggers, setTriggers] = useState<string>("");
  const [medications, setMedications] = useState<string>("");
  const [activityLevel, setActivityLevel] = useState<'low' | 'moderate' | 'high'>("low");

  const [notification, setNotification] = useState<string | null>(null);

  const getPainColor = (level: number) => {
    if (level === 0) return "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200";
    if (level <= 3) return "bg-green-100 text-green-800 border-green-300 hover:bg-green-200";
    if (level <= 6) return "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200";
    if (level <= 8) return "bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200";
    return "bg-red-100 text-red-800 border-red-300 hover:bg-red-200";
  };

  const getPainFace = (level: number) => {
    if (level === 0) return <Smile className="w-6 h-6 text-emerald-600" />;
    if (level <= 3) return <SmilePlus className="w-6 h-6 text-green-600" />;
    if (level <= 6) return <Meh className="w-6 h-6 text-amber-600" />;
    if (level <= 8) return <Frown className="w-6 h-6 text-orange-600" />;
    return <Frown className="w-6 h-6 text-red-600 animate-pulse" />;
  };

  const getPainDescription = (level: number) => {
    if (level === 0) return "No Pain";
    if (level <= 2) return "Mild - easily ignored";
    if (level <= 4) return "Moderate - can be ignored but distracting";
    if (level <= 6) return "Distressing - interferes with some activities";
    if (level <= 8) return "Severe - majorly limits focus and activity";
    return "Worst possible pain - debilitating";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedLocation = location === "Custom" ? customLocation.trim() : location;
    if (!selectedLocation) {
      alert("Please specify the location of the pain.");
      return;
    }

    const inferredTimeOfDay = getTimeOfDayFromTime(customTime);

    onAddRecord({
      date,
      timeOfDay: inferredTimeOfDay,
      customTime,
      painLevel,
      location: selectedLocation,
      notes: notes.trim(),
      triggers: triggers.trim(),
      medications: medications.trim(),
      activityLevel
    });

    // Reset some form fields but keep Date & Location for easy repeated logging
    setNotes("");
    setTriggers("");
    setMedications("");
    setNotification("Log added successfully!");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleQuickTriggerSelect = (trigger: string) => {
    setTriggers((prev) => {
      if (!prev) return trigger;
      if (prev.toLowerCase().includes(trigger.toLowerCase())) return prev;
      return `${prev}, ${trigger}`;
    });
  };

  const handleQuickMedSelect = (med: string) => {
    if (med === "None") {
      setMedications("None");
      return;
    }
    setMedications((prev) => {
      if (!prev || prev === "None") return med;
      if (prev.toLowerCase().includes(med.toLowerCase())) return prev;
      return `${prev}, ${med}`;
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-500" />
            Log New Pain Entry
          </h2>
          <p className="text-sm text-slate-400">Record your current status, medication, and triggers.</p>
        </div>
      </div>

      {notification && (
        <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-sm rounded-xl border border-emerald-200 flex items-center gap-2 animate-fade-in">
          <Smile className="w-4 h-4 text-emerald-600" />
          {notification}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date & Time Select */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Date of Entry
            </label>
            <input
              id="log-date-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex justify-between items-center">
              <span>Time of Entry</span>
              <span className="text-[10px] text-slate-400 normal-case font-normal">Defaults to current time</span>
            </label>
            <input
              id="log-time-input"
              type="time"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white font-mono"
              required
            />
          </div>
        </div>

        {/* Pain Level 0-10 Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Pain Score: <span className="text-lg font-bold text-slate-900 ml-1">{painLevel}/10</span>
            </label>
            <span className="text-xs text-slate-500 font-medium">0 is no pain, 10 is severe</span>
          </div>

          {/* Interactive slider/visual nodes */}
          <div className="space-y-4">
            <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5">
              {Array.from({ length: 11 }).map((_, index) => {
                const isActive = painLevel === index;
                let activeStyle = "";
                if (isActive) {
                  if (index === 0) activeStyle = "bg-emerald-500 text-white border-emerald-600 scale-105 sm:scale-110";
                  else if (index <= 3) activeStyle = "bg-green-500 text-white border-green-600 scale-105 sm:scale-110";
                  else if (index <= 6) activeStyle = "bg-amber-500 text-white border-amber-600 scale-105 sm:scale-110";
                  else if (index <= 8) activeStyle = "bg-orange-500 text-white border-orange-600 scale-105 sm:scale-110";
                  else activeStyle = "bg-red-500 text-white border-red-600 scale-105 sm:scale-110 animate-pulse";
                } else {
                  activeStyle = "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200";
                }

                return (
                  <button
                    id={`pain-level-${index}-btn`}
                    key={index}
                    type="button"
                    onClick={() => setPainLevel(index)}
                    className={`h-11 sm:h-12 border rounded-xl font-semibold text-sm transition-all duration-150 flex items-center justify-center cursor-pointer ${activeStyle}`}
                  >
                    {index}
                  </button>
                );
              })}
            </div>

            {/* Scale visual readout */}
            <div className={`p-3.5 border rounded-xl flex items-center gap-3 transition-colors duration-200 ${getPainColor(painLevel)}`}>
              {getPainFace(painLevel)}
              <div>
                <p className="text-sm font-semibold">{getPainDescription(painLevel)}</p>
                <p className="text-xs opacity-85">Pain severity score is saved as {painLevel} out of 10.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pain Location & Activity Level */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Body Location
            </label>
            <select
              id="pain-location-select"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
            >
              {COMMON_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
              <option value="Custom">Custom / Other Location...</option>
            </select>

            {location === "Custom" && (
              <input
                id="custom-location-input"
                type="text"
                placeholder="Enter custom location (e.g. Upper back, wrist)"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                className="mt-2 w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
                required
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Activity Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["low", "moderate", "high"] as const).map((level) => (
                <button
                  id={`activity-${level}-btn`}
                  key={level}
                  type="button"
                  onClick={() => setActivityLevel(level)}
                  className={`py-2 text-sm font-semibold border rounded-full capitalize transition-all duration-150 cursor-pointer ${
                    activityLevel === level
                      ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                      : "bg-white hover:bg-slate-50 text-slate-500 border-slate-200"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Triggers Tag Selector & Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Triggers & Influencing Factors
          </label>
          <input
            id="triggers-input"
            type="text"
            placeholder="e.g. Prolonged desk sitting, cold weather, poor sleep..."
            value={triggers}
            onChange={(e) => setTriggers(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm mb-2 bg-white"
          />
          <div className="flex flex-wrap gap-1.5">
            {COMMON_TRIGGERS.slice(0, 6).map((trig) => (
              <button
                id={`quick-trigger-${trig.replace(/\s+/g, '-').toLowerCase()}`}
                key={trig}
                type="button"
                onClick={() => handleQuickTriggerSelect(trig)}
                className="text-xs px-2.5 py-1 bg-slate-50 hover:bg-teal-50 text-slate-500 hover:text-teal-600 border border-slate-200 hover:border-teal-200 rounded-full transition-colors cursor-pointer"
              >
                + {trig}
              </button>
            ))}
          </div>
        </div>

        {/* Medications Select & Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Medications or Relief Used
          </label>
          <input
            id="medications-input"
            type="text"
            placeholder="e.g. Ibuprofen 400mg, Hot bath, none..."
            value={medications}
            onChange={(e) => setMedications(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm mb-2 bg-white"
          />
          <div className="flex flex-wrap gap-1.5">
            {COMMON_MEDS.slice(0, 6).map((med) => (
              <button
                id={`quick-med-${med.replace(/\s+/g, '-').toLowerCase()}`}
                key={med}
                type="button"
                onClick={() => handleQuickMedSelect(med)}
                className="text-xs px-2.5 py-1 bg-slate-50 hover:bg-teal-50 text-slate-500 hover:text-teal-600 border border-slate-200 hover:border-teal-200 rounded-full transition-colors cursor-pointer"
              >
                + {med}
              </button>
            ))}
          </div>
        </div>

        {/* General Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Notes & Comments
          </label>
          <textarea
            id="notes-textarea"
            rows={3}
            placeholder="Provide detail on pain sensation (throbbing, aching), symptoms, mental well-being, or relief duration..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm resize-none bg-white"
          />
        </div>

        {/* Submit */}
        <button
          id="submit-log-btn"
          type="submit"
          className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-semibold tracking-wide transition-all duration-150 shadow-sm flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Save Pain Log Entry
        </button>
      </form>
    </div>
  );
};
