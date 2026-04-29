const DOCKER_SOCKET = process.env.DOCKER_SOCKET ?? "/var/run/docker.sock";

interface ContainerInfo {
  name: string;
  image: string;
  status: "up" | "down";
  uptime: string;
}

export interface DockerData {
  running: number;
  stopped: number;
  cpu: number;
  ram: number;
  containers: ContainerInfo[];
}

async function dockerFetch(path: string) {
  const r = await fetch(`http://localhost${path}`, {
    unix: DOCKER_SOCKET,
    headers: { Host: "localhost" },
  });
  if (!r.ok) throw new Error(`Docker ${path} ${r.status}`);
  return r.json();
}

function fmtUptime(status: string): string {
  // Status looks like: "Up 4 days", "Up About an hour", "Exited (137) 8 days ago"
  const m = status.match(/(\d+)\s*(second|minute|hour|day|week|month)/);
  if (m) {
    const n = m[1];
    const unit = m[2].replace("second", "s").replace("minute", "m").replace("hour", "h").replace("day", "d").replace("week", "w").replace("month", "mo");
    return `${n}${unit}`;
  }
  if (status.includes("About a minute")) return "1m";
  if (status.includes("About an hour")) return "1h";
  if (status.includes("minutes")) {
    const m2 = status.match(/(\d+)\s*minutes/);
    if (m2) return `${m2[1]}m`;
  }
  return status.replace(/.*? /, "").slice(0, 8);
}

export async function getDockerData(): Promise<DockerData | null> {
  try {
    const [containers, statsRaw] = await Promise.all([
      dockerFetch("/containers/json?all=true"),
      dockerFetch("/containers/json?limit=50"),
    ] as const);

    const containersList: ContainerInfo[] = (containers as any[]).map((c: any) => ({
      name: (c.Names?.[0] ?? "").replace(/^\//, ""),
      image: c.Image ?? "",
      status: c.State === "running" ? "up" : "down",
      uptime: fmtUptime(c.Status ?? ""),
    }));

    const running = containersList.filter((c) => c.status === "up").length;
    const stopped = containersList.filter((c) => c.status === "down").length;

    // Aggregate CPU and RAM from running containers
    let cpuTotal = 0;
    let ramTotal = 0;
    const runningIds: string[] = (containers as any[]).filter((c: any) => c.State === "running").map((c: any) => c.Id);

    if (runningIds.length > 0) {
      const statsResults = await Promise.allSettled(
        runningIds.map((id) => dockerFetch(`/containers/${id}/stats?stream=false`))
      );

      for (const result of statsResults) {
        if (result.status === "fulfilled") {
          const s = result.value as any;
          const cpuDelta = s.cpu_stats?.cpu_usage?.total_usage ?? 0;
          const sysDelta = s.cpu_stats?.system_cpu_usage ?? 0;
          const preCpu = s.precpu_stats?.cpu_usage?.total_usage ?? 0;
          const preSys = s.precpu_stats?.system_cpu_usage ?? 0;
          const cpus = s.cpu_stats?.online_cpus ?? 1;
          const cpuPct = sysDelta > 0 ? ((cpuDelta - preCpu) / (sysDelta - preSys)) * cpus * 100 : 0;
          cpuTotal += cpuPct;
          ramTotal += (s.memory_stats?.usage ?? 0);
        }
      }
    }

    const ramGb = ramTotal / (1024 * 1024 * 1024);

    return {
      running,
      stopped,
      cpu: Math.round(cpuTotal * 10) / 10,
      ram: Math.round(ramGb * 10) / 10,
      containers: containersList,
    };
  } catch (e) {
    console.error("Docker error:", e);
    return null;
  }
}
