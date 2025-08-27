"use client";

import React from "react";
import { Input } from "@/components/FormField";

export type AddHostRow = { host: string; ip: string };

type Props = {
  value: AddHostRow[];
  onChange: (next: AddHostRow[]) => void;
  className?: string;
};

export default function AddHostsField({ value, onChange, className = "" }: Props) {
  const rows = value.length ? value : [{ host: "", ip: "" }];

  function setRow(i: number, row: AddHostRow) {
    const next = [...rows];
    next[i] = row;
    onChange(next);
  }

  function addRow() {
    onChange([...rows, { host: "", ip: "" }]);
  }

  function removeRow(i: number) {
    const next = rows.filter((_, idx) => idx !== i);
    onChange(next.length ? next : [{ host: "", ip: "" }]);
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">Add Hosts</h3>
        <button
          type="button"
          onClick={addRow}
          className="text-sm px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-800"
        >
          + Add Host
        </button>
      </div>

      <div className="space-y-2">
        {rows.map((row, i) => (
          <div
            key={i}
            className="grid md:grid-cols-2 gap-3 bg-white p-3 rounded border border-gray-200"
          >
            <Input
              label="Host"
              placeholder="example.com"
              value={row.host}
              onChange={(e) => setRow(i, { ...row, host: e.target.value })}
              required
            />
            <Input
              label="IP"
              placeholder="10.10.10.5"
              value={row.ip}
              onChange={(e) => setRow(i, { ...row, ip: e.target.value })}
              required
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