export interface GenerationRequest {
  text: string;
  guidance?: string;
  apiKey: string;
  llmProvider: 'openai' | 'anthropic' | 'gemini' | 'openrouter';
  templateFile: File;
  model?: string;
  generateSpeakerNotes?: boolean;
}

export interface GenerationResponse {
  success: boolean;
  downloadUrl?: string;
  error?: string;
  preview?: SlidePreview[];
}

export interface SlidePreview {
  title: string;
  content: string[];
  speakerNotes?: string;
  slideNumber: number;
}

export interface LLMProvider {
  id: 'openai' | 'anthropic' | 'gemini' | 'openrouter';
  name: string;
  placeholder: string;
  models?: string[];
}

export interface UseCaseTemplate {
  id: string;
  name: string;
  description: string;
  guidance: string;
  icon: string;
}