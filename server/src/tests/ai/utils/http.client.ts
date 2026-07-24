import testConfig from "../config/test.config.js";

export interface IHttpResponse {
  ok: boolean;
  status: number;
  data: any;
  latencyMs: number;
}

export async function callAIEndpoint(
  endpoint: string,
  body: Record<string, unknown>
): Promise<IHttpResponse> {
  if (!testConfig.authToken) {
    throw new Error(
      "TEST_JWT_TOKEN environment variable is not set. " +
      "Login via POST /api/auth/login and set the returned accessToken as TEST_JWT_TOKEN before running tests."
    );
  }

  const url = `${testConfig.apiBaseUrl}${endpoint}`;
  const startTime = performance.now();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), testConfig.timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${testConfig.authToken}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const latencyMs = Math.round(performance.now() - startTime);
    let data: any = null;

    try {
      data = await response.json();
    } catch {
      data = { error: "Response body is not valid JSON" };
    }

    return { ok: response.ok, status: response.status, data, latencyMs };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    if (err.name === "AbortError") {
      return { ok: false, status: 504, data: { error: "Request timed out" }, latencyMs };
    }
    return { ok: false, status: 0, data: { error: err.message || "Network error" }, latencyMs };
  } finally {
    clearTimeout(timeoutId);
  }
}
