export default async function handler(req, res) { {
  const username = "Heytiwari";

  try {
    const repos = [];
    let page = 1;

    while (true) {
      const response = await fetch(
        `https://api.github.com/users/${username}/repos?per_page=100&page=${page}&type=owner`
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      repos.push(...data);

      if (data.length < 100) break;
      page++;
    }

    const totals = {};

    // Sirf ye technologies/languages card me rahengi
    const allowed = [
      "HTML",
      "CSS",
      "JavaScript",
      "Bootstrap",
      "C",
      "C++",
      "PHP",
      "React",
      "Node.js",
      "Express.js",
      "MongoDB"
    ];

    for (const repo of repos) {
      if (repo.fork) continue;

      const response = await fetch(
        `https://api.github.com/repos/${repo.full_name}/languages`
      );

      if (!response.ok) continue;

      const languages = await response.json();

      for (const [language, bytes] of Object.entries(languages)) {

        // Sirf allowed languages ko count karo
        if (allowed.includes(language)) {
          totals[language] =
            (totals[language] || 0) + bytes;
        }
      }
    }

    // Jo technology GitHub API me nahi mili,
    // usko 0% rakho
    for (const language of allowed) {
      if (!(language in totals)) {
        totals[language] = 0;
      }
    }

    const sorted = Object.entries(totals)
      .sort((a, b) => b[1] - a[1]);

    const total = sorted.reduce(
      (sum, [, bytes]) => sum + bytes,
      0
    );

    const rows = sorted.map(([language, bytes], index) => {

      const percent = total
        ? ((bytes / total) * 100).toFixed(1)
        : "0.0";

      const y = 86 + index * 35;

      const barWidth = total
        ? Math.max(2, (444 * bytes) / total)
        : 2;

      return `
        <text
          class="name"
          x="28"
          y="${y}"
        >${escapeXml(language)}</text>

        <text
          class="percent"
          x="472"
          y="${y}"
          text-anchor="end"
        >${percent}%</text>

        <rect
          class="bar-bg"
          x="28"
          y="${y + 9}"
          width="444"
          height="5"
          rx="2.5"
        />

        <rect
          class="bar"
          x="28"
          y="${y + 9}"
          width="${barWidth}"
          height="5"
          rx="2.5"
        />
      `;
    }).join("");

    const height = 110 + sorted.length * 35;

    const svg = `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="500"
  height="${height}"
  viewBox="0 0 500 ${height}"
>
  <style>
    .bg {
      fill: #0d1117;
    }

    .title {
      fill: #ffffff;
      font: 600 22px Arial, sans-serif;
    }

    .name {
      fill: #c9d1d9;
      font: 500 14px Arial, sans-serif;
    }

    .percent {
      fill: #8b949e;
      font: 500 14px Arial, sans-serif;
    }

    .bar-bg {
      fill: #21262d;
    }

    .bar {
      fill: #58a6ff;
    }
  </style>

  <rect
    class="bg"
    x="0"
    y="0"
    width="500"
    height="${height}"
    rx="12"
  />

  <text
    class="title"
    x="28"
    y="38"
  >
    Top Languages
  </text>

  ${rows}

</svg>`;

    res.setHeader(
      "Content-Type",
      "image/svg+xml; charset=utf-8"
    );

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=7200"
    );

    res.status(200).send(svg);

  } catch (error) {

    res.status(500).send(
      `GitHub Stats Error: ${escapeXml(error.message)}`
    );

  }
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
