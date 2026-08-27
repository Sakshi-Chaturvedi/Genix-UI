/**
 * MockProvider — implements IAIProvider so the ProviderOrchestrator can be
 * tested deterministically without any real network calls.
 *
 * Each instance holds a behaviour descriptor that controls exactly what the
 * provider will do when generate() is called:
 *
 *   - "success"         → resolve with a valid IAIResponse immediately
 *   - "throw"           → throw the supplied error immediately
 *   - "throw-after-n"  → succeed for the first (n) calls, then throw
 *   - "delay-then-ok"  → wait `delayMs` then resolve (simulates slow provider)
 *
 * callCount is tracked so tests can assert retry / fallback counters.
 */
import { IAIProvider } from "../../../services/ai/providers/ai.provider.js";
import { IAIRequest, IAIResponse } from "../../../types/ai.types.js";

export type MockBehaviour =
  | { kind: "success"; latencyMs?: number }
  | { kind: "throw"; error: Error }
  | { kind: "throw-after-n"; successCount: number; error: Error }
  | { kind: "delay-then-ok"; delayMs: number };

/** Minimal valid IAIResponse returned by successful mock providers */
function buildSuccessResponse(providerId: string): IAIResponse {
  return {
    success: true,
    data: {
      files: [
        {
          path: "Mock.tsx",
          type: "code",
          language: "typescript",
          content: "export const Mock = () => <div />;",
        },
      ],
      explanation: "Mock provider response",
    },
    metadata: {
      provider: providerId,
      model: `mock-model-${providerId}`,
      latencyMs: 10,
      tokensUsed: 100,
      promptVersion: "mock-v1",
    },
  } as unknown as IAIResponse;
}

export class MockProvider implements IAIProvider {
  public readonly id: string;
  private behaviour: MockBehaviour;
  public callCount = 0;

  constructor(id: string, behaviour: MockBehaviour) {
    this.id = id;
    this.behaviour = behaviour;
  }

  async generate(request: IAIRequest): Promise<IAIResponse> {
    this.callCount++;

    const b = this.behaviour;

    switch (b.kind) {
      case "success": {
        if (b.latencyMs) {
          await new Promise((r) => setTimeout(r, b.latencyMs));
        }
        return buildSuccessResponse(this.id);
      }

      case "throw": {
        throw b.error;
      }

      case "throw-after-n": {
        if (this.callCount <= b.successCount) {
          return buildSuccessResponse(this.id);
        }
        throw b.error;
      }

      case "delay-then-ok": {
        await new Promise((r) => setTimeout(r, b.delayMs));
        return buildSuccessResponse(this.id);
      }
    }
  }

  async healthCheck(): Promise<any> {
    return { status: "ok", provider: this.id };
  }
}
