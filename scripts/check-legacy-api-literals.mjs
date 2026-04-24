import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();

const trackedSourceExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
]);

const literalPattern = /(?<=["'`])\/api\/(?!v\d+(?:\/|["'`]|$))[^"'`\s)]+/g;

const allowlist = [
  {
    file: "src/app/offerter/publik/[token]/_api/public-offer.api.ts",
    reason: "Public offer signing and PDF routes stay intentionally non-versioned.",
    patterns: [/^\/api\/offers\/public\//],
  },
  {
    file: "src/modules/core/voice/ui/hooks/use-vapi.ts",
    reason: "The voice assistant uses a non-versioned AI integration endpoint.",
    patterns: [/^\/api\/ai\/hotel-info$/],
  },
  {
    file: "src/modules/demos/hotel/ui/hooks/use-hotel-sse.ts",
    reason: "Demo realtime updates use the shared SSE infrastructure endpoint.",
    patterns: [/^\/api\/sse$/],
  },
  {
    file: "src/modules/demos/hotel/api/rooms.ts",
    reason: "Hotel demo room APIs stay outside the ERP v1 surface.",
    patterns: [
      /^\/api\/demos\/hotel\/rooms\/book$/,
      /^\/api\/demos\/hotel\/rooms\/cancel$/,
      /^\/api\/demos\/hotel\/rooms$/,
    ],
  },
  {
    file: "src/modules/demos/hotel/api/services.ts",
    reason: "Hotel demo services stay outside the ERP v1 surface.",
    patterns: [
      /^\/api\/demos\/hotel\/\$\{type$/,
      /^\/api\/demos\/hotel\/restaurants$/,
      /^\/api\/demos\/hotel\/restaurants\/\$\{id\}$/,
      /^\/api\/demos\/hotel\/activities$/,
      /^\/api\/demos\/hotel\/activities\/\$\{id\}$/,
      /^\/api\/demos\/hotel\/amenities$/,
      /^\/api\/demos\/hotel\/amenities\/\$\{id\}$/,
      /^\/api\/demos\/hotel\/info$/,
    ],
  },
  {
    file: "src/modules/demos/hotel/api/seed.ts",
    reason: "Hotel demo seed flow stays demo-scoped and non-versioned.",
    patterns: [/^\/api\/demos\/hotel\/seed$/],
  },
  {
    file: "src/modules/demos/hotel/domain/seed.entity.ts",
    reason: "The demo seed domain constant intentionally points at the demo seed route.",
    patterns: [/^\/api\/demos\/hotel\/seed$/],
  },
  {
    file: "src/platform/api/openapi-ai-paths.ts",
    reason: "OpenAPI specs document non-versioned AI integration endpoints.",
    patterns: [/^\/api\/ai\//],
  },
  {
    file: "src/platform/api/openapi-components.ts",
    reason: "OpenAPI components reference non-versioned AI integration examples.",
    patterns: [/^\/api\/ai\/crm\/update$/],
  },
  {
    file: "src/proxy.ts",
    reason: "Proxy allowlists intentionally include non-versioned public and integration prefixes.",
    patterns: [
      /^\/api\/auth\/$/,
      /^\/api\/docs$/,
      /^\/api\/demo\/$/,
      /^\/api\/ai\/$/,
      /^\/api\/n8n\/$/,
      /^\/api\/offers\/public\/$/,
      /^\/api\/$/,
    ],
  },
];

const allowlistByFile = new Map(allowlist.map((entry) => [entry.file, entry]));

function normalize(filePath) {
  return filePath.replaceAll("\\", "/");
}

function trackedFiles() {
  const output = execSync("git ls-files", {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  return output.split(/\r?\n/).filter(Boolean).map(normalize);
}

function shouldScan(file) {
  const extension = path.extname(file);
  if (!trackedSourceExtensions.has(extension)) return false;
  if (!file.startsWith("src/")) return false;
  if (file.startsWith("src/app/api/") && file.endsWith("/route.ts")) return false;
  return true;
}

function findLiterals(file) {
  const text = fs.readFileSync(path.join(root, file), "utf8");
  const findings = [];

  for (const match of text.matchAll(literalPattern)) {
    const endpoint = match[0];
    const index = match.index ?? 0;
    const before = text.slice(0, index);
    const line = before.split("\n").length;
    findings.push({ endpoint, line });
  }

  return findings;
}

const unapprovedFindings = [];
let approvedCount = 0;

for (const file of trackedFiles()) {
  if (!shouldScan(file)) continue;

  const findings = findLiterals(file);
  if (findings.length === 0) continue;

  const allowEntry = allowlistByFile.get(file);

  for (const finding of findings) {
    const approved = allowEntry?.patterns.some((pattern) => pattern.test(finding.endpoint)) ?? false;

    if (approved) {
      approvedCount += 1;
      continue;
    }

    unapprovedFindings.push({
      file,
      line: finding.line,
      endpoint: finding.endpoint,
    });
  }
}

if (unapprovedFindings.length > 0) {
  console.error("Legacy API literal check failed.");
  console.error("Found non-versioned `/api/*` literals outside route files that are not on the explicit allowlist:");
  for (const finding of unapprovedFindings) {
    console.error(`- ${finding.file}:${finding.line} -> ${finding.endpoint}`);
  }
  console.error("Move browser/product flows to `/api/v1`, or document a deliberate non-versioned exception in this guard and the versioning docs.");
  process.exit(1);
}

console.log(`Legacy API literal check passed (${approvedCount} allowlisted non-versioned literals, no unapproved findings).`);
