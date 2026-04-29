const GH_TOKEN = process.env.GITHUB_TOKEN ?? "";
const GH_USER = process.env.GITHUB_USER ?? "Fi3w0";

export interface GithubActivity {
  today: number;
  week: number;
  streak: number;
  heatmap: number[]; // 98 values (14 weeks × 7 days), level 0-4
  commits: Array<{ sha: string; message: string; repo: string; url: string }>;
  user: string;
}

async function gql(query: string) {
  const r = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${GH_TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "homepage/0.1",
    },
    body: JSON.stringify({ query }),
  });
  if (!r.ok) throw new Error(`GitHub GraphQL ${r.status}`);
  return r.json();
}

async function rest(path: string) {
  const r = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `token ${GH_TOKEN}`,
      "User-Agent": "homepage/0.1",
      Accept: "application/vnd.github.v3+json",
    },
  });
  if (!r.ok) throw new Error(`GitHub REST ${path} ${r.status}`);
  return r.json();
}

export async function getGithubActivity(): Promise<GithubActivity | null> {
  if (!GH_TOKEN) return null;
  try {
    // from = 14 weeks ago, to = today
    const from = new Date(Date.now() - 98 * 86400_000).toISOString();
    const to = new Date().toISOString();

    const [graphRes, events] = await Promise.all([
      gql(`{
        user(login: "${GH_USER}") {
          contributionsCollection(from: "${from}", to: "${to}") {
            contributionCalendar {
              weeks {
                contributionDays { contributionCount date }
              }
            }
          }
        }
      }`),
      rest(`/users/${GH_USER}/events?per_page=50`),
    ]);

    // Flatten calendar days, sorted oldest-first
    const weeks =
      graphRes.data?.user?.contributionsCollection?.contributionCalendar?.weeks ?? [];
    const allDays: Array<{ count: number; date: string }> = [];
    for (const w of weeks) {
      for (const d of w.contributionDays) {
        allDays.push({ count: d.contributionCount, date: d.date });
      }
    }
    allDays.sort((a, b) => a.date.localeCompare(b.date));

    const todayStr = new Date().toISOString().split("T")[0];
    const weekAgoStr = new Date(Date.now() - 7 * 86400_000).toISOString().split("T")[0];

    const todayCount = allDays.find((d) => d.date === todayStr)?.count ?? 0;
    const weekCount = allDays
      .filter((d) => d.date >= weekAgoStr)
      .reduce((s, d) => s + d.count, 0);

    // Streak: consecutive days with contributions, working backward from yesterday
    // (today may still be in progress, so don't break streak on today=0)
    let streak = todayCount > 0 ? 1 : 0;
    const yesterday = new Date(Date.now() - 86400_000).toISOString().split("T")[0];
    const pastDays = allDays.filter((d) => d.date <= yesterday).reverse();
    for (const d of pastDays) {
      if (d.count > 0) streak++;
      else break;
    }

    // Heatmap: last 98 days, levels 0-4
    const last98 = allDays.slice(-98);
    while (last98.length < 98) last98.unshift({ count: 0, date: "" });
    const nonZeroHeat = last98.filter(d => d.count > 0).length;
    const heatmap = last98.map(({ count: c }) => {
      if (c === 0) return 0;
      if (c <= 2) return 1;
      if (c <= 5) return 2;
      if (c <= 9) return 3;
      return 4;
    });

    // Recent commits: try commit API for each repo from push events
    const commits: GithubActivity["commits"] = [];
    const seenRepos = new Set<string>();
    for (const ev of Array.isArray(events) ? events : []) {
      if (ev.type !== "PushEvent") continue;
      const repoName = ev.repo?.name ?? "";
      if (!repoName || seenRepos.has(repoName)) continue;
      seenRepos.add(repoName);
      const ref = (ev.payload?.ref ?? "main").replace("refs/heads/", "");
      // Fetch recent commits for this repo's default branch
      try {
        const commitsRes = await rest(`/repos/${repoName}/commits?sha=${ref}&per_page=3&author=${GH_USER}`);
        if (Array.isArray(commitsRes)) {
          for (const c of commitsRes) {
            if (commits.length >= 5) break;
            commits.push({
              sha: (c.sha ?? "").slice(0, 7),
              message: (c.commit?.message ?? "").split("\n")[0].slice(0, 72),
              repo: repoName.split("/")[1] ?? repoName,
              url: c.html_url ?? `https://github.com/${repoName}/commit/${c.sha}`,
            });
          }
        }
      } catch { /* skip repos that fail */ }
      if (commits.length >= 5) break;
    }

    return { today: todayCount, week: weekCount, streak, heatmap, commits, user: GH_USER };
  } catch (e) {
    console.error("GitHub error:", e);
    return null;
  }
}
