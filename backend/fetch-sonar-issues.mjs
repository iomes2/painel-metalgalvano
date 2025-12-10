import fs from "fs";
import fetch from "node-fetch";

const SONAR_ORG = "iomes2";
const SONAR_PROJECT = "iomes2_painel-metalgalvano";
const SONAR_TOKEN = "PEGAR EM SECURITY NO PERFIL";

async function fetchIssues() {
  console.log(`Fetching issues for ${SONAR_ORG} / ${SONAR_PROJECT}...`);
  const url = `https://sonarcloud.io/api/issues/search?organization=${SONAR_ORG}&projects=${SONAR_PROJECT}&severities=MAJOR,CRITICAL,BLOCKER&ps=500`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization:
          "Basic " + Buffer.from(SONAR_TOKEN + ":").toString("base64"),
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Failed to fetch issues: ${res.status} ${res.statusText}`);
      console.error(errorText);
      return;
    }

    const data = await res.json();
    console.log(`Found ${data.issues.length} issues.`);

    // Save raw JSON for easier parsing by agents
    fs.writeFileSync("sonar-issues.json", JSON.stringify(data, null, 2));
    console.log("Saved raw data to 'sonar-issues.json'");

    // Group by file for Markdown report
    const grouped = {};
    data.issues.forEach((issue) => {
      const file = issue.component.split(":")[1] || issue.component;
      if (!grouped[file]) grouped[file] = [];

      grouped[file].push({
        rule: issue.rule,
        message: issue.message,
        severity: issue.severity,
        start: issue.textRange?.startLine,
        end: issue.textRange?.endLine,
        type: issue.type,
      });
    });

    let output = `# SonarCloud Issues Report\n\n`;
    output += `Total de issues encontradas: ${data.issues.length}\n\n`;

    // High/Critical First
    const priorityFiles = Object.keys(grouped).filter((f) =>
      grouped[f].some((i) =>
        ["CRITICAL", "MAJOR", "BLOCKER"].includes(i.severity)
      )
    );
    const otherFiles = Object.keys(grouped).filter(
      (f) => !priorityFiles.includes(f)
    );

    const renderFileBlock = (file) => {
      let block = `\n---\n## 📌 Arquivo: **${file}**\n\n`;
      grouped[file].forEach((issue) => {
        const icon =
          issue.severity === "CRITICAL" || issue.severity === "BLOCKER"
            ? "🚨"
            : issue.severity === "MAJOR"
            ? "🔸"
            : "ℹ️";
        block += `### ${icon} ${issue.severity} - ${issue.type}\n`;
        block += `**Regra:** \`${issue.rule}\`\n`;
        block += `**Linhas:** ${issue.start || "?"} - ${issue.end || "?"}\n\n`;
        block += `> ${issue.message}\n\n`;
      });
      return block;
    };

    if (priorityFiles.length > 0) {
      output += "## 🔥 Alta Prioridade\n";
      priorityFiles.forEach((f) => (output += renderFileBlock(f)));
    }

    if (otherFiles.length > 0) {
      output += "\n---\n## 📝 Outras Issues\n";
      otherFiles.forEach((f) => (output += renderFileBlock(f)));
    }

    fs.writeFileSync("sonar-issues.md", output);
    console.log("Relatório Markdown gerado em 'sonar-issues.md'");
  } catch (error) {
    console.error("Erro ao executar script:", error);
  }
}

fetchIssues();
