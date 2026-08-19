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
    <div className="max-w-3xl mx-auto space-y-6 py-8 px-4">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
          Task 11 — Legacy Import
        </span>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Import Legacy Member List</h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload a CSV file to bulk-import existing members into the system. Rows are validated before committing.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm font-semibold">
        {(['upload', 'preview', 'commit', 'done'] as Step[]).map((s, i) => (
          <React.Fragment key={s}>
            <span className={`px-3 py-1 rounded-full ${step === s ? 'bg-slate-900 text-amber-400' : 'bg-slate-100 text-slate-400'}`}>
              {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
            </span>
            {i < 3 && <ArrowRight className="w-4 h-4 text-slate-300" />}
          </React.Fragment>
        ))}
      </div>

      {/* Step: Upload */}
      {step === 'upload' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-5">
          <div
            className="border-2 border-dashed border-slate-200 rounded-xl p-10 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-all"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-700 font-semibold">Click to select a CSV file</p>
            <p className="text-slate-400 text-sm mt-1">Required columns: memberNumber, firstName, lastName</p>
          </div>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
          {file && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <FileText className="w-5 h-5 text-amber-600" />
              <span className="text-sm text-slate-700 font-medium">{file.name}</span>
              <span className="text-xs text-slate-400 ml-auto">{(file.size / 1024).toFixed(1)} KB</span>
            </div>
          )}
          {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}
          <button
            onClick={handleStage}
            disabled={!file || isLoading}
            className="w-full py-3 rounded-xl bg-slate-900 text-amber-400 font-bold text-sm hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading & Validating...</> : 'Upload & Validate'}
          </button>
        </div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && preview && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-slate-900">{preview.totalRows}</div>
              <div className="text-xs text-slate-500 font-semibold mt-1">Total Rows</div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-emerald-700">{preview.validRows}</div>
              <div className="text-xs text-emerald-600 font-semibold mt-1">Valid Rows</div>
            </div>
            <div className="bg-rose-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-rose-700">{preview.errors.length}</div>
              <div className="text-xs text-rose-600 font-semibold mt-1">Errors</div>
            </div>
          </div>

          {/* Errors */}
          {preview.errors.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500" /> Validation Errors (these rows will be skipped)
              </h3>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {preview.errors.map((e: LegacyRowError, i: number) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-rose-50 rounded-lg text-xs text-rose-700">
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
              <h3 className="text-sm font-bold text-slate-700 mb-2">Preview (first rows)</h3>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    {Object.keys(preview.preview[0]).map((col) => (
                      <th key={col} className="text-left px-3 py-2 text-slate-500 font-semibold border border-slate-200">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.preview.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="px-3 py-2 text-slate-700 border border-slate-200">{String(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}

          <div className="flex gap-3">
            <button onClick={reset} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-all">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleCommit}
              disabled={preview.validRows === 0 || isLoading}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 text-amber-400 font-bold text-sm hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center space-y-5">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
          <h2 className="text-2xl font-bold text-slate-900">Import Complete!</h2>
          <div className="flex justify-center gap-8">
            <div>
              <div className="text-3xl font-black text-emerald-700">{result.committed}</div>
              <div className="text-sm text-slate-500 font-semibold mt-1">Members Imported</div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-400">{result.skipped}</div>
              <div className="text-sm text-slate-500 font-semibold mt-1">Rows Skipped</div>
            </div>
          </div>
          <button onClick={reset} className="mx-auto flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-amber-400 font-bold text-sm hover:bg-slate-800 transition-all">
            Import Another File
          </button>
        </div>
      )}

      {/* CSV format hint */}
      {step === 'upload' && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs text-slate-600 space-y-1">
          <p className="font-bold text-slate-700">Expected CSV format:</p>
          <code className="block font-mono bg-white border border-slate-200 rounded p-2 overflow-x-auto">
            memberNumber,firstName,middleName,lastName,nationalId,idType,phone,email,dateOfBirth,status,joinedAt
          </code>
          <p>All columns except <strong>memberNumber</strong>, <strong>firstName</strong>, and <strong>lastName</strong> are optional.</p>
        </div>
      )}
    </div>
  );
}
