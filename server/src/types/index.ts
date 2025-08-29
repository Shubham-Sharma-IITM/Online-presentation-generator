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
    accent1?: string;
    accent2?: string;
    accent3?: string;
    accent4?: string;
    accent5?: string;
    accent6?: string;
    background?: string;
    text?: string;
    scheme?: string;
  };
  fonts: {
    title?: string;
    body?: string;
    heading?: string;
    titleSize?: number;
    bodySize?: number;
    headingSize?: number;
  };
  layouts: any[];
  images: string[];
  masterSlides: any[]; // Added this missing property
}

export interface LLMResponse {
  structure: PresentationStructure;
}