import path from "node:path";
import { normalize, readText } from "./shared.mjs";

export function parseMarkdownRow(line) {
  const trimmed = line.trim();
  const hasLeadingPipe = trimmed.startsWith("|");
  const hasTrailingPipe = trimmed.endsWith("|");
  const cells = trimmed.split("|");

  const start = hasLeadingPipe ? 1 : 0;
  const end = hasTrailingPipe ? -1 : undefined;

  return cells.slice(start, end).map((part) => part.trim());
}

export function parseSummaryTableFromText(text, heading, sourceLabel) {
  const lines = text.split(/\r?\n/);
  const headingIndex = lines.findIndex((line) => line.trim() === heading);
  if (headingIndex === -1) {
    throw new Error(`Could not find heading "${heading}" in ${sourceLabel}.`);
  }

  const values = new Map();

  for (let index = headingIndex + 1; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) {
      if (values.size > 0) break;
      continue;
    }
    if (!line.startsWith("|")) {
      if (values.size > 0) break;
      continue;
    }

    const cells = parseMarkdownRow(line);
    if (cells.length < 2) continue;
    if (cells[0] === "Metric" || /^-+$/.test(cells[0].replaceAll(":", ""))) {
      continue;
    }
    values.set(cells[0], cells[1]);
  }

  return values;
}

export function parseEvidenceIndexGaps(evidenceIndexPath) {
  const lines = readText(evidenceIndexPath).split(/\r?\n/);
  const gaps = [];
  let currentSection = "";

  for (const line of lines) {
    if (line.startsWith("## ")) {
      currentSection = line.replace(/^##\s+/, "").trim();
      continue;
    }

    if (!line.startsWith("| Open gap as of ")) continue;
    const columns = parseMarkdownRow(line);
    if (columns.length < 4) continue;

    gaps.push({
      section: currentSection,
      scope: columns[1],
      owner: columns.at(-1) ?? "Unknown",
      summary: columns.slice(2, -1).join(" | "),
    });
  }

  return gaps;
}

export function parseReadinessActions(readinessPath, root) {
  const lines = readText(readinessPath).split(/\r?\n/);
  const heading = "## Next Highest-Value Actions";
  const headingIndex = lines.findIndex((line) => line.trim() === heading);
  if (headingIndex === -1) {
    throw new Error(
      `Could not find heading "${heading}" in ${normalize(
        path.relative(root, readinessPath),
      )}.`,
    );
  }

  const actions = [];

  for (let index = headingIndex + 1; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) {
      if (actions.length > 0) break;
      continue;
    }
    if (!line.startsWith("- ")) {
      if (actions.length > 0) break;
      continue;
    }

    actions.push(line.slice(2).trim());
  }

  return actions;
}

export function parseScope(scopePath, root) {
  const text = readText(scopePath);
  const status = text.match(/^Status:\s+(.+)$/m)?.[1] ?? "Unknown";
  const outOfScopeSection =
    text.split("## Out Of Scope")[1]?.split("## Scope Decisions")[0] ?? "";
  const outOfScopeItems = outOfScopeSection
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim());

  return {
    status,
    outOfScopeItems,
    hasPendingDecisionLanguage: /Pending Decision/i.test(text),
    sourceLabel: normalize(path.relative(root, scopePath)),
  };
}
