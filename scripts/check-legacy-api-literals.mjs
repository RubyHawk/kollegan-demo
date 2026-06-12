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

const routeFilePattern = /^src\/app\/api(?:\/.*)?\/route\.[jt]sx?$/;

const allowlist = [
  {
    file: "src/platform/weather/smhi.ts",
    reason: "SMHI open data API is an external third-party endpoint, not an internal app route.",
    patterns: [/^\/api\/category\//],
  },
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
      /^\/api\/demos\/hotel\/\$\{type\b/,
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
      /^\/api\/health$/,
      /^\/api\/offers\/public\/$/,
      /^\/api\/$/,
    ],
  },
  {
    file: "src/modules/supporting/compliance/application/evidence-collectors/security-headers.collector.ts",
    reason: "Security-header collection intentionally probes the non-versioned health endpoint via the configured app URL.",
    patterns: [/^\/api\/health$/],
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
  if (routeFilePattern.test(file)) return false;
  return true;
}

const stringLiteralPattern = /(["'])(?:\\.|(?!\1)[^\\\r\n])*\1|`(?:\\.|[^\\])*?`/gs;
const directEndpointPattern = /^\/api\/(?!v\d+(?:\/|$))[^"'`\s)]*/g;
const hostPrefixedEndpointPattern = /https?:\/\/[^\s"'`]+(\/api\/(?!v\d+(?:\/|$))[^"'`\s)]*)/g;
const templatePrefixedEndpointPattern = /\$\{[^}]+\}[^"'`]*?(\/api\/(?!v\d+(?:\/|$))[^"'`\s)]*)/g;

function lineNumber(text, index) {
  return text.slice(0, index).split("\n").length;
}

function collectPatternMatches(content, literalOffset, fullText, pattern, endpointGroup = 0) {
  const findings = [];

  for (const match of content.matchAll(pattern)) {
    const endpoint = match[endpointGroup];
    if (!endpoint) continue;

    const matchIndex = match.index ?? 0;
    const endpointOffset = match[0].lastIndexOf(endpoint);
    const absoluteIndex = literalOffset + matchIndex + Math.max(endpointOffset, 0);

    findings.push({
      endpoint,
      line: lineNumber(fullText, absoluteIndex),
    });
  }

  return findings;
}

function findLiterals(file) {
  const text = fs.readFileSync(path.join(root, file), "utf8");
  const findings = [];

  for (const literal of text.matchAll(stringLiteralPattern)) {
    const raw = literal[0];
    const literalOffset = (literal.index ?? 0) + 1;
    const content = raw.slice(1, -1);

    findings.push(...collectPatternMatches(content, literalOffset, text, directEndpointPattern));
    findings.push(...collectPatternMatches(content, literalOffset, text, hostPrefixedEndpointPattern, 1));
    findings.push(...collectPatternMatches(content, literalOffset, text, templatePrefixedEndpointPattern, 1));
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
