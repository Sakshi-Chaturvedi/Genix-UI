import { validateQuality } from "./tests/ai/validators/output.validator.js";
import { ruleRegistry } from "./tests/ai/rules/rule.registry.js";
import { fixtures } from "./tests/ai/scoring/fixtures.js";

function clone(obj: any) {
  return JSON.parse(JSON.stringify(obj));
}

const res1 = validateQuality(fixtures.button, ruleRegistry.button);
console.log("Direct Score:", res1.score.percentage);
console.log("Direct Failed:", res1.failed);

const mutated = clone(fixtures.button);
const res2 = validateQuality(mutated, ruleRegistry.button);
console.log("Mutated Score:", res2.score.percentage);
console.log("Mutated Failed:", res2.failed);
