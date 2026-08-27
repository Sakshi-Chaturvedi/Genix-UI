import { scoringTests } from "./test-cases.js";

function runAll() {
  console.log("==========================================");
  console.log("Executing Scoring Integrity Tests...");
  console.log("==========================================\n");

  let currentCategory = "";
  let passed = 0;
  let failed = 0;

  for (const test of scoringTests) {
    if (test.category !== currentCategory) {
      console.log(`\n[${test.category}]`);
      currentCategory = test.category;
    }

    try {
      const result = test.run();
      if (result.passed) {
        console.log(`✅ ${test.name}`);
        passed++;
      } else {
        console.log(`❌ ${test.name}`);
        console.log(`   [Failed] ${result.message}`);
        failed++;
      }
    } catch (err: any) {
      console.log(`❌ ${test.name}`);
      console.log(`   [Error] ${err.message}`);
      failed++;
    }
  }

  console.log("\n==========================================");
  console.log("SUMMARY");
  console.log("=======");
  console.log(`Passed: ${passed}/${scoringTests.length}`);
  console.log(`Failed: ${failed}`);
  console.log("=========\n");

  if (failed > 0) process.exit(1);
}

runAll();
