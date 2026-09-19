"use client";

import React, { useState } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react";

interface ImportRow {
  keyword: string;
  searches30d: string;
  listingCount: string;
  trendPercentage: string;
}

export function MarketplaceImportView() {
  const [rows, setRows] = useState<ImportRow[]>([
    {
      keyword: "custom leather wallet",
      searches30d: "3850",
      listingCount: "28400",
      trendPercentage: "14",
    },
    {
      keyword: "engraved wallet for husband",
      searches30d: "2100",
      listingCount: "14200",
      trendPercentage: "22",
    },
  ]);

  const [bulkPasteText, setBulkPasteText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    success: boolean;
    message: string;
    count?: number;
  } | null>(null);

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      { keyword: "", searches30d: "", listingCount: "", trendPercentage: "" },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRowChange = (index: number, field: keyof ImportRow, value: string) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleParseBulkPaste = () => {
    if (!bulkPasteText.trim()) return;

    // Supports Tab-delimited (copy-pasted from spreadsheet) or Comma-delimited
    const lines = bulkPasteText.trim().split("\n");
    const parsed: ImportRow[] = [];

    for (const line of lines) {
      const delimiter = line.includes("\t") ? "\t" : ",";
      const parts = line.split(delimiter).map((p) => p.trim().replace(/^["']|["']$/g, ""));
      if (parts[0]) {
        parsed.push({
          keyword: parts[0],
          searches30d: parts[1] ? parts[1].replace(/[^0-9]/g, "") : "0",
          listingCount: parts[2] ? parts[2].replace(/[^0-9]/g, "") : "0",
          trendPercentage: parts[3] ? parts[3].replace(/[^0-9.-]/g, "") : "0",
        });
      }
    }

    if (parsed.length > 0) {
      setRows(parsed);
      setBulkPasteText("");
    }
  };

  const handleExecuteImport = async () => {
    setIsImporting(true);
    setImportStatus(null);

    const validEntries = rows
      .filter((r) => r.keyword.trim())
      .map((r) => ({
        keyword: r.keyword.trim(),
        searches30d: parseInt(r.searches30d || "0", 10),
        listingCount: parseInt(r.listingCount || "0", 10),
        trendPercentage: parseFloat(r.trendPercentage || "0"),
        observedAt: new Date().toISOString(),
      }));

    if (validEntries.length === 0) {
      setIsImporting(false);
      setImportStatus({
        success: false,
        message: "No valid rows to import. Enter at least one keyword.",
      });
      return;
    }

    try {
      const res = await fetch("/api/imports/marketplace-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: validEntries,
          sourceLabel: "Etsy Shop Manager Marketplace Insights Import",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setImportStatus({
          success: true,
          message: data.message,
          count: data.importedCount,
        });
      } else {
        setImportStatus({
          success: false,
          message: data.error || "Import failed.",
        });
      }
    } catch (err: any) {
      setImportStatus({
        success: false,
        message: err.message || "Network error.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Etsy Marketplace Insights Importer
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Import official 30-day search volumes and competition listing counts directly from your Etsy Shop Manager Stats.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Level 1 Direct Provenance (95% Confidence)</span>
          </div>
        </div>
      </div>

      {/* Bulk Paste Quick Input */}
      <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-white">Bulk Paste from Spreadsheet or Shop Manager</h3>
        <p className="text-xs text-neutral-400 leading-relaxed">
          Copy and paste rows from Excel, Google Sheets, or directly from Etsy Shop Manager Stats (columns: Keyword, Searches 30d, Listing Count, Trend %).
        </p>

        <textarea
          rows={3}
          value={bulkPasteText}
          onChange={(e) => setBulkPasteText(e.target.value)}
          placeholder="Paste rows here:&#10;custom leather wallet	3850	28400	14&#10;engraved wallet for dad	2400	16800	15"
          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-white font-mono focus:outline-none focus:border-neutral-700 leading-relaxed"
        />

        <button
          onClick={handleParseBulkPaste}
          disabled={!bulkPasteText.trim()}
          className="text-xs bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-900 text-neutral-200 px-3.5 py-1.5 rounded-lg border border-neutral-700 transition"
        >
          Parse Pasted Rows into Table
        </button>
      </div>

      {/* Manual Entry Table */}
      <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Verified Data Table ({rows.length} rows)</h3>
            <p className="text-xs text-neutral-400">All rows will be imported and tagged as direct Level 1 marketplace evidence.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddRow}
              className="flex items-center gap-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-1.5 rounded-lg border border-neutral-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Row</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-800 text-[10px] text-neutral-400 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Keyword</th>
                <th className="py-2.5 px-3">Searches (Last 30 Days)</th>
                <th className="py-2.5 px-3">Listings (Competition)</th>
                <th className="py-2.5 px-3">Trend %</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50 text-neutral-300">
              {rows.map((row, idx) => (
                <tr key={idx}>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={row.keyword}
                      onChange={(e) => handleRowChange(idx, "keyword", e.target.value)}
                      placeholder="e.g. custom leather wallet"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-orange-500"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      value={row.searches30d}
                      onChange={(e) => handleRowChange(idx, "searches30d", e.target.value)}
                      placeholder="e.g. 4280"
                      className="w-36 bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-orange-500 font-mono"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      value={row.listingCount}
                      onChange={(e) => handleRowChange(idx, "listingCount", e.target.value)}
                      placeholder="e.g. 31500"
                      className="w-36 bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-orange-500 font-mono"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      value={row.trendPercentage}
                      onChange={(e) => handleRowChange(idx, "trendPercentage", e.target.value)}
                      placeholder="e.g. 18"
                      className="w-24 bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-orange-500 font-mono"
                    />
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={() => handleRemoveRow(idx)}
                      className="text-neutral-500 hover:text-red-400 p-1 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Submit Import Button & Status */}
        <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
          <p className="text-[11px] text-neutral-400">
            Observations are recorded permanently in the historical measurement log without overwriting past observations.
          </p>

          <button
            onClick={handleExecuteImport}
            disabled={isImporting}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isImporting ? "Importing..." : "Import Verified Insights"}</span>
          </button>
        </div>

        {importStatus && (
          <div
            className={`p-3.5 rounded-lg text-xs flex items-center gap-2.5 ${
              importStatus.success
                ? "bg-emerald-950/60 border border-emerald-800 text-emerald-300"
                : "bg-red-950/60 border border-red-800 text-red-300"
            }`}
          >
            {importStatus.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{importStatus.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
