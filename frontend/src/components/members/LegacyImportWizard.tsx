"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { stageImport, commitImport, type LegacyImportPreview } from "@/lib/api-client";

interface LegacyImportWizardProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const systemFields = [
  { key: "memberNumber", label: "Member Number", required: true },
  { key: "firstName", label: "First Name", required: true },
  { key: "lastName", label: "Last Name", required: true },
  { key: "middleName", label: "Middle Name", required: false },
  { key: "phone", label: "Phone Number", required: false },
  { key: "email", label: "Email Address", required: false },
  { key: "dateOfBirth", label: "Date of Birth", required: false },
  { key: "nationalId", label: "National ID / Number", required: false },
  { key: "idType", label: "ID Type", required: false },
  { key: "status", label: "Status (pending/active/inactive)", required: false },
  { key: "joinedAt", label: "Joined Date", required: false },
];

export const LegacyImportWizard: React.FC<LegacyImportWizardProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [fileName, setFileName] = useState<string>("");
  const [csvContent, setCsvContent] = useState<string>("");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [preview, setPreview] = useState<LegacyImportPreview | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [isCommitting, setIsCommitting] = useState<boolean>(false);
  const [commitResult, setCommitResult] = useState<{ importedRows: number } | null>(null);

  const parseHeaders = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result.filter((h) => h !== "");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l !== "");
      if (lines.length === 0) {
        setErrorMsg("The selected file is empty.");
        return;
      }
      const headers = parseHeaders(lines[0] || "");
      setCsvHeaders(headers);

      // Auto-map headers
      const initialMappings: Record<string, string> = {};
      systemFields.forEach((field) => {
        const match = headers.find(
          (h) =>
            h.toLowerCase() === field.label.toLowerCase() ||
            h.toLowerCase() === field.key.toLowerCase() ||
            h.toLowerCase().replace(/[\s_-]+/g, "") === field.key.toLowerCase()
        );
        if (match) {
          initialMappings[field.key] = match;
        } else {
          initialMappings[field.key] = "";
        }
      });
      setMappings(initialMappings);
      setStep(2);
    };
    reader.readAsText(file);
  };

  const handleMappingChange = (fieldKey: string, headerName: string) => {
    setMappings((prev) => ({ ...prev, [fieldKey]: headerName }));
  };

  const handleValidate = async () => {
    // Check if required fields are mapped
    const unmappedRequired = systemFields
      .filter((f) => f.required)
      .filter((f) => !mappings[f.key]);

    if (unmappedRequired.length > 0) {
      setErrorMsg(
        `Please map all required fields: ${unmappedRequired.map((f) => f.label).join(", ")}`
      );
      return;
    }

    setIsValidating(true);
    setErrorMsg(null);

    try {
      // Filter out empty mappings
      const activeMappings: Record<string, string> = {};
      Object.entries(mappings).forEach(([k, v]) => {
        if (v) activeMappings[k] = v;
      });

      const res = await stageImport(csvContent, activeMappings);
      setPreview(res);
      setStep(3);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to validate legacy data.";
      setErrorMsg(msg);
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirmCommit = async () => {
    if (!preview?.stagingId) return;

    setIsCommitting(true);
    setErrorMsg(null);

    try {
      const result = await commitImport(preview.stagingId);
      setCommitResult({ importedRows: result.importedRows });
      setStep(4);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to commit members.";
      setErrorMsg(msg);
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
      {/* Wizard Header Progress Bar */}
      <div className="bg-slate-50 border-b border-slate-200/80 px-8 py-5 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-800">
          Legacy Onboarding Wizard
        </span>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div
                className={`w-7 height-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === stepNum
                    ? "bg-midnight text-gold shadow-sm scale-110"
                    : step > stepNum
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
                style={{ width: "28px", height: "28px" }}
              >
                {step > stepNum ? "✓" : stepNum}
              </div>
              {stepNum < 4 && (
                <div
                  className={`w-12 h-0.5 mx-1 transition-all ${
                    step > stepNum ? "bg-emerald-500" : "bg-slate-250"
                  }`}
                  style={{ width: "40px", height: "2px" }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-8">
        {errorMsg && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-lg font-medium">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Step 1: Upload File */}
        {step === 1 && (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-12 hover:border-gold transition-colors bg-slate-50/50">
            <div className="bg-amber-50 text-gold rounded-full p-4 mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Upload Legacy Database File
            </h3>
            <p className="text-xs text-slate-400 text-center max-w-sm mb-6">
              Please choose a comma-separated values (.csv) text file from your system containing member records.
            </p>
            <input
              type="file"
              accept=".csv"
              id="csv-file-upload"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onCancel}
                className="font-semibold text-slate-600 border-slate-200"
              >
                Cancel
              </Button>
              <Button
                onClick={() => document.getElementById("csv-file-upload")?.click()}
                className="bg-midnight hover:bg-midnight/90 text-gold font-bold px-6"
              >
                Select CSV File
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Mapping columns */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Map Legacy Columns
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Link columns from your legacy file <span className="font-semibold text-slate-600">({fileName})</span> to target system fields.
              </p>
            </div>

            <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/80">
                  <tr>
                    <th className="px-5 py-3.5">Target Field</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">CSV Column Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {systemFields.map((field) => (
                    <tr key={field.key} className="hover:bg-slate-50/50">
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {field.label}
                      </td>
                      <td className="px-5 py-4">
                        {field.required ? (
                          <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">
                            Required
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-505 border border-slate-200 px-2 py-0.5 rounded text-slate-450">
                            Optional
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={mappings[field.key] || ""}
                          onChange={(e) => handleMappingChange(field.key, e.target.value)}
                          className="w-full max-w-md px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-750 bg-white outline-none focus:border-gold"
                        >
                          <option value="">-- Ignore Field --</option>
                          {csvHeaders.map((header) => (
                            <option key={header} value={header}>
                              {header}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                disabled={isValidating}
                className="text-slate-600 border-slate-200"
              >
                Back
              </Button>
              <Button
                onClick={handleValidate}
                disabled={isValidating}
                className="bg-midnight hover:bg-midnight/90 text-gold font-bold px-6"
              >
                {isValidating ? "Validating Rows..." : "Validate Data →"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Staging / Validation Preview */}
        {step === 3 && preview && (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Validation Summary
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Preview your import database validation results before committing.
              </p>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 shadow-sm text-center">
                <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-1">
                  Total File Rows
                </span>
                <span className="text-2xl font-bold text-slate-800">
                  {preview.totalRows}
                </span>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-5 shadow-sm text-center">
                <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600 mb-1">
                  Valid Rows to Import
                </span>
                <span className="text-2xl font-bold text-emerald-700">
                  {preview.validRows}
                </span>
              </div>
              <div className={`rounded-xl p-5 shadow-sm text-center border ${
                preview.errors.length > 0
                  ? "bg-rose-50/50 border-rose-200"
                  : "bg-slate-50 border-slate-200/80"
              }`}>
                <span className={`block text-[10px] font-bold uppercase tracking-[0.14em] mb-1 ${
                  preview.errors.length > 0 ? "text-rose-600" : "text-slate-400"
                }`}>
                  Failed Row Checks
                </span>
                <span className={`text-2xl font-bold ${
                  preview.errors.length > 0 ? "text-rose-700" : "text-slate-800"
                }`}>
                  {preview.errors.length}
                </span>
              </div>
            </div>

            {/* Row Errors */}
            {preview.errors.length > 0 && (
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-rose-600 border-b border-rose-100 pb-2">
                  Validation Errors Detail
                </h4>
                <div className="border border-rose-100 rounded-xl overflow-hidden max-h-60 overflow-y-auto shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-rose-50/50 text-[10px] font-bold uppercase tracking-wider text-rose-750 border-b border-rose-100">
                      <tr>
                        <th className="px-4 py-3">CSV Row</th>
                        <th className="px-4 py-3">Mapped Column</th>
                        <th className="px-4 py-3">Failure Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-50 text-slate-700">
                      {preview.errors.map((err, idx) => (
                        <tr key={idx} className="hover:bg-rose-50/20">
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {err.row}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-600">
                            {err.column || "-"}
                          </td>
                          <td className="px-4 py-3 text-rose-700 font-medium">
                            {err.message}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-slate-450 italic mt-1 text-slate-400">
                  Note: Rows with validation errors will be skipped. Only valid rows will be committed.
                </p>
              </div>
            )}

            <div className="flex justify-between items-center border-t border-slate-100 pt-6">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                disabled={isCommitting}
                className="text-slate-600 border-slate-200"
              >
                ← Back to Mapping
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={onCancel}
                  disabled={isCommitting}
                  className="text-slate-600 border-transparent hover:bg-slate-50"
                >
                  Cancel Import
                </Button>
                <Button
                  onClick={handleConfirmCommit}
                  disabled={preview.validRows === 0 || isCommitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 shadow-sm"
                >
                  {isCommitting ? "Importing..." : `Confirm Import of ${preview.validRows} Members`}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && commitResult && (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="bg-emerald-50 text-emerald-600 rounded-full p-4 mb-4">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              Onboarding Complete!
            </h3>
            <p className="text-sm text-slate-450 max-w-sm mb-8 text-slate-400">
              Successfully imported <span className="font-semibold text-slate-700">{commitResult.importedRows}</span> member files into the system directory.
            </p>
            <Button
              onClick={onSuccess}
              className="bg-midnight hover:bg-midnight/90 text-gold font-bold px-8 shadow-md"
            >
              Go to Member Directory
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LegacyImportWizard;
