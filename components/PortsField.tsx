"use client";

import React from "react";
import { Input } from "@/components/FormField";

export type PortRow = { host?: number | ""; container: number | "" };

type Props = {
  value: PortRow[];
  onChange: (next: PortRow[]) => void;
  className?: string;
};

export default function PortsField({ value, onChange, className = "" }: Props) {
  const fallback: PortRow = { host: "", container: "" };
  const rows: PortRow[] = value.length ? value : [fallback];

  function setRow(i: number, row: PortRow) {
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
        <h3 className="font-semibold text-gray-900">Ports</h3>
        <button
          type="button"
          onClick={addRow}
          className="text-sm px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-800"
        >
          + Add Port
        </button>
      </div>

      <div className="space-y-2">
        {rows.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-2 gap-3 bg-white p-3 rounded border border-gray-200"
          >
            <Input
              label="Host port (optional)"
              type="number"
              min={0}
              value={row.host === "" ? "" : row.host}
              onChange={(e) =>
                setRow(i, {
                  ...row,
                  host: e.target.value === "" ? "" : Number(e.target.value),
                })
              }
            />
            <Input
              label="Container port *"
              type="number"
              min={0}
              required
              value={row.container === "" ? "" : row.container}
              onChange={(e) =>
                setRow(i, {
                  ...row,
                  container:
                    e.target.value === "" ? "" : Number(e.target.value),
                })
              }
            />
            <div className="col-span-2 flex justify-end">
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