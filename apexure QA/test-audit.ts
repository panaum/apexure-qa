import { runAudit } from "./WcagAuditor";

const TARGET_URL = "https://example.com";

(async () => {
  console.log(`Running WCAG 2.2 AA audit on: ${TARGET_URL}\n`);

  const result = await runAudit(TARGET_URL);

  console.log(`✅ Passes    : ${result.passes.length}`);
  console.log(`❌ Violations: ${result.violations.length}`);

  if (result.violations.length > 0) {
    console.log("\nViolations found:");
    result.violations.forEach((v, i) => {
      console.log(`  ${i + 1}. [${v.impact?.toUpperCase()}] ${v.id} — ${v.help}`);
    });
  } else {
    console.log("\nNo violations found 🎉");
  }
})();
