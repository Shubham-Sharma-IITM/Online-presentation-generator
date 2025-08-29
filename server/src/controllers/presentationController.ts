import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs-extra';
import { LLMService } from '../services/llmService';
import { TemplateService } from '../services/templateService';
import { PresentationService } from '../services/presentationService';

export const generatePresentationController = async (req: Request, res: Response) => {
  const { text, guidance, apiKey, llmProvider, model, generateSpeakerNotes } = req.body;
  const templateFile = req.file;

  try {
    // Enhanced validation
    if (!text?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Text content is required'
      });
    }

    if (text.length > 50000) {
      return res.status(400).json({
        success: false,
        error: 'Text content is too long (max 50,000 characters)'
      });
    }

    if (!apiKey?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'API key is required'
      });
    }

    if (!templateFile) {
      return res.status(400).json({
        success: false,
        error: 'PowerPoint template file is required'
      });
    }

    if (llmProvider === 'openrouter' && !model) {
      return res.status(400).json({
        success: false,
        error: 'Model selection is required when using OpenRouter'
      });
    }

    // Initialize services
    const llmService = new LLMService();
    const templateService = new TemplateService();
    const presentationService = new PresentationService();

    console.log(`Generating presentation structure with ${llmProvider}${model ? ` (${model})` : ''}...`);
    
    // Generate presentation structure using LLM
    const structure = await llmService.generatePresentationStructure(
      text,
      guidance || '',
      apiKey,
      llmProvider,
      model,
      generateSpeakerNotes === 'true' || generateSpeakerNotes === true
    );

    console.log('Extracting enhanced template style...');
    
    // Extract comprehensive style from template
    const templateStyle = await templateService.extractTemplateStyle(templateFile.path);

    console.log('Generating presentation with full theme retention...');
    
    // Generate presentation
    const outputDir = path.join(__dirname, '../../output');
    await fs.ensureDir(outputDir);
    const outputFilename = `presentation-${uuidv4()}.pptx`;
    const outputPath = path.join(outputDir, outputFilename);

    await presentationService.generatePresentation(structure, templateStyle, outputPath);

    // Clean up uploaded template file
    await fs.remove(templateFile.path);

    // Create preview data
    const preview = structure.slides.map((slide, index) => ({
      title: slide.title,
      content: slide.content,
      speakerNotes: slide.speakerNotes,
      slideNumber: index + 1
    }));

    // Return success response with preview
    const downloadUrl = `/api/download/${outputFilename}`;
    
    res.json({
      success: true,
      downloadUrl,
      preview
    });

  } catch (error) {
    console.error('Error generating presentation:', error);
    
    // Clean up uploaded file on error
    if (templateFile?.path) {
      await fs.remove(templateFile.path).catch(console.error);
    }

    // Enhanced error handling
    let errorMessage = 'Failed to generate presentation';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('API key') || error.message.includes('authentication')) {
        errorMessage = 'Invalid API key or authentication failed';
        statusCode = 401;
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'API rate limit exceeded. Please try again in a few minutes.';
        statusCode = 429;
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout. Please try again.';
        statusCode = 408;
      } else if (error.message.includes('quota') || error.message.includes('billing')) {
        errorMessage = 'API quota exceeded or billing issue';
        statusCode = 402;
      } else {
        errorMessage = error.message;
      }
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage
    });
  }
};