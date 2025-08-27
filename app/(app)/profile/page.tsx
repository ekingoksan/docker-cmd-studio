"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/FormField";

type User = {
  id: string;
  name: string;
  email: string;
};

export default function ProfilePage() {
  const [form, setForm] = useState<User>({ id: "", name: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string>("");
  const [info, setInfo] = useState<string>("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [passwordNew, setPasswordNew] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function toast(message: string) {
    setInfo(message);
    setTimeout(() => setInfo(""), 1800);
  }

  function parseApiErrorPayload(payload: any): { message: string; fields: Record<string, string> } {
    const out = { message: "Save failed", fields: {} as Record<string, string> };
    if (!payload) return out;

    const err = payload.error ?? payload;
    const fieldErrs = err?.fieldErrors ?? {};
    const formErrs = err?.formErrors ?? [];

    const firstFieldMsg =
      Object.values(fieldErrs).flat().find(Boolean) as string | undefined;
    const firstFormMsg = (formErrs?.[0] as string) || undefined;

    out.message = firstFieldMsg || firstFormMsg || out.message;

    for (const [k, v] of Object.entries(fieldErrs)) {
      const msg = Array.isArray(v) ? (v[0] as string) : String(v);
      if (msg) out.fields[k] = msg;
    }
    return out;
  }

  function generateStrongPassword(len = 16) {
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lower = "abcdefghijkmnopqrstuvwxyz";
    const nums = "23456789";
    const syms = "!@#$%^&*_+-=?";
    const all = upper + lower + nums + syms;

    const pick = (pool: string) => pool[Math.floor(Math.random() * pool.length)];
    let pwd = pick(upper) + pick(lower) + pick(nums) + pick(syms);
    while (pwd.length < len) pwd += pick(all);
    pwd = pwd.split("").sort(() => Math.random() - 0.5).join("");
    return pwd;
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied to clipboard.");
    } catch {
      toast("Copy failed.");
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        if (res.status === 401) {
          setError("You must be logged in.");
          return;
        }
        if (!res.ok) throw new Error("Failed to load profile");
        const data = await res.json();
        if (!alive) return;
        setForm({
          id: data.user.id,
          name: data.user.name ?? "",
          email: data.user.email ?? "",
        });
      } catch (e: any) {
        setError(e?.message ?? "Failed to load profile");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setInfo("");
    setFieldErrors({});

    const localErrors: Record<string, string> = {};
    if (passwordNew || passwordConfirm) {
      if ((passwordNew?.length ?? 0) < 6) {
        localErrors.passwordNew = "Password must be at least 6 characters.";
      }
      if (passwordNew !== passwordConfirm) {
        localErrors.passwordConfirm = "Passwords do not match.";
      }
    }
    if (Object.keys(localErrors).length) {
      setFieldErrors(localErrors);
      setSaving(false);
      setError("Please fix the highlighted fields.");
      return;
    }

    try {
      const payload: any = { name: form.name, email: form.email };
      if (passwordNew || passwordConfirm) {
        payload.passwordNew = passwordNew;
        payload.passwordConfirm = passwordConfirm;
      }

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let friendly = { message: "Save failed", fields: {} as Record<string, string> };
        try {
          const j = await res.json();
          friendly = parseApiErrorPayload(j);
        } catch {
          const t = await res.text().catch(() => "");
          friendly.message = t || friendly.message;
        }
        setFieldErrors(friendly.fields);
        throw new Error(friendly.message);
      }

      const data = await res.json().catch(() => null);
      if (data?.passwordUpdated) {
        setPasswordNew("");
        setPasswordConfirm("");
      }
      toast("Saved.");
    } catch (e: any) {
      setError(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="text-gray-900">
      <div className="max-w-2xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-sm text-gray-600">Update your name, email, and password.</p>
        </header>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700">
            {error}
          </div>
        )}
        {info && (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-blue-700">
            {info}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-gray-600">
            Loading…
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="bg-white rounded-lg shadow border border-gray-200">
              <div className="px-5 py-3 border-b bg-gray-50 rounded-t-lg">
                <h2 className="font-semibold">Account</h2>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <Input
                    label="Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name"
                    required
                  />
                  {fieldErrors.name && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>
                  )}
                </div>

                <div>
                  <Input
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    required
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-200">
              <div className="px-5 py-3 border-b bg-gray-50 rounded-t-lg flex items-center justify-between">
                <h2 className="font-semibold">Change Password</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const g = generateStrongPassword();
                      setPasswordNew(g);
                      setPasswordConfirm(g);
                      toast("Generated a strong password.");
                    }}
                    className="px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-800 text-sm"
                  >
                    Generate
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!passwordNew) return toast("Nothing to copy.");
                      copyToClipboard(passwordNew);
                    }}
                    className="px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-800 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="flex gap-2">
                    <input
                      className={`flex-1 border rounded px-3 py-2 text-gray-900 ${
                        fieldErrors.passwordNew ? "border-red-400" : "border-gray-300"
                      }`}
                      type={showNew ? "text" : "password"}
                      value={passwordNew}
                      onChange={(e) => setPasswordNew(e.target.value)}
                      placeholder="********"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((s) => !s)}
                      className="px-3 py-2 rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-800 text-sm"
                    >
                      {showNew ? "Hide" : "Show"}
                    </button>
                  </div>
                  {fieldErrors.passwordNew ? (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.passwordNew}</p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty if you don’t want to change your password.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <div className="flex gap-2">
                    <input
                      className={`flex-1 border rounded px-3 py-2 text-gray-900 ${
                        fieldErrors.passwordConfirm ? "border-red-400" : "border-gray-300"
                      }`}
                      type={showConfirm ? "text" : "password"}
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="********"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      className="px-3 py-2 rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-800 text-sm"
                    >
                      {showConfirm ? "Hide" : "Show"}
                    </button>
                  </div>
                  {fieldErrors.passwordConfirm ? (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.passwordConfirm}</p>
                  ) : (passwordNew || passwordConfirm) ? (
                    <p
                      className={[
                        "text-xs mt-1",
                        passwordNew && passwordConfirm && passwordNew === passwordConfirm
                          ? "text-green-600"
                          : "text-red-600",
                      ].join(" ")}
                    >
                      {passwordNew === passwordConfirm
                        ? "Passwords match."
                        : "Passwords do not match."}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => {
                  location.assign("/profile");
                }}
                className="inline-flex items-center gap-2 border border-gray-300 bg-white text-gray-800 px-5 py-2 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}