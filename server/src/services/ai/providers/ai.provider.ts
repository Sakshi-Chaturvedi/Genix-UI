import { IAIRequest, IAIResponse } from "../../../types/ai.types.js";

export interface IAIProvider {
  id: string;
  generate(request: IAIRequest): Promise<IAIResponse>;
}
