import { ProviderOrchestrator } from "./utils/ai/provider.orchestrator.js";
import { ModelUnavailableError } from "./utils/ai/ai.errors.js";
import { IAIProvider } from "./services/ai/providers/ai.provider.js";
import { IAIRequest, IAIResponse } from "./types/ai.types.js";

class MockProvider implements IAIProvider {
  constructor(public id: string, private err: any) {}
  async generate(r: IAIRequest): Promise<IAIResponse> { throw this.err; }
  async healthCheck() { return {}; }
}

async function test() {
  // Check initial state
  console.log("Initial disabledProviders:", (ProviderOrchestrator as any).disabledProviders);
  
  // Simulate a ModelUnavailableError
  const err = new ModelUnavailableError("Model decommissioned");
  const p = new MockProvider("pModel", err);
  const f = new MockProvider("fallback", null);
  
  // Make fallback succeed
  (f as any).generate = async () => ({
    success: true, data: { files: [] }, metadata: { provider: "fallback", model: "x", latencyMs: 1, tokensUsed: 0 }
  });
  
  const orch = new ProviderOrchestrator([p, f], ["pModel", "fallback"]);
  console.log("Before execute - providerOrder should be: pModel, fallback");
  
  try {
    const result = await orch.execute({ prompt: "test", feature: "generate" });
    console.log("Responder:", result.response.metadata?.provider);
    console.log("pModel callCount: should be 1");
  } catch (e: any) {
    console.log("Error:", e.message);
  }
  
  console.log("After execute - disabledProviders:", (ProviderOrchestrator as any).disabledProviders);
  
  // Now clear and re-run
  (ProviderOrchestrator as any).disabledProviders.clear();
  (ProviderOrchestrator as any).cooldowns.clear();
  console.log("After reset - disabledProviders:", (ProviderOrchestrator as any).disabledProviders);
  
  const p2 = new MockProvider("pModel2", err);
  (f as any).callCount2 = 0;
  const orch2 = new ProviderOrchestrator([p2, f], ["pModel2", "fallback"]);
  console.log("Second orch priority: pModel2, fallback");
  const result2 = await orch2.execute({ prompt: "test", feature: "generate" });
  console.log("Second responder:", result2.response.metadata?.provider);
  console.log("p2 callCount:", (p2 as any).callCount ?? 0);
}

test().catch(console.error);
