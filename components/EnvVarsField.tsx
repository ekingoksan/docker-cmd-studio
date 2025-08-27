"use client";

import React from "react";
import { Input } from "@/components/FormField";

export type EnvRow = { key: string; value: string };

type Props = {
  value: EnvRow[];
  onChange: (next: EnvRow[]) => void;
  className?: string;
};

export default function EnvVarsField({ value, onChange, className = "" }: Props) {
  const rows = value.length ? value : [{ key: "", value: "" }];

  function setRow(i: number, row: EnvRow) {
    const next = [...rows];
    next[i] = row;
    onChange(next);
  }

  function addRow() {
    onChange([...rows, { key: "", value: "" }]);
  }

  function removeRow(i: number) {
    const next = rows.filter((_, idx) => idx !== i);
    onChange(next.length ? next : [{ key: "", value: "" }]);
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">Environment Variables</h3>
        <button
          type="button"
          onClick={addRow}
          className="text-sm px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-800"
        >
          + Add Env
        </button>
      </div>

      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="grid md:grid-cols-2 gap-3 bg-white p-3 rounded border border-gray-200">
            <Input
              label="KEY"
              placeholder="DATABASE_URL"
              value={row.key}
              onChange={(e) => setRow(i, { ...row, key: e.target.value })}
              required
            />
            <Input
              label="Value"
              placeholder="mysql://user:pass@host:3306/db"
              value={row.value}
              onChange={(e) => setRow(i, { ...row, value: e.target.value })}
            />
            <div className="md:col-span-2 flex justify-end">
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}