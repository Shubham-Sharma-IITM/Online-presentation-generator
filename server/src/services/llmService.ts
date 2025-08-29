import axios from 'axios';
import { PresentationStructure } from '../types';

export class LLMService {
  private async callOpenAI(apiKey: string, prompt: string): Promise<string> {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert presentation designer. Create structured presentation content from the given text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 seconds
      }
    );

    return response.data.choices[0].message.content;
  }

  private async callAnthropic(apiKey: string, prompt: string): Promise<string> {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-sonnet-20240229',
        max_tokens: 3000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        timeout: 60000
      }
    );

    return response.data.content[0].text;
  }

  private async callGemini(apiKey: string, prompt: string): Promise<string> {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    return response.data.candidates[0].content.parts[0].text;
  }

  private async callOpenRouter(apiKey: string, prompt: string, model: string): Promise<string> {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert presentation designer. Create structured presentation content from the given text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.HTTP_REFERER || 'http://localhost:3001',
          'X-Title': 'Presentation Generator'
        },
        timeout: 90000 // 90 seconds for OpenRouter
      }
    );

    return response.data.choices[0].message.content;
  }

  async generatePresentationStructure(
    text: string,
    guidance: string,
    apiKey: string,
    provider: 'openai' | 'anthropic' | 'gemini' | 'openrouter',
    model?: string,
    generateSpeakerNotes: boolean = true
  ): Promise<PresentationStructure> {
    const prompt = `
Please analyze the following text and create a structured presentation. ${guidance ? `Follow this guidance: ${guidance}` : ''}

Text to analyze:
${text}

Create a presentation structure with:
1. A compelling title for the overall presentation
2. 6-10 slides with clear titles and bullet points
3. Each slide should have 3-5 bullet points maximum
4. Make it engaging and well-structured
5. Ensure logical flow between slides
${generateSpeakerNotes ? '6. Include detailed speaker notes for each slide to help with presentation delivery' : ''}

Return the result as a JSON object with this exact structure:
{
  "title": "Overall Presentation Title",
  "slides": [
    {
      "title": "Slide Title",
      "content": ["bullet point 1", "bullet point 2", "bullet point 3"],
      ${generateSpeakerNotes ? '"speakerNotes": "Detailed speaker notes explaining the slide content, key points to emphasize, and transition to next slide"' : '"speakerNotes": ""'}
    }
  ]
}

Important:
- Keep bullet points concise but informative
- Ensure each slide has a clear focus
- Create smooth transitions between slides
${generateSpeakerNotes ? '- Speaker notes should be comprehensive and helpful for presentation delivery' : ''}
- Only return the JSON object, no additional text.`;

    let response: string;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        console.log(`Attempt ${retryCount + 1} for ${provider}${model ? ` (${model})` : ''}`);
        
        switch (provider) {
          case 'openai':
            response = await this.callOpenAI(apiKey, prompt);
            break;
          case 'anthropic':
            response = await this.callAnthropic(apiKey, prompt);
            break;
          case 'gemini':
            response = await this.callGemini(apiKey, prompt);
            break;
          case 'openrouter':
            if (!model) {
              throw new Error('Model is required for OpenRouter');
            }
            response = await this.callOpenRouter(apiKey, prompt, model);
            break;
          default:
            throw new Error(`Unsupported LLM provider: ${provider}`);
        }

        // Clean response and parse JSON
        let cleanedResponse = response.trim();
        
        // Remove code blocks if present
        cleanedResponse = cleanedResponse.replace(/```json\n?|\n?```/g, '');
        cleanedResponse = cleanedResponse.replace(/```\n?|\n?```/g, '');
        
        // Try to find JSON in the response if it's wrapped in text
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanedResponse = jsonMatch[0];
        }

        console.log('Cleaned response length:', cleanedResponse.length);
        
        let parsed;
        try {
          parsed = JSON.parse(cleanedResponse);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          console.error('Response that failed to parse:', cleanedResponse.substring(0, 500));
          throw new Error('Invalid JSON response from LLM');
        }
        
        // Validate structure
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Response is not a valid object');
        }
        
        if (!parsed.title || typeof parsed.title !== 'string') {
          throw new Error('Missing or invalid title in response');
        }
        
        if (!Array.isArray(parsed.slides)) {
          throw new Error('Missing or invalid slides array in response');
        }

        // Validate each slide
        for (let i = 0; i < parsed.slides.length; i++) {
          const slide = parsed.slides[i];
          if (!slide || typeof slide !== 'object') {
            throw new Error(`Slide ${i + 1} is not a valid object`);
          }
          if (!slide.title || typeof slide.title !== 'string') {
            throw new Error(`Slide ${i + 1} is missing a valid title`);
          }
          if (!Array.isArray(slide.content)) {
            throw new Error(`Slide ${i + 1} is missing a valid content array`);
          }
          if (slide.content.length === 0) {
            throw new Error(`Slide ${i + 1} has no content`);
          }
        }

        console.log(`Successfully generated ${parsed.slides.length} slides`);
        return parsed;

      } catch (error) {
        retryCount++;
        console.error(`Attempt ${retryCount} failed:`, error);
        
        if (retryCount >= maxRetries) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          throw new Error(`Failed to generate presentation structure after ${maxRetries} attempts: ${errorMessage}`);
        }
        
        // Exponential backoff: wait 2^retryCount seconds
        const waitTime = Math.pow(2, retryCount) * 1000;
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    throw new Error('Max retries exceeded');
  }
}