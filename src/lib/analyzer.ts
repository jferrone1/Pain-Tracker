import { PainRecord, PatternReport } from "../types";

export function analyzePainPatterns(records: PainRecord[]): Omit<PatternReport, "id" | "createdAt"> {
  if (records.length === 0) {
    return {
      summary: "No pain logs available for analysis.",
      suspectedTriggers: [],
      timeOfDayPatterns: "N/A",
      medicationEffectiveness: "N/A",
      recommendations: []
    };
  }

  const count = records.length;

  // 1. Calculate general averages
  const totalPain = records.reduce((sum, r) => sum + r.painLevel, 0);
  const averagePain = parseFloat((totalPain / count).toFixed(1));

  // 2. Trend direction (compare chronologically first half vs second half)
  const sortedByDate = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const halfIndex = Math.ceil(sortedByDate.length / 2);
  const firstHalf = sortedByDate.slice(0, halfIndex);
  const secondHalf = sortedByDate.slice(halfIndex);

  const avgFirstHalf = firstHalf.reduce((sum, r) => sum + r.painLevel, 0) / firstHalf.length;
  const avgSecondHalf = secondHalf.length > 0 
    ? secondHalf.reduce((sum, r) => sum + r.painLevel, 0) / secondHalf.length 
    : avgFirstHalf;

  let trendDirection = "stable";
  if (avgSecondHalf - avgFirstHalf > 0.7) {
    trendDirection = "gradually increasing";
  } else if (avgFirstHalf - avgSecondHalf > 0.7) {
    trendDirection = "gradually decreasing";
  }

  // 3. Location / Hotspot analysis
  const locationCounts: { [key: string]: { count: number; totalPain: number } } = {};
  records.forEach((r) => {
    const loc = r.location || "General";
    if (!locationCounts[loc]) {
      locationCounts[loc] = { count: 0, totalPain: 0 };
    }
    locationCounts[loc].count += 1;
    locationCounts[loc].totalPain += r.painLevel;
  });

  let topLocation = "General";
  let maxLocCount = 0;
  Object.entries(locationCounts).forEach(([loc, data]) => {
    if (data.count > maxLocCount) {
      maxLocCount = data.count;
      topLocation = loc;
    }
  });

  const topLocationAvg = locationCounts[topLocation]
    ? parseFloat((locationCounts[topLocation].totalPain / locationCounts[topLocation].count).toFixed(1))
    : averagePain;

  // 4. Activity level correlation
  const activityAverages = {
    low: { count: 0, sum: 0 },
    moderate: { count: 0, sum: 0 },
    high: { count: 0, sum: 0 }
  };

  records.forEach((r) => {
    if (r.activityLevel in activityAverages) {
      activityAverages[r.activityLevel].count += 1;
      activityAverages[r.activityLevel].sum += r.painLevel;
    }
  });

  const lowActAvg = activityAverages.low.count > 0 ? (activityAverages.low.sum / activityAverages.low.count) : null;
  const highActAvg = activityAverages.high.count > 0 ? (activityAverages.high.sum / activityAverages.high.count) : null;

  let activityCorrelation = "stable / non-linear";
  if (highActAvg !== null && lowActAvg !== null) {
    if (highActAvg - lowActAvg > 1.2) {
      activityCorrelation = "strong positive (higher activity correlates with elevated pain)";
    } else if (lowActAvg - highActAvg > 1.2) {
      activityCorrelation = "negative (higher activity correlates with lower pain levels, suggesting benefits of movement)";
    }
  }

  // 5. Time of Day Analysis
  const timeOfDayAverages = {
    morning: { count: 0, sum: 0 },
    afternoon: { count: 0, sum: 0 },
    evening: { count: 0, sum: 0 },
    custom: { count: 0, sum: 0 }
  };

  records.forEach((r) => {
    const tod = r.timeOfDay || "custom";
    if (tod in timeOfDayAverages) {
      timeOfDayAverages[tod].count += 1;
      timeOfDayAverages[tod].sum += r.painLevel;
    }
  });

  const morningAvg = timeOfDayAverages.morning.count > 0 ? parseFloat((timeOfDayAverages.morning.sum / timeOfDayAverages.morning.count).toFixed(1)) : 0;
  const afternoonAvg = timeOfDayAverages.afternoon.count > 0 ? parseFloat((timeOfDayAverages.afternoon.sum / timeOfDayAverages.afternoon.count).toFixed(1)) : 0;
  const eveningAvg = timeOfDayAverages.evening.count > 0 ? parseFloat((timeOfDayAverages.evening.sum / timeOfDayAverages.evening.count).toFixed(1)) : 0;
  const customAvg = timeOfDayAverages.custom.count > 0 ? parseFloat((timeOfDayAverages.custom.sum / timeOfDayAverages.custom.count).toFixed(1)) : 0;

  let peakTimeOfDay: "morning" | "afternoon" | "evening" | "custom" = "morning";
  let maxTodAvg = morningAvg;
  if (afternoonAvg > maxTodAvg) { maxTodAvg = afternoonAvg; peakTimeOfDay = "afternoon"; }
  if (eveningAvg > maxTodAvg) { maxTodAvg = eveningAvg; peakTimeOfDay = "evening"; }
  if (customAvg > maxTodAvg) { maxTodAvg = customAvg; peakTimeOfDay = "custom"; }

  let timeOfDayClue = "";
  if (peakTimeOfDay === "morning") {
    timeOfDayClue = "morning hours. This pattern is commonly seen with inflammatory conditions, sleeping posture challenges, or morning joint stiffness after prolonged immobility.";
  } else if (peakTimeOfDay === "afternoon") {
    timeOfDayClue = "afternoon hours. This midday peak is often associated with physical exertion, prolonged desk sitting posture strain, or work-related muscle tension.";
  } else if (peakTimeOfDay === "evening") {
    timeOfDayClue = "evening hours. This pattern usually correlates with cumulative daily physical fatigue, stress buildup, or the gradual wearing off of early-day therapies.";
  } else {
    timeOfDayClue = "irregular or custom intervals. This suggests spontaneous pain flares that may be triggered by specific external events or variable physical fatigue.";
  }

  // 6. Medication Analysis
  const medRecords = records.filter(r => r.medications && r.medications.trim() !== "");
  const noMedRecords = records.filter(r => !r.medications || r.medications.trim() === "");

  const medAvg = medRecords.length > 0 ? parseFloat((medRecords.reduce((sum, r) => sum + r.painLevel, 0) / medRecords.length).toFixed(1)) : 0;
  const noMedAvg = noMedRecords.length > 0 ? parseFloat((noMedRecords.reduce((sum, r) => sum + r.painLevel, 0) / noMedRecords.length).toFixed(1)) : 0;

  const medList = Array.from(new Set(medRecords.map(r => r.medications.trim()).filter(Boolean))).slice(0, 3).join(", ");

  let medicationEffectiveness = "";
  if (medRecords.length > 0) {
    const diff = noMedAvg - medAvg;
    if (diff >= 1.5) {
      medicationEffectiveness = `Logs containing active therapies (e.g., ${medList}) show a highly positive clinical correlation, with average discomfort dropping to ${medAvg}/10 compared to ${noMedAvg}/10 on entries without medication—representing a significant discomfort reduction.`;
    } else if (diff >= 0.5) {
      medicationEffectiveness = `Therapies logged (including ${medList}) show moderate correlation, with an average pain level of ${medAvg}/10 versus ${noMedAvg}/10 when empty. This suggests a helpful baseline response to your active relief routines.`;
    } else {
      medicationEffectiveness = `Therapies logged (including ${medList}) show a stable average score of ${medAvg}/10 (compared to ${noMedAvg}/10 when empty). This suggests that your current relief applications are supporting stability, though individual therapeutic timing or choices may be adjusted under medical guidance.`;
    }
  } else {
    medicationEffectiveness = "No medication or relief therapies were logged during this period. Tracking the application of hot/cold therapies, stretching, or medications will allow the engine to map your personal relief efficacy.";
  }

  // 7. Parse triggers
  const uniqueTriggers = new Set<string>();
  records.forEach((r) => {
    if (r.triggers && r.triggers.trim() !== "") {
      r.triggers.split(",").forEach((t) => {
        const cleaned = t.trim().toLowerCase();
        if (cleaned) {
          // Capitalize first letter
          uniqueTriggers.add(cleaned.charAt(0).toUpperCase() + cleaned.slice(1));
        }
      });
    }
  });

  // Suspected Triggers list
  let suspectedTriggers = Array.from(uniqueTriggers).slice(0, 4);
  if (suspectedTriggers.length === 0) {
    // Dynamically suspect triggers based on location or peak times
    if (peakTimeOfDay === "morning") {
      suspectedTriggers.push("Sleeping posture / mattress support");
      suspectedTriggers.push("Prolonged morning static stiffness");
    } else if (peakTimeOfDay === "evening") {
      suspectedTriggers.push("Cumulative physical or postural fatigue");
      suspectedTriggers.push("End-of-day stress accumulation");
    } else {
      suspectedTriggers.push("Prolonged sitting or inactive desk periods");
      suspectedTriggers.push("Sudden atmospheric or activity transitions");
    }
  }

  // 8. Generate dynamic recommendations based on locations and triggers
  const recommendations: string[] = [];
  const lowerCaseLoc = topLocation.toLowerCase();

  if (lowerCaseLoc.includes("back") || lowerCaseLoc.includes("lumbar") || lowerCaseLoc.includes("spine")) {
    recommendations.push("Engage in gentle, low-impact lumbar stabilization exercises (e.g., pelvic tilts, bird-dog poses) twice daily to build core support.");
    recommendations.push("Avoid static seated positions exceeding 45 minutes; set a regular tactile reminder to stand, extend your hips, and walk for 2 minutes.");
  } else if (lowerCaseLoc.includes("neck") || lowerCaseLoc.includes("shoulder") || lowerCaseLoc.includes("cervical")) {
    recommendations.push("Incorporate gentle neck retractions (chin tucks) and scapular squeezes (shoulder blade retraction) to counteract forward-head posture.");
    recommendations.push("Evaluate your computer workstation ergonomics, ensuring the monitor's top third is directly at eye level and forearms are supported.");
  } else if (lowerCaseLoc.includes("head") || lowerCaseLoc.includes("temple") || lowerCaseLoc.includes("migraine")) {
    recommendations.push("Maintain strict, consistent hydration (aiming for 2.5 to 3 liters of water spread evenly throughout the day).");
    recommendations.push("Incorporate structured visual rests (the 20-20-20 rule) to avoid screen strain, and limit high-sodium or preserved foods during high-risk windows.");
  } else if (lowerCaseLoc.includes("knee") || lowerCaseLoc.includes("hip") || lowerCaseLoc.includes("joint") || lowerCaseLoc.includes("leg")) {
    recommendations.push("Focus on non-weight-bearing joint mobilizations (e.g., seated leg extensions, gentle cycling) to promote lubricating synovial fluid release.");
    recommendations.push("Apply a warming compress for 10 minutes prior to movement to relax supporting musculature, and use cold therapy post-activity if joint swelling occurs.");
  } else {
    recommendations.push("Engage in 15-20 minutes of daily low-impact movement (such as walking, water therapy, or gentle stretching) to naturally elevate endorphins.");
    recommendations.push("Integrate 5 minutes of diaphragmatic breathing twice daily to down-regulate sympathetic nervous system excitability.");
  }

  // Add general sleep and logging recommendations
  recommendations.push("Establish a wind-down pre-sleep routine (avoiding digital blue light for 60 minutes before bed) to maximize deep, restorative sleep phases.");
  recommendations.push("Continue logging consistently alongside specific notes on physical activity intensity to further isolate individual triggers.");

  // 9. Build comprehensive summary text
  const activityPart = lowActAvg !== null && highActAvg !== null
    ? ` Analytical trends show that entries with low physical activity average ${lowActAvg}/10, while high activity entries average ${highActAvg}/10, indicating a ${activityCorrelation}.`
    : "";

  const summary = `Based on an analytical review of your last ${count} pain entries, your average pain score is ${averagePain}/10, with primary concentration observed in the ${topLocation} region (averaging ${topLocationAvg}/10). Chronologically, your logged pain levels over this tracking span show a ${trendDirection} trend.${activityPart} This data provides an objective, empirical baseline of your symptoms to help guide your clinical wellness plans.`;

  return {
    summary,
    suspectedTriggers,
    timeOfDayPatterns: `Your peak discomfort levels tend to emerge during the ${peakTimeOfDay} hours. Specifically, morning logs average ${morningAvg}/10, afternoon logs average ${afternoonAvg}/10, and evening logs average ${eveningAvg}/10. This indicates a correlation with the ${timeOfDayClue}`,
    medicationEffectiveness,
    recommendations
  };
}
