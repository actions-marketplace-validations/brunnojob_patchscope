import { readFile } from "node:fs/promises";
import { analyzeDiff, toMarkdown, limits } from "../src/engine.js";
const args = process.argv.slice(2);
if (!args.length || args.includes("--help")) {
  console.log(
    "Usage: node scripts/cli.mjs <patch.diff|-> [--format markdown|json]\nReads stdin when the path is -. Does not access the network.",
  );
  process.exit(args.length ? 0 : 1);
}
try {
  const formatAt = args.indexOf("--format");
  const format = formatAt < 0 ? "markdown" : args[formatAt + 1];
  if (!["markdown", "json"].includes(format))
    throw new Error("Format must be markdown or json.");
  let patch;
  if (args[0] === "-") {
    const chunks = [];
    let size = 0;
    for await (const chunk of process.stdin) {
      size += chunk.length;
      if (size > limits.bytes) throw new Error("Patch exceeds 2 MB.");
      chunks.push(chunk);
    }
    patch = Buffer.concat(chunks).toString("utf8");
  } else {
    const { stat } = await import("node:fs/promises");
    if ((await stat(args[0])).size > limits.bytes)
      throw new Error("Patch exceeds 2 MB.");
    patch = await readFile(args[0], "utf8");
  }
  const report = analyzeDiff(patch);
  console.log(
    format === "json" ? JSON.stringify(report, null, 2) : toMarkdown(report),
  );
} catch (error) {
  console.error(`PatchScope: ${error.message}`);
  process.exitCode = 1;
}
