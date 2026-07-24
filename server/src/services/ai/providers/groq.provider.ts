import { IAIProvider } from "./ai.provider.js";
import { IAIRequest, IAIResponse } from "../../../types/ai.types.js";
import { ResponseParser } from "../parsers/response.parser.js";
import aiConfig from "../../../config/ai.config.js";
import logger from "../../../utils/logger.js";
import { PromptOptimizer } from "../../../utils/ai/prompt.optimizer.js";
import { ProviderMetricsCollector } from "../../../utils/ai/provider.metrics.js";
import { AuthenticationError, AIProviderTimeoutError, InvalidAIResponseError } from "../../../utils/ai/ai.errors.js";
import { wrapProviderError } from "../../../utils/ai/retry.strategy.js";

export class GroqProvider implements IAIProvider {
  public readonly id = "groq";

  public async generate(request: IAIRequest): Promise<IAIResponse> {
    const providerConfig = aiConfig.providers.groq;
    const apiKey = providerConfig.apiKey;
    if (!apiKey) {
      throw new AuthenticationError("Groq API key is not configured.");
    }

    const model = providerConfig.model;
    const endpoint = "https://api.groq.com/openai/v1/chat/completions";
    const temperature = request.options?.temperature ?? aiConfig.temperature;
    const maxOutputTokens = request.options?.maxTokens ?? aiConfig.maxTokens;
    const timeoutMs = request.options?.timeout ?? aiConfig.timeoutMs;
    const minLength = aiConfig.minResponseLength;
    const maxSizeBytes = aiConfig.maxResponseSizeBytes;

    const systemInstruction = PromptOptimizer.optimizeSystemInstruction(request.systemInstruction);
    const userPrompt = PromptOptimizer.optimizeUserPrompt(request.prompt) || "";

    const metrics = new ProviderMetricsCollector(this.id, model, request.feature);
    metrics.recordPrompt(systemInstruction + userPrompt);

    logger.info("[AI] Groq request started", {
      provider: this.id,
      model,
      timeoutMs,
    });

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => {
      metrics.recordTimeout();
      controller.abort();
    }, timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: userPrompt }
          ],
          temperature,
          max_tokens: maxOutputTokens,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutHandle);

      if (!response.ok) {
        const rawBody = await response.text();
        const status = response.status;

        let providerMessage = rawBody;
        let providerCode: string | undefined;
        try {
          const parsed = JSON.parse(rawBody);
          providerMessage = parsed?.error?.message ?? parsed?.message ?? rawBody;
          providerCode = parsed?.error?.code ?? parsed?.error?.type ?? undefined;
        } catch { /* not JSON — keep rawBody */ }

        logger.error("[AI] Groq HTTP error", {
          provider: this.id,
          status,
          providerCode,
          rawBody,
        });

        const detail = providerCode ? `[${providerCode}] ${providerMessage}` : providerMessage;
        throw { status, message: detail, providerCode, rawBody };
      }

      const resBody = await response.json() as any;
      const responseText = resBody?.choices?.[0]?.message?.content ?? "";
      const responseSizeBytes = Buffer.byteLength(responseText, "utf8");

      if (!responseText || responseText.trim().length === 0) {
        throw new InvalidAIResponseError("Groq returned an empty response");
      }
      if (responseText.trim().length < minLength) {
        throw new InvalidAIResponseError(
          `Groq response too short (${responseText.trim().length} chars, min ${minLength})`
        );
      }
      if (responseSizeBytes > maxSizeBytes) {
        throw new InvalidAIResponseError(
          `Groq response exceeds max allowed size (${responseSizeBytes} bytes, max ${maxSizeBytes})`
        );
      }

      metrics.recordResponse(responseText);

      const parsedData = ResponseParser.parse(responseText, this.id, model);
      metrics.recordSuccess();

      const snap = metrics.snapshot();
      return {
        success: true,
        files: parsedData.files,
        explanation: parsedData.explanation,
        metadata: {
          latencyMs: snap.latencyMs,
          model,
          provider: this.id,
          tokensUsed: snap.estimatedTokensUsed,
          retryCount: 0,
        },
      };
    } catch (err: any) {
      clearTimeout(timeoutHandle);
      if (err.name === "AbortError") {
        throw new AIProviderTimeoutError(timeoutMs, this.id);
      }
      wrapProviderError(err, this.id, timeoutMs);
    }
  }

  public async healthCheck(): Promise<any> {
    const providerConfig = aiConfig.providers.groq;
    const apiKey = providerConfig.apiKey;
    if (!apiKey) return { ok: false, model: providerConfig.model, latencyMs: 0, errorType: "Authentication Error", errorMessage: "Missing API key" };

    const model = providerConfig.model;
    const endpoint = "https://api.groq.com/openai/v1/chat/completions";
    const start = performance.now();

    try {
      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => controller.abort(), 12000);
      let rawBody = "";
      let httpStatus = 0;

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
          body: JSON.stringify({ model, messages: [{ role: "user", content: "Reply with one word: Hello" }], max_tokens: 10 }),
          signal: controller.signal,
        });
        httpStatus = response.status;
        rawBody = await response.text();

        if (!response.ok) {
          let providerMessage = rawBody;
          let providerCode: string | undefined;
          try { const p = JSON.parse(rawBody); providerMessage = p?.error?.message ?? rawBody; providerCode = p?.error?.code ?? p?.error?.type; } catch {}
          const lc = providerMessage.toLowerCase();
          let errorType = "Provider Internal Error";
          if (httpStatus === 401 || httpStatus === 403) errorType = "Authentication Error";
          else if (httpStatus === 404 || lc.includes("not found")) errorType = "Model Not Found";
          else if (lc.includes("decommissioned")) errorType = "Model Deprecated";
          else if (httpStatus === 429 || lc.includes("rate limit") || lc.includes("quota")) errorType = "Rate Limited";
          return { ok: false, model, latencyMs: Math.round(performance.now() - start), httpStatus, errorType, errorMessage: providerMessage, providerCode, rawBody };
        }

        const resBody = JSON.parse(rawBody);
        const text = resBody?.choices?.[0]?.message?.content ?? "";
        return { ok: text.trim().length > 0, model, latencyMs: Math.round(performance.now() - start), rawText: text, httpStatus };
      } finally {
        clearTimeout(timeoutHandle);
      }
    } catch (err: any) {
      const lc = (err?.message ?? "").toLowerCase();
      const errorType = (err?.name === "AbortError" || lc.includes("timeout")) ? "Timeout" : "Network Error";
      return { ok: false, model, latencyMs: Math.round(performance.now() - start), errorType, errorMessage: err?.message };
    }
  }
}
