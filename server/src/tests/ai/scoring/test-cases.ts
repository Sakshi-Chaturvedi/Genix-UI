import { validateQuality } from "../validators/output.validator.js";
import { ruleRegistry } from "../rules/rule.registry.js";
import { fixtures } from "./fixtures.js";

function clone(obj: any) {
  return JSON.parse(JSON.stringify(obj));
}

export interface IScoringTest {
  category: string;
  name: string;
  run: () => { passed: boolean; message: string };
}

export const scoringTests: IScoringTest[] = [
  // 1. Perfect Fixtures
  {
    category: "Perfect Fixtures",
    name: "Button perfect fixture -> Quality 100%",
    run: () => {
      const res = validateQuality(fixtures.button, ruleRegistry.button);
      const pass = res.score.percentage === 100;
      return { passed: pass, message: `Expected 100%, got ${res.score.percentage}%` };
    }
  },
  {
    category: "Perfect Fixtures",
    name: "Card perfect fixture -> Quality 100%",
    run: () => {
      const res = validateQuality(fixtures.card, ruleRegistry.card);
      const pass = res.score.percentage === 100 && res.failed.length === 0;
      return { passed: pass, message: `Expected 100%, got ${res.score.percentage}%` };
    }
  },

  // 2. Category Isolation & 6. Failure in one category doesn't reduce others
  {
    category: "Category Isolation",
    name: "Missing Accessibility requirement -> only Accessibility score affected",
    run: () => {
      const mutated = clone(fixtures.button);
      // Remove 'aria-label'
      mutated.data.files[0].content = mutated.data.files[0].content.replace(/aria-label=\{[^\}]+\}/g, "");
      const res = validateQuality(mutated, ruleRegistry.button);
      // button a11y rules: ["aria-", "role=", "tabIndex", "onKeyDown"] -> 4 rules. 1 missing -> 25% deduction.
      // 20 weight * 0.75 = 15.
      const pass = res.score.accessibility === 15 && 
                   res.score.typing === 20 &&
                   res.score.architecture === 20 &&
                   res.score.styling === 20 &&
                   res.score.responsiveness === 20;
      return { passed: pass, message: `Expected a11y=15 and others=20, got ${JSON.stringify(res.score)}` };
    }
  },
  {
    category: "Category Isolation",
    name: "Missing TypeScript requirement -> only TypeScript score affected",
    run: () => {
      const mutated = clone(fixtures.button);
      // Remove ': React.FC'
      mutated.data.files[0].content = mutated.data.files[0].content.replace(/: React\.FC<[^>]+>/g, "");
      const res = validateQuality(mutated, ruleRegistry.button);
      const tsPass = res.score.typing < 20;
      const otherPass = res.score.accessibility === 20 &&
                        res.score.architecture === 20 &&
                        res.score.styling === 20 &&
                        res.score.responsiveness === 20;
      return { passed: tsPass && otherPass, message: `Expected TS < 20 and others=20, got ${JSON.stringify(res.score)}` };
    }
  },

  // 3. Proportional Deduction
  {
    category: "Proportional Deduction",
    name: "1/4 requirements missing -> expected deterministic deduction (15/20)",
    run: () => {
      const mutated = clone(fixtures.button);
      // button a11y rules: ["aria-", "role=", "tabIndex", "onKeyDown"]
      mutated.data.files[0].content = mutated.data.files[0].content.replace(/tabIndex=\{0\}/g, "");
      const res = validateQuality(mutated, ruleRegistry.button);
      const pass = res.score.accessibility === 15;
      return { passed: pass, message: `Expected a11y=15, got ${res.score.accessibility}` };
    }
  },
  {
    category: "Proportional Deduction",
    name: "2/4 requirements missing -> expected deterministic deduction (10/20)",
    run: () => {
      const mutated = clone(fixtures.button);
      mutated.data.files[0].content = mutated.data.files[0].content.replace(/tabIndex=\{0\}/g, "").replace(/onKeyDown=\{[^\}]+\}/g, "");
      const res = validateQuality(mutated, ruleRegistry.button);
      const pass = res.score.accessibility === 10;
      return { passed: pass, message: `Expected a11y=10, got ${res.score.accessibility}` };
    }
  },

  // 4. Zero applicable requirements & 7. Non-negative
  {
    category: "Boundary Tests",
    name: "Zero applicable requirements -> full category score",
    run: () => {
      // Button has 0 responsiveness rules.
      const res = validateQuality(fixtures.button, ruleRegistry.button);
      const pass = res.score.responsiveness === 20;
      return { passed: pass, message: `Expected responsiveness=20 (full score), got ${res.score.responsiveness}` };
    }
  },

  // 5. Unmapped mustContain token
  {
    category: "Boundary Tests",
    name: "Unmapped mustContain token causes validation passed: false but DOES NOT reduce numerical quality",
    run: () => {
      const mutated = clone(fixtures.button);
      // Replace all occurrences of 'disabled' to ensure includes('disabled') returns false
      mutated.data.files[0].content = mutated.data.files[0].content.replace(/disabled/g, "isDisabled");
      const res = validateQuality(mutated, ruleRegistry.button);
      const hasFailure = res.failed.some(f => f.includes('"disabled"'));
      const pass = hasFailure && res.score.percentage === 100;
      return { passed: pass, message: `Expected failure on "disabled" but score=100, got failures=${JSON.stringify(res.failed)}, score=${res.score.percentage}` };
    }
  },

  {
    category: "Boundary Tests",
    name: "Score never below 0",
    run: () => {
      const mutated = clone(fixtures.button);
      mutated.data.files[0].content = "export const Broken = () => <div/>;";
      const res = validateQuality(mutated, ruleRegistry.button);
      const pass = res.score.accessibility >= 0 &&
                   res.score.typing >= 0 &&
                   res.score.architecture >= 0 &&
                   res.score.styling >= 0 &&
                   res.score.responsiveness >= 0;
      return { passed: pass, message: `Expected non-negative scores, got ${JSON.stringify(res.score)}` };
    }
  },

  // 8. Quality remains between 0 and 100
  {
    category: "Boundary Tests",
    name: "Final quality remains between 0 and 100",
    run: () => {
      const mutated = clone(fixtures.button);
      mutated.data.files[0].content = ""; // Completely empty
      const res = validateQuality(mutated, ruleRegistry.button);
      const pass = res.score.percentage >= 0 && res.score.percentage <= 100;
      return { passed: pass, message: `Score out of bounds: ${res.score.percentage}` };
    }
  },

  // 9. Duplicate requirements
  {
    category: "Boundary Tests",
    name: "Duplicate requirements are counted only once (Set deduplication)",
    run: () => {
      const customRules = clone(ruleRegistry.button);
      // Add duplicates to accessibility rules
      customRules.accessibilityRules.push("tabIndex");
      customRules.accessibilityRules.push("tabIndex");
      
      const mutated = clone(fixtures.button);
      // Remove tabIndex -> deducts 1 requirement
      mutated.data.files[0].content = mutated.data.files[0].content.replace(/tabIndex=\{0\}/g, "");
      const res = validateQuality(mutated, customRules);
      
      // If it wasn't deduplicated, missing 1 would give score < 15.
      // Deduplicated, it's exactly 15.
      const pass = res.score.accessibility === 15;
      return { passed: pass, message: `Expected exactly 15 (deduplicated), got ${res.score.accessibility}` };
    }
  },

  // 10. Consistency across categories
  {
    category: "Consistency",
    name: "Scoring behavior is consistent across all supported categories",
    run: () => {
      const mutated = clone(fixtures.navbar);
      // Remove @media (responsive rule)
      mutated.data.files[1].content = mutated.data.files[1].content.replace(/@media\s*[^{]+\{[^}]+\}/g, "");
      const res = validateQuality(mutated, ruleRegistry.navbar);
      // Navbar has 1 responsive token (@media). 0/1 pass -> 0/20.
      const pass = res.score.responsiveness === 0;
      return { passed: pass, message: `Expected responsiveness=0, got ${res.score.responsiveness}` };
    }
  }
];
