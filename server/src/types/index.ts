export interface SlideContent {
  title: string;
  content: string[];
  speakerNotes?: string;
}

export interface PresentationStructure {
  title: string;
  slides: SlideContent[];
}

export interface TemplateStyle {
  colors: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
  };
  fonts: {
    title?: string;
    body?: string;
  };
  layouts: any[];
  images: string[];
}

export interface LLMResponse {
  structure: PresentationStructure;
}