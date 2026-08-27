import * as XLSX from "xlsx";
import { PainRecord } from "../types";

export interface ParsedImportResult {
  records: PainRecord[];
  totalRowsParsed: number;
  skippedRows: number;
  errors: string[];
}

export function parseExcelOrCsvFile(file: File): Promise<ParsedImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        // Get first worksheet
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          return resolve({ records: [], totalRowsParsed: 0, skippedRows: 0, errors: ["Spreadsheet contains no sheets."] });
        }

        const worksheet = workbook.Sheets[sheetName];
        const jsonRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (jsonRows.length === 0) {
          return resolve({ records: [], totalRowsParsed: 0, skippedRows: 0, errors: ["No data rows found in spreadsheet."] });
        }

        const parsedRecords: PainRecord[] = [];
        const errors: string[] = [];
        let skippedCount = 0;

        jsonRows.forEach((row, idx) => {
          const rowNum = idx + 2; // 1-indexed + header row

          // Normalize keys for case-insensitive flexible header matching
          const normalizedRow: Record<string, any> = {};
          Object.keys(row).forEach((k) => {
            const cleanKey = k.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
            normalizedRow[cleanKey] = row[k];
          });

          // Helper to pick first matching column value
          const getValue = (...keys: string[]): any => {
            for (const k of keys) {
              if (normalizedRow[k] !== undefined && normalizedRow[k] !== null && String(normalizedRow[k]).trim() !== "") {
                return String(normalizedRow[k]).trim();
              }
            }
            return "";
          };

          // 1. Date
          let rawDate = getValue("date", "logdate", "timestamp", "datetime", "createdat", "day");
          let formattedDate = new Date().toISOString().split("T")[0];

          if (rawDate) {
            // Check if rawDate is Excel serial number
            if (!isNaN(Number(rawDate)) && Number(rawDate) > 30000) {
              const excelDate = XLSX.SSF.parse_date_code(Number(rawDate));
              if (excelDate) {
                const yyyy = excelDate.y;
                const mm = String(excelDate.m).padStart(2, "0");
                const dd = String(excelDate.d).padStart(2, "0");
                formattedDate = `${yyyy}-${mm}-${dd}`;
              }
            } else {
              const d = new Date(rawDate);
              if (!isNaN(d.getTime())) {
                formattedDate = d.toISOString().split("T")[0];
              }
            }
          }

          // 2. Pain Level (0 to 10)
          const rawPain = getValue("painlevel", "pain", "discomfort", "severity", "level", "score", "painscore");
          let painLevel = 5; // default fallback
          if (rawPain !== "") {
            const num = parseFloat(rawPain);
            if (!isNaN(num)) {
              painLevel = Math.max(0, Math.min(10, Math.round(num)));
            }
          }

          // 3. Location
          const location = getValue("location", "bodypart", "area", "hotspot", "bodylocation", "region", "site") || "General";

          // 4. Time of Day
          const rawTod = getValue("timeofday", "time", "period", "tod", "session").toLowerCase();
          let timeOfDay: PainRecord["timeOfDay"] = "morning";
          let customTime = "";

          if (rawTod.includes("morn")) timeOfDay = "morning";
          else if (rawTod.includes("aft")) timeOfDay = "afternoon";
          else if (rawTod.includes("eve") || rawTod.includes("night")) timeOfDay = "evening";
          else if (rawTod.includes("cust") || rawTod.includes(":") || rawTod.includes("pm") || rawTod.includes("am")) {
            timeOfDay = "custom";
            customTime = rawTod;
          }

          // 5. Activity Level
          const rawAct = getValue("activitylevel", "activity", "exertion", "movement").toLowerCase();
          let activityLevel: PainRecord["activityLevel"] = "moderate";
          if (rawAct.includes("low") || rawAct.includes("rest") || rawAct.includes("sedentary")) activityLevel = "low";
          else if (rawAct.includes("high") || rawAct.includes("intense") || rawAct.includes("strenuous") || rawAct.includes("heavy")) activityLevel = "high";

          // 6. Notes, Medications, Triggers
          const notes = getValue("notes", "comment", "comments", "description", "details");
          const medications = getValue("medications", "medication", "meds", "treatment", "relief");
          const triggers = getValue("triggers", "trigger", "cause", "causes", "factors");

          parsedRecords.push({
            id: `imported-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
            date: formattedDate,
            timeOfDay,
            customTime: customTime || undefined,
            painLevel,
            location,
            notes: notes || undefined,
            medications: medications || undefined,
            triggers: triggers || undefined,
            activityLevel
          });
        });

        resolve({
          records: parsedRecords,
          totalRowsParsed: jsonRows.length,
          skippedRows: skippedCount,
          errors
        });

      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read the file."));
    reader.readAsArrayBuffer(file);
  });
}

export function exportRecordsToExcel(records: PainRecord[]) {
  const exportData = records.map((r) => ({
    "Date": r.date,
    "Time of Day": r.timeOfDay === "custom" && r.customTime ? `Custom (${r.customTime})` : r.timeOfDay,
    "Pain Level (0-10)": r.painLevel,
    "Body Location": r.location,
    "Activity Level": r.activityLevel,
    "Medications / Therapies": r.medications || "",
    "Triggers": r.triggers || "",
    "Notes": r.notes || ""
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Pain Tracker Logs");

  // Auto-fit column widths
  const colWidths = [
    { wch: 12 }, // Date
    { wch: 16 }, // Time of Day
    { wch: 18 }, // Pain Level
    { wch: 18 }, // Body Location
    { wch: 15 }, // Activity Level
    { wch: 25 }, // Medications
    { wch: 25 }, // Triggers
    { wch: 35 }  // Notes
  ];
  worksheet["!cols"] = colWidths;

  const dateStr = new Date().toISOString().split("T")[0];
  XLSX.writeFile(workbook, `Pain_Tracker_Export_${dateStr}.xlsx`);
}
