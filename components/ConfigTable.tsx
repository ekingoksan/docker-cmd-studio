"use client";

import Link from "next/link";

export type ConfigItem = {
  id: string;
  name: string;
  image: string;
  tag: string;
  generatedCommand?: string | null;
};

type Props = {
  items: ConfigItem[];
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  onCopy?: (cmd?: string | null) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void; // ✅ yeni
};

export default function ConfigTable({
  items,
  loading,
  error,
  onRefresh,
  onCopy,
  onDelete,
  onDuplicate,
}: Props) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-gray-600">
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-red-600">
        Error: {error}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-gray-600">
        No configs found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
      <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
        <span className="font-semibold text-gray-900">List</span>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-sm px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-700"
          >
            Refresh
          </button>
        )}
      </div>

      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-sm font-medium text-gray-700 border-b">Name</th>
            <th className="px-4 py-3 text-sm font-medium text-gray-700 border-b">Image</th>
            <th className="px-4 py-3 text-sm font-medium text-gray-700 border-b">Tag</th>
            <th className="px-4 py-3 text-sm font-medium text-gray-700 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 border-b text-gray-900">{it.name}</td>
              <td className="px-4 py-3 border-b text-gray-700">{it.image}</td>
              <td className="px-4 py-3 border-b text-gray-700">{it.tag}</td>
              <td className="px-4 py-3 border-b">
                <div className="flex flex-wrap gap-2">
                  {onCopy && (
                    <button
                      onClick={() => onCopy(it.generatedCommand)}
                      className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                      Copy
                    </button>
                  )}

                  {onDuplicate && (
                    <button
                      onClick={() => onDuplicate(it.id)}
                      className="text-xs px-2 py-1 rounded bg-violet-100 hover:bg-violet-200 text-violet-800"
                    >
                      Duplicate
                    </button>
                  )}

                  <Link
                    href={`/edit/${it.id}`}
                    className="text-xs px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-800"
                  >
                    Edit
                  </Link>

                  {onDelete && (
                    <button
                      onClick={() => onDelete(it.id)}
                      className="text-xs px-2 py-1 rounded bg-red-100 hover:bg-red-200 text-red-800"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}