import { validateQuality } from "../validators/output.validator.js";
import { ruleRegistry } from "../rules/rule.registry.js";
import {
  negativeTests,
  adversarialTests,
  getFixtureForComponent,
} from "./mutations/test-cases.js";

async function runNegativeTests() {
  console.log("==========================================");
  console.log("Executing Negative Validator Tests...");
  console.log("==========================================");

  let passedTests = 0;
  const totalTests = negativeTests.length;
  let currentComponent = "";

  for (const test of negativeTests) {
    if (test.component !== currentComponent) {
      console.log(`\n[${test.component}]`);
      currentComponent = test.component;
    }

    const fixture = getFixtureForComponent(test.component);
    const rules = ruleRegistry[test.ruleSetName];

    if (!rules) {
      console.error(`❌ Rule set '${test.ruleSetName}' not found!`);
      continue;
    }

    const mutatedData = test.mutate(fixture);
    const { passed, failed } = validateQuality(mutatedData, rules);

    if (failed.includes(test.expectedFailureMessage)) {
      console.log(`✅ ${test.testName} -> Validator correctly caught: ${test.expectedFailureMessage}`);
      passedTests++;
    } else {
      console.log(`❌ ${test.testName} -> Validator FAILED to catch: ${test.expectedFailureMessage}`);
    }
  }

  console.log("\n==========================================");
  console.log("Executing Adversarial / Security Tests...");
  console.log("==========================================");

  let passedAdversarial = 0;
  const totalAdversarial = adversarialTests.length;

  for (const test of adversarialTests) {
    const fixture = getFixtureForComponent(test.component);
    const rules = ruleRegistry[test.ruleSetName];

    if (!rules) {
      console.error(`❌ Rule set '${test.ruleSetName}' not found!`);
      continue;
    }

    const mutatedData = test.mutate(fixture);
    const { passed, failed } = validateQuality(mutatedData, rules);

    const hasFailureToken = failed.includes(test.expectedFailureMessage);

    if (test.expectedBehavior === "vulnerable") {
      // We expect the validator to NOT catch this (i.e. to incorrectly pass)
      if (!hasFailureToken) {
        console.log(`✅ ${test.testName}`);
        console.log(`   [Vulnerability Confirmed] ${test.description}`);
        passedAdversarial++;
      } else {
        console.log(`❌ ${test.testName}`);
        console.log(`   [Unexpected Behavior] Validator actually caught: ${test.expectedFailureMessage}`);
      }
    } else {
      // Secure behavior expected
      if (test.testName.includes("FORBIDDEN INLINE STYLE")) {
        // We expect it to ignore it (i.e. to pass)
        if (!hasFailureToken) {
          console.log(`✅ ${test.testName}`);
          console.log(`   [Secure/Intended] ${test.description}`);
          passedAdversarial++;
        } else {
          console.log(`❌ ${test.testName}`);
          console.log(`   [Unexpected Behavior] Validator flagged style in test file: ${test.expectedFailureMessage}`);
        }
      } else {
        // We expect it to catch it (i.e. to fail)
        if (hasFailureToken) {
          console.log(`✅ ${test.testName}`);
          console.log(`   [Secure/Intended] ${test.description}`);
          passedAdversarial++;
        } else {
          console.log(`❌ ${test.testName}`);
          console.log(`   [Unexpected Behavior] Validator missed token in comment: ${test.expectedFailureMessage}`);
        }
      }
    }
  }

  console.log("\n==========================================");
  console.log("SUMMARY OF VALIDATION SUITES");
  console.log("==========================================");
  console.log(`1. Existing Negative Tests: ${passedTests}/${totalTests}`);
  console.log(`2. New Adversarial Tests:   ${passedAdversarial}/${totalAdversarial}`);
  console.log("==========================================");

  if (passedTests !== totalTests || passedAdversarial !== totalAdversarial) {
    process.exit(1);
  }
}

runNegativeTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

