import {
  readFile,
  appendFile,
  writeFile,
  mkdtemp,
  stat,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { analyzeDiff, toMarkdown, limits } from "../src/engine.js";
try {
  const input = process.env.INPUT_DIFF_FILE;
  if (!input) throw new Error("diff-file is required.");
  if ((await stat(input)).size > limits.bytes)
    throw new Error("Patch exceeds 2 MB.");
  const report = analyzeDiff(await readFile(input, "utf8"));
  const markdown = toMarkdown(report),
    dir = await mkdtemp(join(tmpdir(), "patchscope-"));
  const jsonPath = join(dir, "review.json"),
    markdownPath = join(dir, "review.md");
  await writeFile(jsonPath, JSON.stringify(report, null, 2));
  await writeFile(markdownPath, markdown);
  if (process.env.GITHUB_OUTPUT)
    await appendFile(
      process.env.GITHUB_OUTPUT,
      `report-json=${jsonPath}\nreport-markdown=${markdownPath}\nhigh-count=${report.summary.counts.high}\n`,
    );
  if (process.env.INPUT_SUMMARY !== "false" && process.env.GITHUB_STEP_SUMMARY)
    await appendFile(process.env.GITHUB_STEP_SUMMARY, markdown + "\n");
  console.log(
    `PatchScope: ${report.summary.files} files; ${report.summary.findings} prompts. Reports: ${dir}`,
  );
} catch (error) {
  console.error(`PatchScope: ${error.message}`);
  process.exitCode = 1;
}
