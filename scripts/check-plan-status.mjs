import fs from "node:fs";
import { planStatusOutputPath, readText, renderPlanStatus } from "./lib/plan-status.mjs";

const root = process.cwd();
const writeMode = process.argv.includes("--write");
const outputPath = planStatusOutputPath(root);

const nextContent = renderPlanStatus(root);
const currentContent = fs.existsSync(outputPath) ? readText(outputPath) : null;

if (writeMode) {
  fs.writeFileSync(outputPath, nextContent, "utf8");
  console.log(`Wrote docs/PLAN_STATUS.md.`);
  process.exit(0);
}

if (currentContent === nextContent) {
  console.log("Plan status is up to date.");
  process.exit(0);
}

console.error("Plan status is out of date.");
console.error("Run `npm run check:plan-status:write` and commit the result.");
process.exit(1);
