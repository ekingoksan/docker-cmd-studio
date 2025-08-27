"use client";

import React from "react";
import { Input, Select } from "@/components/FormField";

type VolumeMode = "ro" | "rw";

export type VolumeRow = {
  host: string;
  container: string;
  mode?: VolumeMode;
};

type Props = {
  value: VolumeRow[];
  onChange: (next: VolumeRow[]) => void;
  className?: string;
};

export default function VolumesField({ value, onChange, className = "" }: Props) {
  const fallback: VolumeRow = { host: "", container: "", mode: "rw" };
  const rows: VolumeRow[] = value.length ? value : [fallback];

  function setRow(i: number, row: VolumeRow) {
    const next = [...rows];
    next[i] = row;
    onChange(next);
  }

  function addRow() {
    onChange([...rows, { ...fallback }]);
  }

  function removeRow(i: number) {
    const next = rows.filter((_, idx) => idx !== i);
    onChange(next.length ? next : [{ ...fallback }]);
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">Volumes</h3>
        <button
          type="button"
          onClick={addRow}
          className="text-sm px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-800"
        >
          + Add Volume
        </button>
      </div>

      <div className="space-y-2">
        {rows.map((row, i) => (
          <div
            key={i}
            className="grid md:grid-cols-3 gap-3 bg-white p-3 rounded border border-gray-200"
          >
            <Input
              label="Host path"
              placeholder="/data/app"
              value={row.host}
              onChange={(e) => setRow(i, { ...row, host: e.target.value })}
              required
            />
            <Input
              label="Container path"
              placeholder="/app"
              value={row.container}
              onChange={(e) => setRow(i, { ...row, container: e.target.value })}
              required
            />
            <Select
              label="Mode"
              value={row.mode ?? "rw"}
              onChange={(e) =>
                setRow(i, {
                  ...row,
                  mode: (e.target as HTMLSelectElement).value as VolumeMode,
                })
              }
            >
              <option value="rw">rw</option>
              <option value="ro">ro</option>
            </Select>

            <div className="md:col-span-3 flex justify-end">
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