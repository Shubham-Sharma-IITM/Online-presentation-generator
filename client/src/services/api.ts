import axios from 'axios';
import { GenerationRequest, GenerationResponse } from '../types';

const API_BASE = '/api';

export const generatePresentation = async (request: GenerationRequest): Promise<GenerationResponse> => {
  const formData = new FormData();
  formData.append('text', request.text);
  formData.append('guidance', request.guidance || '');
  formData.append('apiKey', request.apiKey);
  formData.append('llmProvider', request.llmProvider);
  if (request.model) {
    formData.append('model', request.model);
  }
  formData.append('templateFile', request.templateFile);

  try {
    const response = await axios.post(`${API_BASE}/generate`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 minutes
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to generate presentation'
      };
    }
    return {
      success: false,
      error: 'Network error occurred'
    };
  }
};

export const downloadPresentation = (downloadUrl: string, filename: string = 'presentation.pptx') => {
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};