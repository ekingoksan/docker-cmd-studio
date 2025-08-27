import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

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
  network: z.string().optional().nullable(),
  extraArgs: z.string().optional().nullable(),
  ports: z.array(Port).optional(),
  envVars: z.array(KV).optional(),
  labels: z.array(KV).optional(),
  addHosts: z.array(AddHost).optional(),
  volumes: z.array(Volume).optional(),
});

function buildDockerRun(cfg: z.infer<typeof BaseSchema>) {
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSizeRaw = parseInt(searchParams.get("pageSize") || "10", 10) || 10;
  const pageSize = Math.min(Math.max(1, pageSizeRaw), 100);

  const where =
    q.length > 0
      ? {
          OR: [
            { name:  { contains: q } },
            { image: { contains: q } },
            { tag:   { contains: q } },
          ],
        }
      : {};

  const total = await prisma.containerConfig.count({ where });
  const items = await prisma.containerConfig.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      name: true,
      image: true,
      tag: true,
      generatedCommand: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

export async function POST(req: NextRequest) {
  try {
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

    const created = await prisma.containerConfig.create({
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

    return NextResponse.json({ item: created, command }, { status: 201 });
  } catch (err) {
    console.error("POST /api/configs error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}