"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input, Select } from "@/components/FormField";
import PortsField, { type PortRow } from "@/components/PortsField";
import EnvVarsField, { type EnvRow } from "@/components/EnvVarsField";
import LabelsField, { type LabelRow } from "@/components/LabelsField";
import AddHostsField, { type AddHostRow } from "@/components/AddHostsField";
import VolumesField, { type VolumeRow } from "@/components/VolumesField";

type Item = {
  id: string;
  name: string;
  image: string;
  tag: string;
  restartPolicy: "always" | "unless-stopped" | "on-failure" | null;
  network: string | null;
  extraArgs: string | null;
  ports: PortRow[];
  envVars: EnvRow[];
  labels: LabelRow[];
  addHosts: AddHostRow[];
  volumes: VolumeRow[];
  generatedCommand: string | null;
};

export default function EditConfigPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    image: "",
    tag: "latest",
    restartPolicy: "always" as "always" | "unless-stopped" | "on-failure",
  });
  const [ports, setPorts] = useState<PortRow[]>([{ host: "", container: "" }]);
  const [envVars, setEnvVars] = useState<EnvRow[]>([{ key: "", value: "" }]);
  const [labels, setLabels] = useState<LabelRow[]>([{ key: "", value: "" }]);
  const [addHosts, setAddHosts] = useState<AddHostRow[]>([{ host: "", ip: "" }]);
  const [volumes, setVolumes] = useState<VolumeRow[]>([{ host: "", container: "", mode: "rw" }]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string>("");
  const [info, setInfo] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/configs/${id}`);
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(t || "Failed to load item");
        }
        const data = await res.json();
        const it: Item = data.item;

        if (!alive) return;

        setForm({
          name: it.name,
          image: it.image,
          tag: it.tag || "latest",
          restartPolicy: (it.restartPolicy ?? "always") as
            | "always"
            | "unless-stopped"
            | "on-failure",
        });

        setPorts(it.ports && it.ports.length ? it.ports : [{ host: "", container: "" }]);
        setEnvVars(it.envVars && it.envVars.length ? it.envVars : [{ key: "", value: "" }]);
        setLabels(it.labels && it.labels.length ? it.labels : [{ key: "", value: "" }]);
        setAddHosts(it.addHosts && it.addHosts.length ? it.addHosts : [{ host: "", ip: "" }]);
        setVolumes(
          it.volumes && it.volumes.length
            ? it.volumes
            : [{ host: "", container: "", mode: "rw" }]
        );
        setErr("");
      } catch (e: any) {
        setErr(e?.message ?? "Error");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const generatedCommand = useMemo(() => {
    if (!form.name || !form.image) return "";

    const lines: string[] = [];
    lines.push(`docker run -d \\`);
    lines.push(`  --name ${form.name} \\`);
    if (form.restartPolicy) lines.push(`  --restart ${form.restartPolicy} \\`);

    ports.forEach((p) => {
      if (p.container !== "" && p.container !== undefined) {
        lines.push(p.host ? `  -p ${p.host}:${p.container} \\` : `  -p ${p.container} \\`);
      }
    });

    envVars.forEach((e) => {
      if (e.key.trim()) lines.push(`  -e "${e.key}=${e.value}" \\`);
    });

    labels.forEach((l) => {
      if (l.key.trim()) lines.push(`  --label ${l.key}=${l.value} \\`);
    });

    addHosts.forEach((h) => {
      if (h.host.trim() && h.ip.trim()) lines.push(`  --add-host=${h.host}:${h.ip} \\`);
    });

    volumes.forEach((v) => {
      if (v.host.trim() && v.container.trim()) {
        lines.push(`  -v ${v.host}:${v.container}${v.mode ? `:${v.mode}` : ""} \\`);
      }
    });

    lines.push(`  ${form.image}:${form.tag || "latest"}`);
    return lines.join("\n");
  }, [form, ports, envVars, labels, addHosts, volumes]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr("");
    setInfo("");

    const payload = {
      name: form.name.trim(),
      image: form.image.trim(),
      tag: form.tag.trim() || "latest",
      restartPolicy: form.restartPolicy,
      ports: ports.filter((p) => p.container !== "" && p.container !== undefined),
      envVars: envVars.filter((e) => e.key.trim()),
      labels: labels.filter((l) => l.key.trim()),
      addHosts: addHosts.filter((h) => h.host.trim() && h.ip.trim()),
      volumes: volumes.filter((v) => v.host.trim() && v.container.trim()),
    };

    try {
      const res = await fetch(`/api/configs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "Save failed");
      }
      setInfo("Saved.");
      setTimeout(() => setInfo(""), 1800);
    } catch (e: any) {
      setErr(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="text-gray-900">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Command</h1>
              <p className="text-sm text-gray-600">Update your docker run configuration.</p>
            </div>
            <button
              onClick={() => router.push("/")}
              className="border border-gray-300 bg-white text-gray-800 px-4 py-2 rounded-md hover:bg-gray-100"
            >
              Back to List
            </button>
          </header>

          {err && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700">
              {err}
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
            <form onSubmit={handleSave} className="bg-white rounded-lg shadow border border-gray-200">
              <div className="px-5 py-3 border-b bg-gray-50 rounded-t-lg">
                <h2 className="font-semibold">Basic</h2>
              </div>

              <div className="p-5 space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="Name"
                    required
                    placeholder="e.g. myapp"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  <Input
                    label="Image"
                    required
                    placeholder="e.g. nginx or user/app"
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                  />
                  <Input
                    label="Tag"
                    placeholder="latest"
                    value={form.tag}
                    onChange={(e) => setForm({ ...form, tag: e.target.value })}
                  />
                  <Select
                    label="Restart Policy"
                    value={form.restartPolicy}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        restartPolicy: (e.target as HTMLSelectElement).value as
                          | "always"
                          | "unless-stopped"
                          | "on-failure",
                      })
                    }
                  >
                    <option value="always">always</option>
                    <option value="unless-stopped">unless-stopped</option>
                    <option value="on-failure">on-failure</option>
                  </Select>
                </div>
              </div>

              <div className="px-5 pb-5 space-y-4">
                <details className="rounded border border-gray-200 bg-white">
                  <summary className="cursor-pointer select-none px-4 py-2 bg-gray-50 border-b font-medium">
                    Ports
                  </summary>
                  <div className="p-4">
                    <PortsField value={ports} onChange={setPorts} />
                  </div>
                </details>

                <details className="rounded border border-gray-200 bg-white">
                  <summary className="cursor-pointer select-none px-4 py-2 bg-gray-50 border-b font-medium">
                    Environment Variables
                  </summary>
                  <div className="p-4">
                    <EnvVarsField value={envVars} onChange={setEnvVars} />
                  </div>
                </details>

                <details className="rounded border border-gray-200 bg-white">
                  <summary className="cursor-pointer select-none px-4 py-2 bg-gray-50 border-b font-medium">
                    Labels
                  </summary>
                  <div className="p-4">
                    <LabelsField value={labels} onChange={setLabels} />
                  </div>
                </details>

                <details className="rounded border border-gray-200 bg-white">
                  <summary className="cursor-pointer select-none px-4 py-2 bg-gray-50 border-b font-medium">
                    Add Hosts
                  </summary>
                  <div className="p-4">
                    <AddHostsField value={addHosts} onChange={setAddHosts} />
                  </div>
                </details>

                <details className="rounded border border-gray-200 bg-white">
                  <summary className="cursor-pointer select-none px-4 py-2 bg-gray-50 border-b font-medium">
                    Volumes
                  </summary>
                  <div className="p-4">
                    <VolumesField value={volumes} onChange={setVolumes} />
                  </div>
                </details>
              </div>

              <div className="px-5 py-4 border-t bg-gray-50 rounded-b-lg flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="inline-flex items-center gap-2 border border-gray-300 bg-white text-gray-800 px-5 py-2 rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-6 bg-white rounded-lg shadow border border-gray-200 p-4 space-y-4">
            <h2 className="font-semibold text-gray-900">Preview</h2>
            {generatedCommand ? (
              <>
                <pre className="text-xs bg-gray-900 text-green-300 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                  {generatedCommand}
                </pre>
                <button
                  type="button"
                  onClick={() => {
                    if (!generatedCommand) return;
                    navigator.clipboard.writeText(generatedCommand);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1800);
                  }}
                  className="w-full inline-flex justify-center bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
                >
                  {copied ? "Copied!" : "Copy to Clipboard"}
                </button>
              </>
            ) : (
              <p className="text-sm text-gray-500">Fill in form to see preview</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}