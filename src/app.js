import { analyzeDiff, parseDiff, toMarkdown, limits } from "./engine.js";
import { examples } from "./examples.js";
const $ = (id) => document.getElementById(id);
const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
let report = null,
  patchFiles = [];
function notify(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => $("toast").classList.remove("show"), 3500);
}
function sizeLabel() {
  $("inputSize").textContent =
    `${$("patch").value.length.toLocaleString("en")} characters · up to 2 MB`;
}
function inspectFile(index) {
  const file = patchFiles[index];
  if (!file) return;
  $("filePicker").value = String(index);
  $("diff").innerHTML = file.binary
    ? '<div class="empty-state">Binary content is not available in this patch.</div>'
    : file.lines.length
      ? file.lines
          .slice(0, 1500)
          .map(
            (line) =>
              `<div class="diff-line ${line.kind}"><span>${line.old ?? ""}</span><span>${line.new ?? ""}</span><b>${line.kind === "add" ? "+" : line.kind === "remove" ? "−" : " "}</b><code>${esc(line.text)}</code></div>`,
          )
          .join("") +
        (file.lines.length > 1500
          ? '<div class="empty-state">Preview limited to 1,500 lines. All supported lines were analyzed.</div>'
          : "")
      : '<div class="empty-state">No readable hunks for this file.</div>';
}
function renderFindings() {
  if (!report) return;
  const findings = report.findings.filter(
    (f) => $("filter").value === "all" || f.severity === $("filter").value,
  );
  $("findings").innerHTML = findings.length
    ? findings
        .map(
          (f) =>
            `<article class="finding"><div class="finding-top"><span class="severity ${f.severity}">${f.severity.toUpperCase()}</span><button data-path="${esc(f.path)}" class="path-button">${esc(f.path)}${f.line ? `:${f.line}` : ""} ↗</button></div><h4>${esc(f.title)}</h4><p>${esc(f.reason)}</p><label class="check-action"><input type="checkbox"><span>${esc(f.action)}</span></label></article>`,
        )
        .join("")
    : `<div class="empty-state"><strong>${report.findings.length ? "No signals in this filter." : "A focused patch. No heuristic flags."}</strong><p>${report.findings.length ? "Choose another severity to see more prompts." : "Review the change and run the relevant tests as usual."}</p></div>`;
}
function analyze() {
  $("error").hidden = true;
  try {
    report = analyzeDiff($("patch").value);
    patchFiles = parseDiff($("patch").value).files;
    $("results").hidden = false;
    $("resultTitle").textContent =
      report.summary.level === "clear"
        ? "A focused patch. Take a closer look."
        : "Your review starts here.";
    $("resultSubtitle").textContent =
      "Signals to investigate, with the reason and a concrete next step.";
    const { summary } = report;
    $("stats").innerHTML =
      `<div><span>FILES CHANGED</span><strong>${summary.files}</strong></div><div><span>LINES IN THE PATCH</span><strong class="line-totals"><i>+${summary.additions}</i> <em>−${summary.deletions}</em></strong></div><div><span>REVIEW PROMPTS</span><strong>${summary.findings}</strong></div><div><span>PRIORITY SIGNALS</span><strong class="count-high">${summary.counts.high} <small>high</small><span class="count-medium">${summary.counts.medium} <small>medium</small></span></strong></div>`;
    $("warnings").hidden = !report.warnings.length;
    $("warnings").textContent = report.warnings.join(" ");
    $("filePicker").innerHTML = patchFiles
      .map(
        (file, index) =>
          `<option value="${index}">${esc(file.path)} · +${file.additions} / −${file.deletions}</option>`,
      )
      .join("");
    $("filter").value = "all";
    renderFindings();
    inspectFile(0);
    notify(
      `${summary.files} files analyzed locally. ${summary.findings} review prompts.`,
    );
  } catch (error) {
    report = null;
    patchFiles = [];
    $("results").hidden = true;
    $("error").hidden = false;
    $("error").textContent = error.message;
  }
}
function example(name) {
  $("patch").value = examples[name];
  sizeLabel();
  analyze();
  $("workspace").scrollIntoView({
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
  });
}
$("analyze").onclick = analyze;
$("patch").oninput = sizeLabel;
$("patch").onkeydown = (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    analyze();
  }
};
$("tryDemo").onclick = () => example("release");
document
  .querySelectorAll("[data-example]")
  .forEach(
    (button) => (button.onclick = () => example(button.dataset.example)),
  );
$("filter").onchange = renderFindings;
$("filePicker").onchange = () => inspectFile(Number($("filePicker").value));
$("findings").onclick = (event) => {
  const path = event.target.closest("[data-path]")?.dataset.path;
  if (path) inspectFile(patchFiles.findIndex((file) => file.path === path));
};
$("clear").onclick = () => {
  $("patch").value = "";
  report = null;
  patchFiles = [];
  $("results").hidden = true;
  $("error").hidden = true;
  $("diff").replaceChildren();
  $("findings").replaceChildren();
  $("filePicker").replaceChildren();
  sizeLabel();
  $("patch").focus();
  notify("Patch and results cleared from memory.");
};
async function open(file) {
  if (!file) return;
  if (file.size > limits.bytes) {
    notify("File exceeds the 2 MB limit.");
    return;
  }
  try {
    $("patch").value = await file.text();
    sizeLabel();
    analyze();
  } catch {
    notify("Could not read this file. Try pasting the diff.");
  }
}
$("openFile").onclick = () => $("fileInput").click();
$("fileInput").onchange = async (event) => {
  await open(event.target.files[0]);
  event.target.value = "";
};
document.addEventListener("dragover", (event) => {
  event.preventDefault();
});
document.addEventListener("drop", (event) => {
  event.preventDefault();
  if (event.dataTransfer.files.length) open(event.dataTransfer.files[0]);
});
function download(content, type, name) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$("downloadMd").onclick = () => {
  if (report)
    download(
      toMarkdown(report),
      "text/markdown;charset=utf-8",
      "patchscope-review.md",
    );
};
$("downloadJson").onclick = () => {
  if (report)
    download(
      JSON.stringify(report, null, 2),
      "application/json",
      "patchscope-review.json",
    );
};
$("copyReport").onclick = async () => {
  if (!report) return;
  try {
    await navigator.clipboard.writeText(toMarkdown(report));
    notify("Checklist copied.");
  } catch {
    notify("Clipboard unavailable. Use Markdown download instead.");
  }
};
