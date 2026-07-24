/**
 * ResponseNormalizer
 *
 * Different AI providers may return slightly different formats or keys in their responses.
 * The Normalizer maps any provider-specific JSON structure into the standard internal format:
 * {
 *   success: true,
 *   data: {
 *     provider,
 *     model,
 *     files: [{ path, content, type, language }, ...],
 *     metadata: {
 *       provider,
 *       model,
 *       ...
 *     }
 *   }
 * }
 *
 * This ensures that the rest of the application remains decoupled from provider-specific schemas.
 */
export class ResponseNormalizer {
  /**
   * Normalizes a parsed AI provider JSON response.
   *
   * @param rawJson - The extracted JSON object from the model
   * @param provider - The name of the provider (e.g., 'gemini')
   * @param model - The model identifier used (e.g., 'gemini-2.5-flash')
   * @param extraMetadata - Additional metadata such as latencyMs, tokensUsed, etc.
   * @returns Normalized object matching the common application schema
   */
  public static normalize(
    rawJson: Record<string, any>,
    provider: string,
    model: string,
    extraMetadata?: Record<string, any>
  ): Record<string, any> {
    // Determine the files array, handling potential provider differences
    let files: any[] = [];
    if (Array.isArray(rawJson.files)) {
      files = rawJson.files;
    } else if (Array.isArray(rawJson.data?.files)) {
      files = rawJson.data.files;
    } else if (Array.isArray(rawJson.response?.files)) {
      files = rawJson.response.files;
    }

    // Map each file to ensure it matches standard IGeneratedFile interface properties
    const normalizedFiles = files.map((f: any) => {
      if (!f || typeof f !== "object") return f;
      return {
        path: f.path || f.filePath || "",
        content: f.content || f.code || f.fileContent || "",
        type: f.type || "code",
        language: f.language || f.lang || "",
      };
    });

    // Build the common metadata block
    const metadata = {
      provider,
      model,
      ...(extraMetadata || {}),
    };

    // If an explanation was provided inside rawJson, include it at the metadata or data level
    const data: Record<string, any> = {
      provider,
      model,
      files: normalizedFiles,
      metadata,
    };

    if (typeof rawJson.explanation === "string") {
      data.explanation = rawJson.explanation;
    } else if (typeof rawJson.data?.explanation === "string") {
      data.explanation = rawJson.data.explanation;
    }

    return {
      success: true,
      data,
    };
  }
}
