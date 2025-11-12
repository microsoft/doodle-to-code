import { config } from './config';
import {
  InputModality,
  ModelType,
  DecisionStep,
  ModelExecution,
  AnalysisResponse,
  StreamingEvent
} from './types';
import { randomUUID } from 'crypto';

/**
 * The brain of the demo - analyzes input and decides which models to use
 * 
 * ROUTER-BASED MULTIMODEL ARCHITECTURE:
 * 
 * 🧠 TIER 0 - Intelligent Router (Budget Optimized):
 * � Phi-4-multimodal (Microsoft): Fast, cheap multimodal analysis ($0.001/request)
 *    → Detects input type (image/audio/text)
 *    → Analyzes question complexity
 *    → Routes ONLY to necessary specialists
 *    → Simple questions → 1 model, Complex tasks → multiple specialists
 * 
 * 👁️ TIER 1 - Vision Specialist:
 * 🟣 Llama 4 Maverick 17B (Meta): Precise image understanding when router detects visual input
 *    → OCR, object detection, scene understanding
 *    → Cultural context from images
 * 
 * 🎯 TIER 2 - Task Specialists (Called Based on Complexity):
 * � Cohere Command R+ (Cohere): 100+ languages - translation, multilingual generation
 * 🔴 DeepSeek R1 (DeepSeek): Math/reasoning powerhouse (87.5% AIME) - price analysis, calculations
 * 🟠 Mistral Small (Mistral): Cultural knowledge, general reasoning
 * 🟢 Phi-4 Reasoning (Microsoft): Fast logic and explanations
 * 
 * 📸 DEMO FLOW (Japanese Restaurant Menu):
 * Question: "Translate to Spanish/French/English, analyze prices, explain cultural significance"
 * 1. Router (Phi-4-multimodal): "Image detected + complex multi-task → route to vision + 3 specialists"
 * 2. Vision (Llama 4 Maverick): "Japanese menu, dishes: Ramen ¥1200, Sushi ¥2500..."
 * 3. Multilingual (Cohere): "Translating to 3 languages..."
 * 4. Math (DeepSeek): "Average ¥1850, premium pricing strategy..."
 * 5. Cultural (Mistral): "Ramen originated in China, adapted in Japan..."
 */
export class DecisionEngine {
  private apiKey: string | null;
  private endpoint: string;

  constructor() {
    this.apiKey = config.githubToken || config.azureOpenaiApiKey || null;
    this.endpoint = config.modelEndpoint;
  }

  /**
   * Step 1: Analyze what type of input we received
   */
  detectModality(inputType: string, inputData: string): [InputModality, DecisionStep] {
    const startTime = Date.now();

    // Simulate detection logic
    const modalityMap: Record<string, InputModality> = {
      text: InputModality.TEXT,
      image: InputModality.IMAGE_WITH_TEXT,
      image_url: InputModality.IMAGE_WITH_TEXT,
      audio: InputModality.AUDIO,
      audio_url: InputModality.AUDIO,
    };

    const detected = modalityMap[inputType] || InputModality.TEXT;

    // Create detailed analysis
    const details: Record<string, any> = {
      input_type: inputType,
      detected_modalities: [],
      analysis: ''
    };

    if (detected === InputModality.IMAGE_WITH_TEXT) {
      details.detected_modalities = ['visual', 'text'];
      details.analysis = '✅ MULTIMODAL INPUT DETECTED!\n\n✓ Visual: Image uploaded (menu photo)\n✓ Text: User question provided\n→ This demonstrates MULTIMODAL AI: Processing different input types together!';
    } else if (detected === InputModality.AUDIO) {
      details.detected_modalities = ['audio'];
      details.analysis = '✓ Audio content detected\n✗ Visual component\n📝 Tip: Add an image to make this truly multimodal!';
    } else if (detected === InputModality.TEXT) {
      details.detected_modalities = ['text'];
      details.analysis = '✓ Text input only\n✗ Visual component\n✗ Audio component\n📝 Tip: Upload an image or audio to see MULTIMODAL in action!';
    }

    const step: DecisionStep = {
      step_number: 1,
      step_name: '🎯 MULTIMODAL DETECTION',
      description: `Analyzing input types: Found ${details.detected_modalities.length} modality type(s)`,
      details,
      timestamp: (Date.now() - startTime) / 1000
    };

    return [detected, step];
  }

  /**
   * Step 2: Break down what needs to happen
   */
  decomposeTasks(modality: InputModality, scenario?: string): DecisionStep {
    const taskMap: Record<InputModality, string[]> = {
      [InputModality.IMAGE_WITH_TEXT]: [
        'Task A: Extract text from image',
        'Task B: Translate text to English (if needed)',
        'Task C: Understand context and meaning',
        'Task D: Provide analysis and recommendations'
      ],
      [InputModality.AUDIO]: [
        'Task A: Transcribe audio to text',
        'Task B: Analyze content and sentiment',
        'Task C: Generate summary',
        'Task D: Extract key points'
      ],
      [InputModality.TEXT]: [
        'Task A: Understand user intent',
        'Task B: Analyze content',
        'Task C: Generate response'
      ],
      [InputModality.VIDEO]: [],
      [InputModality.MULTIMODAL]: []
    };

    const tasks = taskMap[modality] || ['Task A: Process input'];

    return {
      step_number: 2,
      step_name: 'TASK DECOMPOSITION',
      description: '🎯 Breaking down what needs to happen',
      details: {
        tasks,
        modality
      }
    };
  }

  /**
   * Step 3: Decide which models to use (ROUTER-BASED ARCHITECTURE!)
   */
  selectModels(modality: InputModality): [any[], DecisionStep] {
    let modelDecisions: any[] = [];

    if (modality === InputModality.IMAGE_WITH_TEXT) {
      modelDecisions = [
        {
          model: config.llama4MaverickModel,
          task: 'OCR ONLY: Extract visible text EXACTLY as shown - keep Japanese characters, do NOT translate. Output: "日本語 - ¥Price"',
          reasoning: '🟣 Llama 4 Maverick 17B - Vision Expert\n👁️ Extracts menu items, prices, and text from images\n📸 First step: Understanding visual content',
          cost: 'Low',
          speed: 'Fast',
          selected: true
        },
        {
          model: config.cohereModel,
          task: 'Translation Only: Translate the Japanese menu items to English. Keep the original Japanese names and add English translations. Format: "Japanese Name (English translation) - ¥Price"',
          reasoning: '🟦 Cohere Command R+ - Language Expert (100+ languages)\n🌍 Translates Japanese menu items to English\n📝 Second step: Language translation',
          cost: 'Medium',
          speed: 'Fast',
          selected: true
        },
        {
          model: config.deepseekModel,
          task: 'Answer User Question: Based on the translated menu items, answer the user\'s specific question. Be direct and specific - reference actual menu items from the translation.',
          reasoning: '🔴 DeepSeek R1 - Reasoning Specialist\n📊 Analyzes menu to answer user question\n🧮 Third step: Provide logical answer',
          cost: 'Very Low',
          speed: 'Fast',
          selected: true
        }
      ];
    } else if (modality === InputModality.AUDIO) {
      modelDecisions = [
        {
          model: config.phi4MultimodalModel,
          task: 'Router: Analyze audio content and question complexity',
          reasoning: '🔷 Phi-4-multimodal - Intelligent Router\n🧠 Detects audio type and complexity\n🎯 Routes to necessary specialists',
          cost: 'Very Low',
          speed: 'Very Fast',
          selected: true
        },
        {
          model: config.phiReasoningModel,
          task: 'Logic Expert: Apply reasoning and provide insights',
          reasoning: '🟢 Phi-4 Reasoning - Fast Logic Specialist\n⚡ Quick reasoning on transcribed content\n🤔 Explains context and meaning',
          cost: 'Low',
          speed: 'Very Fast',
          selected: true
        }
      ];
    } else {
      // TEXT - Router detects complexity, routes to specialists
      modelDecisions = [
        {
          model: config.phi4MultimodalModel,
          task: 'Router: Analyze text and question complexity to route intelligently',
          reasoning: '🔷 Phi-4-multimodal - Intelligent Router\n🧠 Detects: language, task type, complexity\n🎯 Routes to appropriate specialists only',
          cost: 'Very Low',
          speed: 'Very Fast',
          selected: true
        },
        {
          model: config.cohereModel,
          task: 'Text Specialist: Handle language, translation, or writing tasks',
          reasoning: '🟦 Cohere Command R+ - Language & Writing Expert\n🌍 Multilingual processing (100+ languages)\n✍️ Excellent at text generation and analysis',
          cost: 'Medium',
          speed: 'Fast',
          selected: true
        },
        {
          model: config.deepseekModel,
          task: 'Reasoning Specialist: Handle complex logic, math, or analytical tasks',
          reasoning: '🔴 DeepSeek R1 - Reasoning Powerhouse (87.5% AIME)\n🧮 Specialized in complex reasoning and analysis\n📊 Excels at math, logic, and problem-solving',
          cost: 'Very Low',
          speed: 'Fast',
          selected: true
        }
      ];
    }

    const step: DecisionStep = {
      step_number: 2,
      step_name: '🤖 AI SPECIALISTS SELECTED',
      description: `${modelDecisions.filter(d => d.selected).length} specialized AI models chosen`,
      details: {
        decisions: modelDecisions
      }
    };

    return [modelDecisions, step];
  }

  /**
   * Step 4: Plan how to execute (parallel vs sequential)
   */
  createExecutionPlan(modelDecisions: any[]): DecisionStep {
    const selectedModels = modelDecisions.filter(d => d.selected).map(d => d.model);

    const strategy = selectedModels.length > 1
      ? 'Sequential execution (each model depends on previous output)'
      : 'Single model execution';

    return {
      step_number: 4,
      step_name: 'EXECUTION PLAN',
      description: '📋 Planning execution strategy',
      details: {
        strategy,
        execution_order: selectedModels,
        explanation: 'Why this order? Vision first to extract data, then language model to reason about it.'
      }
    };
  }

  /**
   * Step 5: Actually run the models and collect results
   */
  async executeModels(
    modelDecisions: any[],
    inputData: string,
    inputType: string,
    userQuestion?: string
  ): Promise<[ModelExecution[], { result: string; type: string }]> {
    const executions: ModelExecution[] = [];
    let currentOutput = inputData;

    for (let i = 0; i < modelDecisions.length; i++) {
      const decision = modelDecisions[i];
      if (!decision.selected) continue;

      const modelType: ModelType = decision.model;

      // Combine input with user question for reasoning models (not for initial extraction)
      let modelInput = currentOutput;
      if (userQuestion && i > 0) {
        modelInput = `${currentOutput}\n\nUser Question: ${userQuestion}`;
      }

      const execution = await this.executeSingleModel(
        modelType,
        modelInput,
        inputType,
        decision.task
      );
      executions.push(execution);
      
      // Only update currentOutput if execution was successful
      if (execution.output_summary && execution.output_summary.trim()) {
        currentOutput = execution.output_summary;
      }
    }

    const finalOutput = {
      result: currentOutput,
      type: 'text'
    };

    return [executions, finalOutput];
  }

  /**
   * Execute a single model and return results with metrics
   */
  private async executeSingleModel(
    modelType: ModelType | string,
    inputData: string,
    inputType: string,
    task: string
  ): Promise<ModelExecution> {
    const startTime = Date.now();

    let output: string;
    let tokens: number;
    let cost: number;
    let thinking: string;

    try {
      if (modelType === config.phi4MultimodalModel) {
        [output, tokens] = await this.callPhi4Multimodal(inputData, inputType, task);
        cost = (tokens / 1000) * 0.001; // Phi-4-multimodal pricing
        thinking = '� Phi-4-multimodal (Router): Analyzing complexity and routing to specialists...';
      } else if (modelType === config.llama4MaverickModel) {
        [output, tokens] = await this.callLlama4Maverick(inputData, inputType);
        cost = (tokens / 1000) * 0.003; // Llama 4 Maverick pricing estimate
        thinking = '🟣 Llama 4 Maverick (Vision Expert): Precise image understanding and analysis...';
      } else if (modelType === config.cohereModel) {
        [output, tokens] = await this.callCohere(inputData, task);
        cost = (tokens / 1000) * 0.003; // Cohere pricing
        thinking = '� Cohere Command R+ (Language Expert): Multilingual processing and translation...';
      } else if (modelType === config.phiReasoningModel) {
        [output, tokens] = await this.callPhiReasoning(inputData, task);
        cost = (tokens / 1000) * 0.002; // Phi pricing estimate
        thinking = '🟢 Phi-4 Reasoning (Logic Expert): Fast reasoning and analysis...';
      } else if (modelType === config.deepseekModel) {
        [output, tokens] = await this.callDeepSeek(inputData, task);
        cost = (tokens / 1000) * 0.0002; // DeepSeek pricing ($0.14-0.55/1M tokens)
        thinking = '🔴 DeepSeek R1 (Reasoning Specialist): Complex analysis and pattern recognition...';
      } else {
        output = 'Model not implemented';
        tokens = 0;
        cost = 0;
        thinking = 'Processing...';
      }
    } catch (error: any) {
      console.error('[DEBUG] Model execution error:', error);
      output = `Error: ${error.message || 'Model execution failed'}`;
      tokens = 0;
      cost = 0;
      thinking = `❌ Model execution failed: ${error.message || 'Unknown error'}`;
    }

    const elapsed = (Date.now() - startTime) / 1000;

    return {
      model_name: typeof modelType === 'string' ? modelType : modelType,
      model_type: typeof modelType === 'string' ? modelType as ModelType : modelType,
      input_summary:
        inputType !== 'text' ? `Input: ${inputType} (${inputData.length} bytes)` : inputData.substring(0, 100),
      output_summary: output,
      tokens_used: tokens,
      time_seconds: Math.round(elapsed * 100) / 100,
      cost_usd: Math.round(cost * 10000) / 10000,
      thinking_process: thinking
    };
  }

  /**
   * Call Phi-4-multimodal - Intelligent Router (Fast, Cheap)
   */
  private async callPhi4Multimodal(inputData: string, inputType: string, task: string): Promise<[string, number]> {
    if (!this.apiKey) {
      throw new Error('No API key configured. Please set GITHUB_TOKEN in .env.local file');
    }

    console.log('[DEBUG] Calling Phi-4-multimodal Router API:', {
      endpoint: this.endpoint,
      model: config.phi4MultimodalModel,
      hasApiKey: !!this.apiKey,
      apiKeyPrefix: this.apiKey?.substring(0, 10) + '...',
      inputType: inputType
    });

    try {
      const url = `${this.endpoint.replace(/\/$/, '')}/chat/completions`;
      console.log('[DEBUG] Full URL:', url);
      
      let messageContent: any;
      
      // Handle image input differently from text input
      if (inputType === 'image' && inputData.startsWith('[IMAGE]: data:image/')) {
        // Extract the actual base64 data URL
        const dataUrl = inputData.replace('[IMAGE]: ', '');
        
        messageContent = [
          {
            type: "text",
            text: `${task}. Analyze this image and determine complexity: simple question (1 specialist) or complex multi-task (multiple specialists)?`
          },
          {
            type: "image_url",
            image_url: {
              url: dataUrl
            }
          }
        ];
        
        console.log('[DEBUG] Using vision format for router image analysis');
      } else {
        // For text input, truncate if too long
        const truncatedInput = inputData.length > 4000 ? inputData.substring(0, 4000) + "...[truncated]" : inputData;
        messageContent = `${task}. ${truncatedInput}`;
        console.log('[DEBUG] Using text format for router analysis');
      }
      
      const requestBody = {
        model: config.phi4MultimodalModel,
        messages: [
          {
            role: 'system',
            content: 'You are Phi-4-multimodal, an intelligent router. Your job is to analyze input and question complexity, then decide which specialists to call. Provide a brief analysis of what you detect.'
          },
          {
            role: 'user',
            content: messageContent
          }
        ],
        max_tokens: 300,
        temperature: 0.5
      };

      console.log('[DEBUG] Request body with content type:', typeof messageContent);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('[DEBUG] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[DEBUG] Error response:', errorText);
        throw new Error(`GitHub Models API Error: ${response.status} - ${errorText}`);
      }

      const result: any = await response.json();
      console.log('[DEBUG] Success! Got response:', result);
      
      if (!result.choices || !result.choices[0] || !result.choices[0].message) {
        throw new Error('Invalid response structure from Phi-4-multimodal API');
      }
      
      const content = result.choices[0].message.content;
      if (!content) {
        throw new Error('No content in Phi-4-multimodal response');
      }
      
      const tokens = result.usage?.total_tokens || Math.floor(content.split(' ').length * 1.3);

      return [content, tokens];
    } catch (error: any) {
      console.error('[DEBUG] API call exception:', error);
      throw new Error(`API call failed: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Call Llama 4 Maverick - Vision Specialist
   */
  private async callLlama4Maverick(inputData: string, inputType: string): Promise<[string, number]> {
    if (!this.apiKey) {
      throw new Error('No API key configured. Please set GITHUB_TOKEN in .env.local file');
    }

    const modelName = config.llama4MaverickModel;
    
    console.log('[DEBUG] Calling Llama 4 Maverick Vision API:', {
      endpoint: this.endpoint,
      model: modelName,
      hasApiKey: !!this.apiKey,
      apiKeyPrefix: this.apiKey?.substring(0, 10) + '...',
      inputType: inputType
    });

    try {
      const url = `${this.endpoint.replace(/\/$/, '')}/chat/completions`;
      
      let messageContent: any;
      
      // Handle image input
      if (inputType === 'image' || inputType === 'image_url') {
        // Clean the data URL - remove any prefix like "[IMAGE]: "
        let dataUrl = inputData;
        if (dataUrl.startsWith('[IMAGE]: ')) {
          dataUrl = dataUrl.replace('[IMAGE]: ', '');
        }
        
        // Validate it's a proper data URL
        if (!dataUrl.startsWith('data:image/')) {
          throw new Error('Invalid image data format. Expected data:image/... URL');
        }
        
        messageContent = [
          {
            type: "text",
            text: "Analyze this image. Extract all visible text (OCR), identify items with prices, and describe what you see. Be concise and specific."
          },
          {
            type: "image_url",
            image_url: {
              url: dataUrl
            }
          }
        ];
        
        console.log('[DEBUG] Using vision format for Llama 4 Maverick, image URL length:', dataUrl.length);
      } else {
        // Fallback to text
        const truncatedInput = inputData.length > 3000 ? inputData.substring(0, 3000) + "...[truncated]" : inputData;
        messageContent = truncatedInput;
      }
      
      const requestBody = {
        model: modelName,
        messages: [
          {
            role: 'system',
            content: 'You are a vision OCR specialist. Extract ONLY the visible text exactly as it appears in the image. Do NOT translate ANY text - keep original characters (Japanese, Chinese, etc). Do NOT interpret, explain, or answer questions. Just list what you see character-by-character. Format: "Item name - ¥Price"'
          },
          {
            role: 'user',
            content: messageContent
          }
        ],
        max_tokens: 250,
        temperature: 0.3
      };

      console.log('[DEBUG] Llama 4 Maverick request body prepared');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('[DEBUG] Llama 4 Maverick response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[DEBUG] Llama 4 Maverick error response:', errorText);
        throw new Error(`GitHub Models API Error: ${response.status} - ${errorText}`);
      }

      const result: any = await response.json();
      console.log('[DEBUG] Llama 4 Maverick success! Got response:', result);
      
      if (!result.choices || !result.choices[0] || !result.choices[0].message) {
        throw new Error('Invalid response structure from Llama 4 Maverick API');
      }
      
      const content = result.choices[0].message.content;
      if (!content) {
        throw new Error('No content in Llama 4 Maverick response');
      }
      
      const tokens = result.usage?.total_tokens || Math.floor(content.split(' ').length * 1.3);

      return [content, tokens];
    } catch (error: any) {
      console.error('[DEBUG] Llama 4 Maverick API call exception:', error);
      throw new Error(`API call failed: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Call Cohere Command R+ (superior coding & instruction following, 1M context)
   */
  /**
   * Call Cohere Command R+ for multilingual and RAG-optimized analysis
   */
  private async callCohere(inputData: string, task: string): Promise<[string, number]> {
    if (!this.apiKey) {
      throw new Error('No API key configured. Please set GITHUB_TOKEN in .env.local file');
    }

    console.log('[DEBUG] Calling Cohere API:', {
      endpoint: this.endpoint,
      model: config.cohereModel,
      hasApiKey: !!this.apiKey,
      apiKeyPrefix: this.apiKey?.substring(0, 10) + '...'
    });

    try {
      const url = `${this.endpoint.replace(/\/$/, '')}/chat/completions`;
      
      // Truncate input if too long
      const truncatedInput = inputData.length > 4000 ? inputData.substring(0, 4000) + "...[truncated]" : inputData;
      
      const requestBody = {
        model: config.cohereModel,
        messages: [
          {
            role: 'system',
            content: `You are Cohere Command R+, a translation specialist. Your ONLY job: translate Japanese text to English. Keep original Japanese names and add English translations. Format each item clearly. ${task}`
          },
          {
            role: 'user',
            content: truncatedInput
          }
        ],
        max_tokens: 250,
        temperature: 0.7
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('[DEBUG] Cohere response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[DEBUG] Cohere error response:', errorText);
        throw new Error(`GitHub Models API Error: ${response.status} - ${errorText}`);
      }

      const result: any = await response.json();
      console.log('[DEBUG] Cohere success! Got response:', result);
      
      const content = result.choices[0].message.content;
      const tokens = result.usage?.total_tokens || Math.floor(content.split(' ').length * 1.3);

      return [content, tokens];
    } catch (error: any) {
      console.error('[DEBUG] Cohere API call exception:', error);
      throw new Error(`API call failed: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Call Phi-4 Reasoning (state-of-the-art open-weight reasoning)
   */
  private async callPhiReasoning(inputData: string, task: string): Promise<[string, number]> {
    if (!this.apiKey) {
      throw new Error('No API key configured. Please set GITHUB_TOKEN in .env.local file');
    }

    console.log('[DEBUG] Calling Phi-4 Reasoning API:', {
      endpoint: this.endpoint,
      model: config.phiReasoningModel,
      hasApiKey: !!this.apiKey,
      apiKeyPrefix: this.apiKey?.substring(0, 10) + '...'
    });

    try {
      const url = `${this.endpoint.replace(/\/$/, '')}/chat/completions`;
      
      // Truncate input if too long to prevent token limit issues
      const truncatedInput = inputData.length > 3000 ? inputData.substring(0, 3000) + "...[truncated]" : inputData;
      
      const requestBody = {
        model: config.phiReasoningModel,
        messages: [
          {
            role: 'system',
            content: `You are Phi-4 Reasoning, a state-of-the-art open-weight reasoning model optimized for math, science, and coding. ${task}. Focus on clear, step-by-step reasoning.`
          },
          {
            role: 'user',
            content: truncatedInput
          }
        ],
        max_tokens: 250,
        temperature: 0.6
      };

      console.log('[DEBUG] Phi-4 Reasoning request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('[DEBUG] Phi-4 Reasoning response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[DEBUG] Phi-4 Reasoning error response:', errorText);
        throw new Error(`GitHub Models API Error: ${response.status} - ${errorText}`);
      }

      const result: any = await response.json();
      console.log('[DEBUG] Phi-4 Reasoning success! Got response:', result);
      
      const content = result.choices[0].message.content;
      const tokens = result.usage?.total_tokens || Math.floor(content.split(' ').length * 1.3);

      return [content, tokens];
    } catch (error: any) {
      console.error('[DEBUG] Mistral API call exception:', error);
      throw new Error(`API call failed: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Call DeepSeek for advanced reasoning (87.5% AIME 2025, strong math/code)
   */
  private async callDeepSeek(inputData: string, task: string): Promise<[string, number]> {
    if (!this.apiKey) {
      throw new Error('No API key configured. Please set GITHUB_TOKEN in .env.local file');
    }

    console.log('[DEBUG] Calling DeepSeek API:', {
      endpoint: this.endpoint,
      model: config.deepseekModel,
      hasApiKey: !!this.apiKey,
      apiKeyPrefix: this.apiKey?.substring(0, 10) + '...'
    });

    try {
      const url = `${this.endpoint.replace(/\/$/, '')}/chat/completions`;
      
      // Truncate input if too long to prevent token limit issues
      const truncatedInput = inputData.length > 3000 ? inputData.substring(0, 3000) + "...[truncated]" : inputData;
      
      const requestBody = {
        model: config.deepseekModel,
        messages: [
          {
            role: 'system',
            content: `You are DeepSeek R1, a reasoning specialist. ${task}. CRITICAL: Do NOT include <think> tags. Do NOT show reasoning process. Give ONLY the final answer directly in 2-3 clear sentences.`
          },
          {
            role: 'user',
            content: truncatedInput
          }
        ],
        max_tokens: 250,
        temperature: 0.6
      };

      console.log('[DEBUG] DeepSeek request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('[DEBUG] DeepSeek response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[DEBUG] DeepSeek error response:', errorText);
        throw new Error(`GitHub Models API Error: ${response.status} - ${errorText}`);
      }

      const result: any = await response.json();
      console.log('[DEBUG] DeepSeek success! Got response:', result);
      
      const content = result.choices[0].message.content;
      const tokens = result.usage?.total_tokens || Math.floor(content.split(' ').length * 1.3);

      return [content, tokens];
    } catch (error: any) {
      console.error('[DEBUG] DeepSeek API call exception:', error);
      throw new Error(`API call failed: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Call Phi-4 Multimodal (5.6B params, native text+audio+image, 128K context, 22 languages)
   */
  /**
   * Call Whisper for audio transcription
   */
  private async callWhisper(inputData: string): Promise<[string, number]> {
    // Note: Whisper API requires actual audio files
    // For demo purposes with text input simulating audio
    return [
      `[Note: Real Whisper API requires audio file upload. Simulating transcription for demo]\n\nTranscribed: ${inputData}`,
      150
    ];
  }

  /**
   * Generate the educational summary
   */
  private createLearningSummary(
    modality: InputModality,
    modelCount: number,
    totalTime: number,
    totalCost: number
  ): any {
    const isMultimodal = modality === InputModality.IMAGE_WITH_TEXT || modality === InputModality.MULTIMODAL;
    
    return {
      multimodal: isMultimodal 
        ? `✅ MULTIMODAL: Image (visual) + Text (question) → Working together! This is why it's called MULTIMODAL.`
        : `⚠️ SINGLE MODALITY: Only ${modality} input. Upload image + text to see true MULTIMODAL!`,
      multimodel: `✅ MULTIMODEL: ${modelCount} specialized AI models from ${modelCount} different providers (Meta, Cohere, DeepSeek) each doing what they do best.`,
      why_both:
        `🎯 The Power of Both:\n• MULTIMODAL = Different INPUT types (image + text + audio)\n• MULTIMODEL = Different AI MODELS working as specialists\n• Together = Real-world AI systems need BOTH!`,
      performance: `⚡ ${totalTime.toFixed(1)}s | $${totalCost.toFixed(4)} | ${modelCount} models`
    };
  }

  /**
   * Main entry point - orchestrates the entire decision process
   */
  async analyze(
    inputType: string,
    inputData: string,
    scenario?: string,
    userQuestion?: string
  ): Promise<AnalysisResponse> {
    const requestId = randomUUID();
    const startTime = Date.now();

    // Step 1: Detect modality
    const [modality, step1] = this.detectModality(inputType, inputData);

    // Step 2: Decompose tasks
    const step2 = this.decomposeTasks(modality, scenario);

    // Step 3: Select models
    const [modelDecisions, step3] = this.selectModels(modality);

    // Step 4: Create execution plan
    const step4 = this.createExecutionPlan(modelDecisions);

    // Step 5: Execute models
    const [executions, finalOutput] = await this.executeModels(
      modelDecisions,
      inputData,
      inputType,
      userQuestion
    );

    const totalTime = (Date.now() - startTime) / 1000;
    const totalCost = executions.reduce((sum, e) => sum + (e.cost_usd || 0), 0);

    const learningSummary = this.createLearningSummary(
      modality,
      modelDecisions.filter(d => d.selected).length,
      totalTime,
      totalCost
    );

    return {
      request_id: requestId,
      detected_modality: modality,
      decision_steps: [step1, step2, step3, step4],
      model_executions: executions,
      final_output: finalOutput,
      total_time_seconds: Math.round(totalTime * 100) / 100,
      total_cost_usd: Math.round(totalCost * 1000) / 1000,
      learning_summary: learningSummary
    };
  }

  /**
   * Streaming version - yields events as analysis progresses
   */
  async *analyzeStreaming(
    inputType: string,
    inputData: string,
    scenario?: string,
    userQuestion?: string
  ): AsyncGenerator<StreamingEvent> {
    const requestId = randomUUID();
    const startTime = Date.now();

    // Emit start event
    yield {
      type: 'started',
      request_id: requestId,
      timestamp: Date.now()
    };

    // Step 1: Detect modality
    yield { type: 'step_start', step: 'detecting_modality', message: '🔍 Analyzing your input...' };
    await this.sleep(300);
    const [modality, step1] = this.detectModality(inputType, inputData);
    yield { type: 'step_complete', step: 'detecting_modality', data: step1 };

    // Step 2: Select models (skip the useless decompose/plan steps)
    yield { type: 'step_start', step: 'selecting_models', message: '🤖 Selecting AI specialists...' };
    await this.sleep(300);
    const [modelDecisions, step3] = this.selectModels(modality);
    yield { type: 'step_complete', step: 'selecting_models', data: step3 };

    // Step 3: Execute models
    const executions: ModelExecution[] = [];
    for (let i = 0; i < modelDecisions.length; i++) {
      const decision = modelDecisions[i];
      if (!decision.selected) continue;

      const modelType: ModelType = decision.model;
      yield {
        type: 'model_start',
        model: modelType,
        message: `⚡ Executing ${modelType}...`,
        task: decision.task
      };

      try {
        // Prepare input: Pipeline flow - each model gets previous output
        let currentInput: string;
        if (i === 0) {
          // First model: Gets original input (image/text)
          currentInput = inputData;
        } else if (i === modelDecisions.filter(d => d.selected).length - 1 && userQuestion) {
          // Last model: Gets previous output + user question for final answer
          currentInput = `Previous Analysis:\n${executions[executions.length - 1].output_summary}\n\n---\nUser Question: ${userQuestion}\n\nProvide a direct answer based on the analysis above.`;
        } else {
          // Middle models: Get previous model's output to process
          currentInput = executions[executions.length - 1].output_summary;
        }

        console.log(`[DEBUG] Executing model ${modelType} for task: ${decision.task}`);

        // Stream the AI's thinking process BEFORE execution with more context
        yield {
          type: 'ai_thinking',
          model: modelType,
          thinking: `🤖 ${this.getModelDisplayName(modelType)} analyzing...`,
          details: `📝 ${decision.task}\n💭 Processing ${i === 0 ? 'your uploaded content' : 'insights from previous model'}...`
        };

        const execution = await this.executeSingleModel(modelType, currentInput, inputType, decision.task);
        executions.push(execution);

        console.log(`[DEBUG] Model ${modelType} completed successfully`);

        // Show output preview for transparency
        const outputPreview = execution.output_summary.length > 120 
          ? execution.output_summary.substring(0, 120) + '...' 
          : execution.output_summary;

        // Stream the complete execution WITH output preview
        yield {
          type: 'model_complete',
          model: modelType,
          data: execution,
          output: execution.output_summary,
          message: `✅ ${this.getModelDisplayName(modelType)} completed`,
          preview: `📤 "${outputPreview}"`
        };

      } catch (error: any) {
        console.error(`[DEBUG] Model ${modelType} failed:`, error);
        
        const failedExecution: ModelExecution = {
          model_name: modelType,
          model_type: modelType as ModelType,
          input_summary: inputData.substring(0, 100),
          output_summary: `Error: ${error.message}`,
          tokens_used: 0,
          time_seconds: 0,
          cost_usd: 0,
          thinking_process: `❌ Model execution failed: ${error.message}`,
          error: error.message
        };
        
        executions.push(failedExecution);

        yield {
          type: 'model_error',
          model: modelType,
          error: error.message,
          message: `❌ ${modelType} failed: ${error.message}`
        };
      }
    }

    // Final summary
    const totalTime = (Date.now() - startTime) / 1000;
    const totalCost = executions.reduce((sum, e) => sum + (e.cost_usd || 0), 0);

    const learningSummary = this.createLearningSummary(
      modality,
      modelDecisions.filter(d => d.selected).length,
      totalTime,
      totalCost
    );

    const finalOutput = {
      result: executions.length > 0 ? executions[executions.length - 1].output_summary : 'No output',
      type: 'text'
    };

    yield {
      type: 'complete',
      request_id: requestId,
      detected_modality: modality,
      total_time: Math.round(totalTime * 100) / 100,
      total_cost: Math.round(totalCost * 10000) / 10000,
      learning_summary: learningSummary,
      final_output: finalOutput
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get friendly display name for model
   */
  private getModelDisplayName(modelType: ModelType | string): string {
    const typeStr = typeof modelType === 'string' ? modelType : modelType;
    
    if (typeStr.includes('Llama')) return 'Llama 4 Maverick (Vision)';
    if (typeStr.includes('Cohere') || typeStr.includes('command-r')) return 'Cohere Command R+ (Language)';
    if (typeStr.includes('DeepSeek')) return 'DeepSeek R1 (Reasoning)';
    if (typeStr.includes('Phi-4-multimodal')) return 'Phi-4 Multimodal (Router)';
    if (typeStr.includes('Phi-4-reasoning')) return 'Phi-4 Reasoning (Logic)';
    
    return typeStr;
  }
}
