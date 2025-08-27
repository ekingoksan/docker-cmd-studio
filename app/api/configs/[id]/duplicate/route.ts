import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const IdSchema = z.object({
  id: z.string().uuid("Invalid id"),
});

type Draft = {
  name: string;
  image: string;
  tag?: string;
  restartPolicy?: "always" | "unless-stopped" | "on-failure";
  network?: string;
  extraArgs?: string;
  ports?: Array<{ host?: number; container: number }>;
  envVars?: Array<{ key: string; value?: string }>;
  labels?: Array<{ key: string; value?: string }>;
  addHosts?: Array<{ host: string; ip: string }>;
  volumes?: Array<{ host: string; container: string; mode?: "ro" | "rw" }>;
};

function buildDockerRun(cfg: Draft) {
  const lines: string[] = [];
  lines.push(`docker run -d \\`);
  lines.push(`  --name ${cfg.name} \\`);
  if (cfg.restartPolicy) lines.push(`  --restart ${cfg.restartPolicy} \\`);
  if (cfg.network) lines.push(`  --network ${cfg.network} \\`);

  (cfg.ports ?? []).forEach((p) => {
    if (typeof p.container === "number") {
      if (typeof p.host === "number") lines.push(`  -p ${p.host}:${p.container} \\`);
      else lines.push(`  -p ${p.container} \\`);
    }
  });

  (cfg.addHosts ?? []).forEach((h) => lines.push(`  --add-host=${h.host}:${h.ip} \\`));

  (cfg.volumes ?? []).forEach((v) =>
    lines.push(`  -v ${v.host}:${v.container}${v.mode ? `:${v.mode}` : ""} \\`)
  );

  (cfg.envVars ?? []).forEach((e) => lines.push(`  -e "${e.key}=${e.value ?? ""}" \\`));
  (cfg.labels ?? []).forEach((l) => lines.push(`  --label ${l.key}=${l.value ?? ""} \\`));

  if (cfg.extraArgs?.trim()) {
    cfg.extraArgs
      .split(/\s+/)
      .filter(Boolean)
      .forEach((arg) => lines.push(`  ${arg} \\`));
  }

  lines.push(`  ${cfg.image}:${cfg.tag || "latest"}`);
  return lines.join("\n");
}

async function resolveParams(ctx: { params: any }): Promise<{ id: string }> {
  const p =
    ctx.params && typeof ctx.params.then === "function" ? await ctx.params : ctx.params;
  return p as { id: string };
}

export async function POST(_req: NextRequest, ctx: { params: any }) {
  try {
    const { id } = await resolveParams(ctx);
    const idParsed = IdSchema.safeParse({ id });
    if (!idParsed.success) {
      return NextResponse.json({ error: idParsed.error.flatten() }, { status: 400 });
    }

    const exist = await prisma.containerConfig.findUnique({ where: { id } });
    if (!exist) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const base = `${exist.name}-copy`;
    let newName = base;
    const nameClash = await prisma.containerConfig.findFirst({ where: { name: newName } });
    if (nameClash) newName = `${base}-${Date.now()}`;

    const draft: Draft = {
      name: newName,
      image: exist.image,
      tag: exist.tag ?? "latest",
      restartPolicy: (exist.restartPolicy ?? undefined) as
        | "always"
        | "unless-stopped"
        | "on-failure"
        | undefined,
      network: exist.network ?? undefined,
      extraArgs: exist.extraArgs ?? undefined,
      ports: (Array.isArray(exist.ports) ? exist.ports : [])
        .map((p: any) => ({
          host: typeof p?.host === "number" ? p.host : undefined,
          container: Number(p?.container),
        }))
        .filter((p) => Number.isFinite(p.container)),
      envVars: (Array.isArray(exist.envVars) ? exist.envVars : []).map((e: any) => ({
        key: String(e?.key ?? ""),
        value: e?.value ?? "",
      })),
      labels: (Array.isArray(exist.labels) ? exist.labels : []).map((l: any) => ({
        key: String(l?.key ?? ""),
        value: l?.value ?? "",
      })),
      addHosts: (Array.isArray(exist.addHosts) ? exist.addHosts : []).map((h: any) => ({
        host: String(h?.host ?? ""),
        ip: String(h?.ip ?? ""),
      })),
      volumes: (Array.isArray(exist.volumes) ? exist.volumes : []).map((v: any) => ({
        host: String(v?.host ?? ""),
        container: String(v?.container ?? ""),
        mode: (v?.mode ?? undefined) as "ro" | "rw" | undefined,
      })),
    };

    const command = buildDockerRun(draft);

    const created = await prisma.containerConfig.create({
      data: {
        name: draft.name,
        image: draft.image,
        tag: draft.tag ?? "latest",
        restartPolicy: draft.restartPolicy ?? null,
        network: draft.network ?? null,
        extraArgs: draft.extraArgs ?? null,
        ports: draft.ports ?? [],
        envVars: draft.envVars ?? [],
        labels: draft.labels ?? [],
        addHosts: draft.addHosts ?? [],
        volumes: draft.volumes ?? [],
        generatedCommand: command,
      },
    });

    return NextResponse.json({ item: created, command }, { status: 201 });
  } catch (err) {
    console.error("POST /api/configs/:id/duplicate error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}