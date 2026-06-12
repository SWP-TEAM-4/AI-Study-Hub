// ─────────────────────────────────────────────────────────────────────────────
// generateMswHandlers.cjs
// ─────────────────────────────────────────────────────────────────────────────
//
// 🔧 Script tự động sinh MSW handlers từ file OpenAPI JSON contract.
//
// CÁCH DÙNG:
//   node scripts/generateMswHandlers.cjs
//
// INPUT:  ../ai_study_hub_mock_openapi_contract.json
// OUTPUT: src/mocks/generated/handlers.ts  (auto-generated, KHÔNG sửa tay)
//
// Khi backend thêm API mới → cập nhật file JSON → chạy lại script → done!
// ─────────────────────────────────────────────────────────────────────────────

const fs = require("fs");
const path = require("path");

// ─── Config ───────────────────────────────────────────────────────────────────
const INPUT_FILE = path.resolve(
  __dirname,
  "../../ai_study_hub_mock_openapi_contract.json"
);
const OUTPUT_FILE = path.resolve(
  __dirname,
  "../src/mocks/generated/handlers.ts"
);
const BASE_URL = "http://localhost:8080";

// ─── Load OpenAPI JSON ────────────────────────────────────────────────────────
const openapi = JSON.parse(fs.readFileSync(INPUT_FILE, "utf-8"));

// ─── Helper: Convert OpenAPI path params ({id}) → MSW params (:id) ───────────
function convertPath(openapiPath) {
  return openapiPath.replace(/\{([^}]+)\}/g, ":$1");
}

// ─── Helper: Generate handler variable name ───────────────────────────────────
function handlerName(method, openapiPath) {
  const parts = openapiPath
    .replace(/^\/api\//, "")
    .replace(/\{[^}]+\}/g, "ById")
    .split("/")
    .filter(Boolean);
  const name = parts
    .map((p, i) =>
      i === 0
        ? p.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
        : p.charAt(0).toUpperCase() +
          p.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    )
    .join("");
  return method.toLowerCase() + name.charAt(0).toUpperCase() + name.slice(1);
}

// ─── Build handlers ───────────────────────────────────────────────────────────
const handlers = [];
const endpoints = [];

Object.entries(openapi.paths).forEach(([openapiPath, methods]) => {
  Object.entries(methods).forEach(([method, operation]) => {
    const tag = operation.tags?.[0] || "Other";
    const summary = operation.summary || "";
    const mswPath = convertPath(openapiPath);
    const fullUrl = `${BASE_URL}${mswPath}`;
    const httpMethod = method.toLowerCase();

    // Get response example
    const successResponse =
      operation.responses?.["200"] || operation.responses?.["201"];
    const example =
      successResponse?.content?.["application/json"]?.example || null;
    const statusCode = operation.responses?.["201"] ? 201 : 200;

    // Get error responses
    const errors = {};
    Object.entries(operation.responses || {}).forEach(([code, resp]) => {
      if (code !== "200" && code !== "201") {
        const errExample = resp?.content?.["application/json"]?.example;
        if (errExample) errors[code] = errExample;
      }
    });

    const name = handlerName(method, openapiPath);

    endpoints.push({
      name,
      method: httpMethod,
      path: openapiPath,
      mswPath: fullUrl,
      tag,
      summary,
      example,
      statusCode,
      errors,
    });
  });
});

// ─── Group by tag for organized output ────────────────────────────────────────
const byTag = {};
endpoints.forEach((ep) => {
  if (!byTag[ep.tag]) byTag[ep.tag] = [];
  byTag[ep.tag].push(ep);
});

// ─── Generate TypeScript output ───────────────────────────────────────────────
let output = `// ═══════════════════════════════════════════════════════════════════════════════
// ⚠️  FILE NÀY ĐƯỢC TỰ ĐỘNG SINH BỞI scripts/generateMswHandlers.cjs
// ⚠️  KHÔNG SỬA TAY FILE NÀY — Chạy lại script khi cập nhật API contract
//
// Generated: ${new Date().toISOString()}
// Source:    ai_study_hub_mock_openapi_contract.json
// Total:     ${endpoints.length} handlers
// ═══════════════════════════════════════════════════════════════════════════════

import { http, HttpResponse, delay } from "msw";

// ─── Delay config (ms) — giả lập network latency ─────────────────────────────
const MOCK_DELAY = 300;

`;

// Generate handlers grouped by module
Object.keys(byTag)
  .sort()
  .forEach((tag) => {
    const eps = byTag[tag];
    output += `// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ${tag.toUpperCase()} (${eps.length} endpoints)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    eps.forEach((ep) => {
      output += `/**
 * ${ep.method.toUpperCase()} ${ep.path}
 * ${ep.summary}
 * Tag: ${ep.tag}
 */
`;
    });
    output += "\n";
  });

// Generate the actual handler array
output += `// ═══════════════════════════════════════════════════════════════════════════════
// HANDLER ARRAY — Import này vào browser.ts hoặc handlers/index.ts
// ═══════════════════════════════════════════════════════════════════════════════

export const generatedHandlers = [\n`;

Object.keys(byTag)
  .sort()
  .forEach((tag) => {
    const eps = byTag[tag];
    output += `\n  // ── ${tag} ──────────────────────────────────────────────\n`;

    eps.forEach((ep) => {
      const exampleStr = ep.example
        ? JSON.stringify(ep.example, null, 2)
            .split("\n")
            .map((line, i) => (i === 0 ? line : "    " + line))
            .join("\n")
        : '{ success: true, message: "Success" }';

      output += `
  // ${ep.method.toUpperCase()} ${ep.path} — ${ep.summary || ep.tag}
  http.${ep.method}("${ep.mswPath}", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    ${exampleStr},
    { status: ${ep.statusCode} });
  }),\n`;
    });
  });

output += `\n];\n`;

// ─── Write output ─────────────────────────────────────────────────────────────
const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
fs.writeFileSync(OUTPUT_FILE, output, "utf-8");

console.log(`✅ Generated ${endpoints.length} MSW handlers`);
console.log(`📁 Output: ${OUTPUT_FILE}`);
console.log(`\n📊 Breakdown by module:`);
Object.keys(byTag)
  .sort()
  .forEach((tag) => {
    console.log(`   ${tag.padEnd(30)} ${byTag[tag].length} endpoints`);
  });
