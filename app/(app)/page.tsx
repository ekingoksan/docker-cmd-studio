"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ConfigTable, { type ConfigItem } from "@/components/ConfigTable";

type ApiList = {
  items: ConfigItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export default function HomeListPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const [q, setQ] = useState<string>(sp.get("q") || "");
  const [page, setPage] = useState<number>(Number(sp.get("page") || 1));
  const [pageSize, setPageSize] = useState<number>(Number(sp.get("pageSize") || 10));

  const [items, setItems] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");
  const [info, setInfo] = useState<string>("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function toast(message: string) {
    setInfo(message);
    setTimeout(() => setInfo(""), 1800);
  }

  async function fetchList(params: { q?: string; page?: number; pageSize?: number }) {
    const qp = new URLSearchParams();
    if (params.q) qp.set("q", params.q);
    qp.set("page", String(params.page ?? 1));
    qp.set("pageSize", String(params.pageSize ?? 10));

    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`/api/configs?${qp.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load");
      const data: ApiList = await res.json();
      setItems(data.items || []);
      setPage(data.page);
      setPageSize(data.pageSize);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (e: any) {
      setErr(e?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  }

  function syncUrl(next: { q?: string; page?: number; pageSize?: number }) {
    const qp = new URLSearchParams();
    if ((next.q ?? q).trim()) qp.set("q", (next.q ?? q).trim());
    qp.set("page", String(next.page ?? page));
    qp.set("pageSize", String(next.pageSize ?? pageSize));
    router.replace(`/?${qp.toString()}`);
  }

  useEffect(() => {
    fetchList({ q, page, pageSize });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      syncUrl({ q, page: 1, pageSize });
      fetchList({ q, page: 1, pageSize });
    }, 350);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    syncUrl({ q, page, pageSize });
    fetchList({ q, page, pageSize });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  async function handleCopy(cmd?: string | null) {
    if (!cmd) return toast("No command to copy.");
    try {
      await navigator.clipboard.writeText(cmd);
      toast("Command copied to clipboard.");
    } catch {
      toast("Copy failed.");
    }
  }

  async function handleDelete(id: string) {
    const ok = window.confirm("Are you sure you want to delete this config?");
    if (!ok) return;

    setBusyId(id);
    try {
      const res = await fetch(`/api/configs/${id}`, { method: "DELETE" });
      setBusyId(null);
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        return toast(t || "Delete failed.");
      }
      await fetchList({ q, page, pageSize });
      toast("Deleted.");
    } catch {
      setBusyId(null);
      toast("Delete failed.");
    }
  }

  async function handleDuplicate(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/configs/${id}/duplicate`, { method: "POST" });
      setBusyId(null);
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        return toast(t || "Duplicate failed.");
      }
      const data = await res.json();
      await fetchList({ q, page: 1, pageSize });
      router.push(`/edit/${data.item.id}`);
    } catch {
      setBusyId(null);
      toast("Duplicate failed.");
    }
  }

  const canPrev = useMemo(() => page > 1, [page]);
  const canNext = useMemo(() => page < totalPages, [page, totalPages]);

  return (
    <div className="space-y-6 text-gray-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Container Configs</h1>
          <p className="text-sm text-gray-600">Manage your saved docker run configurations.</p>
        </div>
        <Link
          href="/new"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          New Command
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, image, or tag…"
          className="w-full lg:max-w-md border border-gray-300 rounded px-3 py-2 text-gray-900"
        />
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-700">Page size</label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-2 text-gray-900"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setQ("");
              setPage(1);
              fetchList({ q: "", page: 1, pageSize });
              syncUrl({ q: "", page: 1, pageSize });
            }}
            className="px-3 py-2 rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-800"
          >
            Clear
          </button>
          <button
            onClick={() => fetchList({ q, page, pageSize })}
            className="px-3 py-2 rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-800"
          >
            Refresh
          </button>
        </div>
      </div>

      {err && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{err}</div>
      )}
      {info && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-blue-700">
          {info}
        </div>
      )}

      <ConfigTable
        items={items}
        loading={loading}
        error={err}
        onRefresh={() => fetchList({ q, page, pageSize })}
        onCopy={handleCopy}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
      />

      <div className="bg-white rounded-lg shadow border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm text-gray-700">
          Page <span className="font-semibold">{page}</span> / {totalPages} • Total{" "}
          <span className="font-semibold">{total}</span> items
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={!canPrev}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-2 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={!canNext}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-2 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {busyId && (
        <div className="fixed bottom-6 right-6 rounded-md bg-gray-900 text-white text-sm px-3 py-2 shadow">
          Working…
        </div>
      )}
    </div>
  );
}