import React, { useState, useCallback } from 'react';
import { FileText, Sparkles, Download, AlertCircle, Eye, RotateCcw, Briefcase, Users, TrendingUp, BookOpen, Settings, Lightbulb } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { LoadingSpinner } from './components/LoadingSpinner';
import { SlidePreview } from './components/SlidePreview';
import { UseCaseSelector } from './components/UseCaseSelector';
import { generatePresentation, downloadPresentation } from './services/api';
import { LLMProvider, UseCaseTemplate, SlidePreview as SlidePreviewType } from './types';

const LLM_PROVIDERS: LLMProvider[] = [
  { id: 'openai', name: 'OpenAI GPT', placeholder: 'sk-...' },
  { id: 'anthropic', name: 'Anthropic Claude', placeholder: 'sk-ant-...' },
  { id: 'gemini', name: 'Google Gemini', placeholder: 'AIza...' },
  { 
    id: 'openrouter', 
    name: 'OpenRouter', 
    placeholder: 'sk-or-v1-...',
    models: [
      'openai/gpt-4-turbo-preview',
      'openai/gpt-4',
      'openai/gpt-3.5-turbo',
      'anthropic/claude-3-opus',
      'anthropic/claude-3-sonnet',
      'anthropic/claude-3-haiku',
      'google/gemini-2.0-flash-exp',
      'google/gemini-pro-1.5',
      'google/gemini-2.5-pro',
      'meta-llama/llama-3-70b-instruct',
      'meta-llama/llama-3-8b-instruct',
      'mistralai/mixtral-8x7b-instruct',
      'cohere/command-r-plus'
    ]
  },
];

const USE_CASE_TEMPLATES: UseCaseTemplate[] = [
  {
    id: 'investor-pitch',
    name: 'Investor Pitch Deck',
    description: 'Professional pitch for investors with problem, solution, market, and financials',
    guidance: 'Create an investor pitch deck with clear problem statement, innovative solution, market opportunity, business model, competitive analysis, financial projections, and funding ask. Keep slides concise and impactful.',
    icon: 'TrendingUp'
  },
  {
    id: 'sales-proposal',
    name: 'Sales Proposal',
    description: 'Compelling sales presentation to win new business',
    guidance: 'Structure as a sales proposal with client pain points, our solutions, case studies, pricing, and clear call-to-action. Focus on benefits and ROI for the client.',
    icon: 'Briefcase'
  },
  {
    id: 'research-summary',
    name: 'Research Summary',
    description: 'Academic or business research findings presentation',
    guidance: 'Present research findings with clear methodology, key findings, data visualizations, conclusions, and recommendations. Maintain academic rigor while being accessible.',
    icon: 'BookOpen'
  },
  {
    id: 'team-meeting',
    name: 'Team Meeting',
    description: 'Internal team updates and discussion points',
    guidance: 'Create a team meeting presentation with agenda, updates, key discussion points, action items, and next steps. Keep it collaborative and actionable.',
    icon: 'Users'
  },
  {
    id: 'product-launch',
    name: 'Product Launch',
    description: 'New product or feature announcement',
    guidance: 'Structure as a product launch with product overview, key features, benefits, target market, go-to-market strategy, and success metrics.',
    icon: 'Lightbulb'
  },
  {
    id: 'technical-review',
    name: 'Technical Review',
    description: 'Technical architecture or system overview',
    guidance: 'Present technical content with system architecture, implementation details, performance metrics, security considerations, and technical roadmap. Balance technical depth with clarity.',
    icon: 'Settings'
  }
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_FILE_TYPES = ['.pptx', '.potx'];

function App() {
  const [text, setText] = useState('');
  const [guidance, setGuidance] = useState('');
  const [selectedUseCase, setSelectedUseCase] = useState<string>('');
  const [apiKey, setApiKey] = useState('');
  const [llmProvider, setLlmProvider] = useState<'openai' | 'anthropic' | 'gemini' | 'openrouter'>('openai');
  const [selectedModel, setSelectedModel] = useState('');
  const [templateFile, setTemplateFile] = useState<File>();
  const [generateSpeakerNotes, setGenerateSpeakerNotes] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [downloadUrl, setDownloadUrl] = useState<string>();
  const [slidePreview, setSlidePreview] = useState<SlidePreviewType[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const currentProvider = LLM_PROVIDERS.find(p => p.id === llmProvider);

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }
    
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_FILE_TYPES.includes(fileExtension)) {
      return `Only ${ALLOWED_FILE_TYPES.join(', ')} files are allowed`;
    }
    
    return null;
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setTemplateFile(file);
    setError(undefined);
  }, [validateFile]);

  const handleUseCaseSelect = useCallback((useCaseId: string) => {
    setSelectedUseCase(useCaseId);
    const useCase = USE_CASE_TEMPLATES.find(u => u.id === useCaseId);
    if (useCase) {
      setGuidance(useCase.guidance);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent, isRetry: boolean = false) => {
    e.preventDefault();
    setError(undefined);
    
    if (!isRetry) {
      setDownloadUrl(undefined);
      setSlidePreview([]);
      setShowPreview(false);
      setRetryCount(0);
    }

    // Validation
    if (!text.trim()) {
      setError('Please enter some text to convert into slides');
      return;
    }
    
    if (!apiKey.trim()) {
      setError('Please enter your API key');
      return;
    }
    
    if (!templateFile) {
      setError('Please upload a PowerPoint template');
      return;
    }

    if (llmProvider === 'openrouter' && !selectedModel) {
      setError('Please select a model for OpenRouter');
      return;
    }

    setIsLoading(true);

    try {
      const result = await generatePresentation({
        text,
        guidance: guidance || undefined,
        apiKey,
        llmProvider,
        templateFile,
        model: selectedModel || undefined,
        generateSpeakerNotes
      });

      if (result.success && result.downloadUrl) {
        setDownloadUrl(result.downloadUrl);
        if (result.preview) {
          setSlidePreview(result.preview);
          setShowPreview(true);
        }
        setRetryCount(0);
      } else {
        throw new Error(result.error || 'Failed to generate presentation');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      
      // Auto-retry logic for certain errors
      if (retryCount < 2 && (
        errorMessage.includes('timeout') || 
        errorMessage.includes('rate limit') ||
        errorMessage.includes('network')
      )) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          handleSubmit(e, true);
        }, Math.pow(2, retryCount) * 1000); // Exponential backoff
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderChange = (newProvider: string) => {
    setLlmProvider(newProvider as any);
    setSelectedModel('');
    
    if (newProvider === 'openrouter') {
      setSelectedModel('openai/gpt-4-turbo-preview');
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      downloadPresentation(downloadUrl, `presentation-${Date.now()}.pptx`);
    }
  };

  const handleRetry = () => {
    const fakeEvent = new Event('submit') as any;
    handleSubmit(fakeEvent, true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-blue-600 mr-2" />
            <h1 className="text-3xl font-bold text-gray-900">Presentation Generator</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Transform your text into a beautiful PowerPoint presentation that perfectly matches your template's theme.
            Powered by your choice of AI with advanced theme retention.
          </p>
        </div>

        {/* Use Case Templates */}
        <div className="mb-8">
          <UseCaseSelector
            templates={USE_CASE_TEMPLATES}
            selectedTemplate={selectedUseCase}
            onTemplateSelect={handleUseCaseSelect}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
                {/* Text Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Input Text <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste your text, markdown, or prose here. This will be transformed into slides..."
                    className="w-full h-48 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    required
                  />
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-sm text-gray-500">
                      Supports plain text, markdown, and long-form content
                    </p>
                    <p className="text-xs text-gray-400">
                      {text.length} characters
                    </p>
                  </div>
                </div>

                {/* Custom Guidance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Style Guidance {selectedUseCase && '(Override)'}
                  </label>
                  <textarea
                    value={guidance}
                    onChange={(e) => setGuidance(e.target.value)}
                    placeholder={selectedUseCase ? 
                      "Customize the guidance above or add specific requirements..." : 
                      "e.g., 'focus on visual elements', 'include financial metrics', 'technical audience'"
                    }
                    className="w-full h-20 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedUseCase ? 
                      'Template guidance applied. Add specific customizations here.' : 
                      'Optional guidance to shape presentation style and structure'
                    }
                  </p>
                </div>

                {/* AI Provider Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      AI Provider <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={llmProvider}
                      onChange={(e) => handleProviderChange(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {LLM_PROVIDERS.map((provider) => (
                        <option key={provider.id} value={provider.id}>
                          {provider.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Model Selection for OpenRouter */}
                  {llmProvider === 'openrouter' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Model <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select model...</option>
                        <optgroup label="Recommended">
                          <option value="openai/gpt-4-turbo-preview">GPT-4 Turbo ⭐</option>
                          <option value="anthropic/claude-3-opus">Claude 3 Opus ⭐</option>
                          <option value="google/gemini-2.0-flash-exp">Gemini 2.0 Flash ⚡</option>
                        </optgroup>
                        <optgroup label="Other Models">
                          {currentProvider?.models?.slice(3).map(model => (
                            <option key={model} value={model}>
                              {model.split('/')[1]?.replace(/-/g, ' ').toUpperCase()}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                  )}
                </div>

                {/* API Key */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={currentProvider?.placeholder}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {llmProvider === 'openrouter' ? (
                      <>Get your key at <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">openrouter.ai</a></>
                    ) : (
                      'Never stored, only used for this generation'
                    )}
                  </p>
                </div>

                {/* File Upload */}
                <FileUpload
                  onFileSelect={handleFileSelect}
                  selectedFile={templateFile}
                  maxSize={MAX_FILE_SIZE}
                  allowedTypes={ALLOWED_FILE_TYPES}
                />

                {/* Options */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Generation Options</h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={generateSpeakerNotes}
                        onChange={(e) => setGenerateSpeakerNotes(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Generate speaker notes for each slide
                      </span>
                    </label>
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                        {retryCount > 0 && (
                          <p className="text-xs text-red-600 mt-1">
                            Retry attempt {retryCount}/2
                          </p>
                        )}
                      </div>
                      {retryCount < 2 && (error.includes('timeout') || error.includes('rate limit')) && (
                        <button
                          onClick={handleRetry}
                          className="ml-2 text-red-600 hover:text-red-800"
                          disabled={isLoading}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating{retryCount > 0 ? ` (Retry ${retryCount})` : ''}...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Presentation
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Loading State */}
            {isLoading && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <LoadingSpinner 
                  message={`Generating with ${currentProvider?.name}${selectedModel ? ` (${selectedModel.split('/')[1]})` : ''}...`} 
                />
              </div>
            )}

            {/* Preview */}
            {showPreview && slidePreview.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Eye className="h-5 w-5 mr-2" />
                    Preview ({slidePreview.length} slides)
                  </h3>
                </div>
                <SlidePreview slides={slidePreview} />
              </div>
            )}

            {/* Download Section */}
            {downloadUrl && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center">
                  <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                    <h3 className="text-lg font-medium text-green-800 mb-2">
                      ✅ Presentation Ready!
                    </h3>
                    <p className="text-green-700 text-sm">
                      Your presentation has been generated with full theme retention from your template.
                    </p>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center justify-center transition-colors"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Presentation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <Sparkles className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="font-medium text-gray-900 mb-2">Advanced AI</h3>
            <p className="text-sm text-gray-600">
              Multiple AI providers with model selection for optimal results.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <Settings className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="font-medium text-gray-900 mb-2">Full Theme Retention</h3>
            <p className="text-sm text-gray-600">
              Preserves colors, fonts, layouts, and master slides from your template.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <Eye className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="font-medium text-gray-900 mb-2">Live Preview</h3>
            <p className="text-sm text-gray-600">
              Preview slides before download with speaker notes included.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <Briefcase className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="font-medium text-gray-900 mb-2">Use Case Templates</h3>
            <p className="text-sm text-gray-600">
              Pre-built guidance for common presentation types.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;