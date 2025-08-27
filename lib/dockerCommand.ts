import { z } from "zod";

export const ContainerConfigInput = z.object({
  name: z.string().min(1, "name zorunlu"),
  image: z.string().min(1, "image zorunlu"),
  tag: z.string().default("latest").optional(),

  restartPolicy: z.string().optional(),
  network: z.string().optional(),

  envVars: z
    .array(z.object({ key: z.string(), value: z.string().optional().nullable() }))
    .optional(),
  ports: z
    .array(
      z.object({
        host: z.number().int().nonnegative().optional(),
        container: z.number().int().nonnegative(),
        hostPort: z.number().int().nonnegative().optional(),
        containerPort: z.number().int().nonnegative().optional(),
        protocol: z.enum(["tcp", "udp"]).optional(),
      })
    )
    .optional(),
  volumes: z
    .array(
      z.object({
        host: z.string(),
        container: z.string(),
        mode: z.enum(["ro", "rw"]).optional(),
      })
    )
    .optional(),
  labels: z
    .array(z.object({ key: z.string(), value: z.string().optional().nullable() }))
    .optional(),
  addHosts: z
    .array(z.object({ host: z.string(), ip: z.string() }))
    .optional(),

  extraArgs: z.string().optional(),
});

function q(value: string | number | null | undefined): string {
  const str = value == null ? "" : String(value);
  return `"${str.replace(/"/g, '\\"')}"`;
}

function makeEnvArgs(envVars?: Array<{ key: string; value?: string | null }>): string[] {
  if (!envVars?.length) return [];
  return envVars
    .filter(e => e.key)
    .map(e => ["-e", q(`${e.key}=${e.value ?? ""}`)])
    .flat();
}

function makeLabelArgs(labels?: Array<{ key: string; value?: string | null }>): string[] {
  if (!labels?.length) return [];
  return labels
    .filter(l => l.key)
    .map(l => ["--label", `${l.key}=${l.value ?? ""}`])
    .flat();
}

function makePortArgs(
  ports?: Array<{
    host?: number;
    container?: number;
    hostPort?: number;
    containerPort?: number;
    protocol?: "tcp" | "udp";
  }>
): string[] {
  if (!ports?.length) return [];
  return ports
    .map(p => {
      const host = p.host ?? p.hostPort;
      const container = p.container ?? p.containerPort;
      if (container == null) return null;
      const base = host != null ? `${host}:${container}` : `${container}`;
      const proto = p.protocol ? `/${p.protocol}` : "";
      return ["-p", `${base}${proto}`];
    })
    .filter(Boolean)
    .flat() as string[];
}

function makeVolumeArgs(
  volumes?: Array<{ host: string; container: string; mode?: "ro" | "rw" }>
): string[] {
  if (!volumes?.length) return [];
  return volumes
    .map(v => {
      if (!v.host || !v.container) return null;
      const mode = v.mode ? `:${v.mode}` : "";
      return ["-v", `${v.host}:${v.container}${mode}`];
    })
    .filter(Boolean)
    .flat() as string[];
}

function makeAddHostArgs(addHosts?: Array<{ host: string; ip: string }>): string[] {
  if (!addHosts?.length) return [];
  return addHosts
    .filter(h => h.host && h.ip)
    .map(h => `--add-host=${h.host}:${h.ip}`);
}

export function buildDockerRun(input: unknown, opts?: { multiline?: boolean }): string {
  const cfg = ContainerConfigInput.parse(input); // doğrulama

  const parts: string[] = ["docker", "run", "-d", "--name", cfg.name];

  if (cfg.restartPolicy) parts.push("--restart", cfg.restartPolicy);
  if (cfg.network) parts.push("--network", cfg.network);

  parts.push(...makePortArgs(cfg.ports));
  parts.push(...makeAddHostArgs(cfg.addHosts));
  parts.push(...makeEnvArgs(cfg.envVars));
  parts.push(...makeLabelArgs(cfg.labels));
  parts.push(...makeVolumeArgs(cfg.volumes));

  if (cfg.extraArgs?.trim()) {
    parts.push(...cfg.extraArgs.trim().split(/\s+/));
  }

  const imageTag = cfg.tag ? `${cfg.image}:${cfg.tag}` : cfg.image;
  parts.push(imageTag);

  if (opts?.multiline) {
    const blocks: string[] = [];

    const first = ["docker run -d", `--name ${cfg.name}`].join(" \\\n  ");
    blocks.push(first);

    const group = (labelArgs: string[]) => {
      const out: string[] = [];
      for (let i = 0; i < labelArgs.length; i++) {
        const flag = labelArgs[i];
        const val = labelArgs[i + 1];
        if (flag?.startsWith("-") && val && !val.startsWith("-")) {
          out.push(`${flag} ${val}`);
          i++;
        } else {
          out.push(flag);
        }
      }
      return out.map(s => `  ${s}`).join(" \\\n");
    };

    const groups: string[][] = [];
    const portArgs = makePortArgs(cfg.ports);
    if (portArgs.length) groups.push(portArgs);
    const hostArgs = makeAddHostArgs(cfg.addHosts);
    if (hostArgs.length) groups.push(hostArgs);
    const envArgs = makeEnvArgs(cfg.envVars);
    if (envArgs.length) groups.push(envArgs);
    const labelArgs = makeLabelArgs(cfg.labels);
    if (labelArgs.length) groups.push(labelArgs);
    const volArgs = makeVolumeArgs(cfg.volumes);
    if (volArgs.length) groups.push(volArgs);

    const misc: string[] = [];
    if (cfg.restartPolicy) misc.push("--restart", cfg.restartPolicy);
    if (cfg.network) misc.push("--network", cfg.network);
    if (misc.length) groups.unshift(misc);

    if (cfg.extraArgs?.trim()) {
      groups.push(cfg.extraArgs.trim().split(/\s+/));
    }

    for (const g of groups) {
      blocks.push(group(g));
    }

    blocks.push(`  ${imageTag}`);

    return blocks.join(" \\\n");
  }

  return parts
    .map(p => (/\s/.test(p) && !p.startsWith('"') && !p.endsWith('"') ? q(p) : p))
    .join(" ");
}