'use client';

import React, { useState, useRef } from 'react';
import { Upload, CheckCircle, AlertCircle, FileText, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { stageImport, commitImport } from '@/lib/api-client';
import type { LegacyImportPreview, LegacyImportCommitResult, LegacyRowError } from '@/lib/api-client';

type Step = 'upload' | 'preview' | 'commit' | 'done';

export default function LegacyImportPage() {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<LegacyImportPreview | null>(null);
  const [result, setResult] = useState<LegacyImportCommitResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setError(null);
  };

  const handleStage = async () => {
    if (!file) { setError('Please select a CSV file.'); return; }
    setIsLoading(true);
    setError(null);
    try {
      const data = await stageImport(file);
      setPreview(data);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!preview) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await commitImport(preview.stagingId);
      setResult(data);
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Commit failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setStep('upload');
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6 px-4">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight font-serif">
          Import Legacy Member List
        </h1>
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">
          Upload a CSV file to bulk-import existing members into the system. Rows are validated before committing.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
        {(['upload', 'preview', 'commit', 'done'] as Step[]).map((s, i) => (
          <React.Fragment key={s}>
            <span className={`px-3 py-1 rounded-full ${step === s ? 'bg-midnight text-gold dark:bg-gold dark:text-midnight shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
              {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
            </span>
            {i < 3 && <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />}
          </React.Fragment>
        ))}
      </div>

      {/* Step: Upload */}
      {step === 'upload' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-5">
          <div
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 sm:p-10 text-center cursor-pointer hover:border-gold hover:bg-amber-500/5 transition-all"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
            <p className="text-slate-800 dark:text-slate-200 font-semibold">Click to select a CSV file</p>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">Required columns: memberNumber, firstName, lastName</p>
          </div>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
          {file && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
              <FileText className="w-5 h-5 text-amber-800 dark:text-gold" />
              <span className="text-sm text-slate-800 dark:text-slate-200 font-medium">{file.name}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto">{(file.size / 1024).toFixed(1)} KB</span>
            </div>
          )}
          {error && <p className="text-xs sm:text-sm text-rose-600 dark:text-rose-400 font-medium">{error}</p>}
          <button
            onClick={handleStage}
            disabled={!file || isLoading}
            className="w-full py-2.5 sm:py-3 rounded-xl bg-midnight text-gold hover:bg-midnight-light dark:bg-gold dark:text-midnight dark:hover:bg-gold-light font-bold text-xs sm:text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
          >
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading &amp; Validating...</> : 'Upload & Validate'}
          </button>
        </div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && preview && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-5">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 text-center">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{preview.totalRows}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-1">Total Rows</div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-3.5 sm:p-4 text-center">
              <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">{preview.validRows}</div>
              <div className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mt-1">Valid Rows</div>
            </div>
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl p-3.5 sm:p-4 text-center">
              <div className="text-2xl font-bold text-rose-800 dark:text-rose-300">{preview.errors.length}</div>
              <div className="text-xs text-rose-700 dark:text-rose-400 font-semibold mt-1">Errors</div>
            </div>
          </div>

          {/* Errors */}
          {preview.errors.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" /> Validation Errors (these rows will be skipped)
              </h3>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {preview.errors.map((e: LegacyRowError, i: number) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-lg text-xs text-rose-900 dark:text-rose-200">
                    <span className="font-bold whitespace-nowrap">Row {e.row}:</span>
                    <span className="font-semibold">{e.field}</span>
                    <span>— {e.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview table */}
          {preview.preview.length > 0 && (
            <div className="overflow-x-auto">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">Preview (first rows)</h3>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/60">
                    {Object.keys(preview.preview[0]).map((col) => (
                      <th key={col} className="text-left px-3 py-2 text-slate-600 dark:text-slate-400 font-semibold border border-slate-200 dark:border-slate-800">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.preview.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="px-3 py-2 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">{String(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {error && <p className="text-xs sm:text-sm text-rose-600 dark:text-rose-400 font-medium">{error}</p>}

          <div className="flex gap-3">
            <button onClick={reset} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleCommit}
              disabled={preview.validRows === 0 || isLoading}
              className="flex-1 py-2.5 rounded-xl bg-midnight text-gold hover:bg-midnight-light dark:bg-gold dark:text-midnight dark:hover:bg-gold-light font-bold text-xs sm:text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              {isLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Committing...</>
                : `Commit ${preview.validRows} Valid Members`}
            </button>
          </div>
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && result && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 sm:p-10 text-center space-y-5">
          <CheckCircle className="w-16 h-16 text-emerald-600 dark:text-emerald-400 mx-auto" />
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-serif">Import Complete!</h2>
          <div className="flex justify-center gap-8">
            <div>
              <div className="text-3xl font-bold text-emerald-800 dark:text-emerald-300">{result.committed}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-1">Members Imported</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-500 dark:text-slate-400">{result.skipped}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-1">Rows Skipped</div>
            </div>
          </div>
          <button onClick={reset} className="mx-auto flex items-center gap-2 px-6 py-2.5 rounded-xl bg-midnight text-gold hover:bg-midnight-light dark:bg-gold dark:text-midnight dark:hover:bg-gold-light font-bold text-xs sm:text-sm transition-all shadow-sm">
            Import Another File
          </button>
        </div>
      )}

      {/* CSV format hint */}
      {step === 'upload' && (
        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-xs text-slate-600 dark:text-slate-400 space-y-1">
          <p className="font-bold text-slate-800 dark:text-slate-200">Expected CSV format:</p>
          <code className="block font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2 overflow-x-auto text-slate-800 dark:text-slate-200">
            memberNumber,firstName,middleName,lastName,nationalId,idType,phone,email,dateOfBirth,status,joinedAt
          </code>
          <p>All columns except <strong className="text-slate-800 dark:text-slate-200">memberNumber</strong>, <strong className="text-slate-800 dark:text-slate-200">firstName</strong>, and <strong className="text-slate-800 dark:text-slate-200">lastName</strong> are optional.</p>
          <p>
            Use a real member list, not a document. Dates must be <code className="font-mono">YYYY-MM-DD</code>.{' '}
            <a
              href="/samples/legacy-members-sample.csv?v=4"
              download="sacco-new-members.csv"
              className="font-bold text-amber-800 dark:text-gold hover:underline"
            >
              Download a sample CSV
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
