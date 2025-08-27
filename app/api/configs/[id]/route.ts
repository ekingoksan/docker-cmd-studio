import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const IdSchema = z.object({
  id: z.string().uuid("Invalid id"),
});

const Port = z.object({
  host: z.number().int().nonnegative().optional(),
  container: z.number().int().nonnegative(),
});
const KV = z.object({ key: z.string().min(1), value: z.string().optional().default("") });
const AddHost = z.object({ host: z.string().min(1), ip: z.string().min(1) });
const Volume = z.object({
  host: z.string().min(1),
  container: z.string().min(1),
  mode: z.enum(["ro", "rw"]).optional(),
});

const BaseSchema = z.object({
  name: z.string().min(1),
  image: z.string().min(1),
  tag: z.string().default("latest"),
  restartPolicy: z.enum(["always", "unless-stopped", "on-failure"]).optional(),
  ports: z.array(Port).optional(),
  envVars: z.array(KV).optional(),
  labels: z.array(KV).optional(),
  addHosts: z.array(AddHost).optional(),
  volumes: z.array(Volume).optional(),
  network: z.string().optional().nullable(),
  extraArgs: z.string().optional().nullable(),
});

async function resolveParams(ctx: { params: any }): Promise<{ id: string }> {
  const p = ctx.params && typeof ctx.params.then === "function" ? await ctx.params : ctx.params;
  return p as { id: string };
}

function buildDockerRun(cfg: z.infer<typeof BaseSchema>) {
  const lines: string[] = [];
  lines.push(`docker run -d \\`);
  lines.push(`  --name ${cfg.name} \\`);
  if (cfg.restartPolicy) lines.push(`  --restart ${cfg.restartPolicy} \\`);

  if (cfg.network) lines.push(`  --network ${cfg.network} \\`);

  (cfg.ports ?? []).forEach((p) => {
    if (typeof p.container === "number") {
      if (typeof p.host === "number") {
        lines.push(`  -p ${p.host}:${p.container} \\`);
      } else {
        lines.push(`  -p ${p.container} \\`);
      }
    }
  });

  (cfg.addHosts ?? []).forEach((h) => {
    if (h.host && h.ip) lines.push(`  --add-host=${h.host}:${h.ip} \\`);
  });

  (cfg.volumes ?? []).forEach((v) => {
    if (v.host && v.container) {
      lines.push(
        `  -v ${v.host}:${v.container}${v.mode ? `:${v.mode}` : ""} \\`
      );
    }
  });

  (cfg.envVars ?? []).forEach((e) => {
    if (e.key) lines.push(`  -e "${e.key}=${e.value ?? ""}" \\`);
  });

  (cfg.labels ?? []).forEach((l) => {
    if (l.key) lines.push(`  --label ${l.key}=${l.value ?? ""} \\`);
  });

  if (cfg.extraArgs?.trim()) {
    cfg.extraArgs
      .split(/\s+/)
      .filter(Boolean)
      .forEach((arg) => lines.push(`  ${arg} \\`));
  }

  lines.push(`  ${cfg.image}:${cfg.tag || "latest"}`);
  return lines.join("\n");
}

export async function GET(_req: NextRequest, ctx: { params: any }) {
  const { id } = await resolveParams(ctx);

  const parsed = IdSchema.safeParse({ id });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const item = await prisma.containerConfig.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ item });
}

export async function PUT(req: NextRequest, ctx: { params: any }) {
  try {
    const { id } = await resolveParams(ctx);

    const idParsed = IdSchema.safeParse({ id });
    if (!idParsed.success) {
      return NextResponse.json({ error: idParsed.error.flatten() }, { status: 400 });
    }

    const exist = await prisma.containerConfig.findUnique({ where: { id } });
    if (!exist) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const json = await req.json().catch(() => null);
    if (!json) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = BaseSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;

    const command = buildDockerRun(data);

    const updated = await prisma.containerConfig.update({
      where: { id },
      data: {
        name: data.name,
        image: data.image,
        tag: data.tag || "latest",
        restartPolicy: data.restartPolicy ?? null,
        network: data.network ?? null,
        extraArgs: data.extraArgs ?? null,
        ports: data.ports ?? [],
        envVars: data.envVars ?? [],
        labels: data.labels ?? [],
        addHosts: data.addHosts ?? [],
        volumes: data.volumes ?? [],
        generatedCommand: command,
      },
    });

    return NextResponse.json({ item: updated, command });
  } catch (err) {
    console.error("PUT /api/configs/:id error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: any }) {
  try {
    const { id } = await resolveParams(ctx);

    const parsed = IdSchema.safeParse({ id });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const exist = await prisma.containerConfig.findUnique({ where: { id } });
    if (!exist) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.containerConfig.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/configs/:id error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}