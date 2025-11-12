// Configuration for the AI Decision Engine

export interface AppConfig {
  githubToken: string | null;
  azureOpenaiApiKey: string | null;
  azureOpenaiEndpoint: string | null;
  modelEndpoint: string;
  phi4MultimodalModel: string;
  llama4MaverickModel: string;
  cohereModel: string;
  deepseekModel: string;
  phiReasoningModel: string;
}

// Server-side config - reads from environment variables at runtime
function getServerConfig(): AppConfig {
  return {
    githubToken: process.env.GITHUB_TOKEN || null,
    azureOpenaiApiKey: process.env.AZURE_OPENAI_API_KEY || null,
    azureOpenaiEndpoint: process.env.AZURE_OPENAI_ENDPOINT || null,
    modelEndpoint: process.env.MODEL_ENDPOINT || 'https://models.inference.ai.azure.com',
    phi4MultimodalModel: process.env.PHI4_MULTIMODAL_MODEL || 'Phi-4-multimodal-instruct',
    llama4MaverickModel: process.env.LLAMA4_MAVERICK_MODEL || 'Llama-4-Maverick-17B-128E-Instruct-FP8',
    cohereModel: process.env.COHERE_MODEL || 'Cohere-command-r-plus-08-2024',
    deepseekModel: process.env.DEEPSEEK_MODEL || 'DeepSeek-R1-0528',
    phiReasoningModel: process.env.PHI_REASONING_MODEL || 'Phi-4-reasoning'
  }
}

export const config: AppConfig = getServerConfig()

export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  console.log('[DEBUG] Environment variables:', {
    GITHUB_TOKEN: process.env.GITHUB_TOKEN ? process.env.GITHUB_TOKEN.substring(0, 10) + '...' : 'NOT_SET',
    MODEL_ENDPOINT: process.env.MODEL_ENDPOINT,
    GPT4O_MODEL: process.env.GPT4O_MODEL
  })
  
  // Check if at least one auth method is configured
  if (!config.githubToken && !config.azureOpenaiApiKey) {
    errors.push('❌ No API key configured! Set either GITHUB_TOKEN or AZURE_OPENAI_API_KEY in .env.local')
  }
  
  if (config.githubToken && config.githubToken.includes('your_github_token_here')) {
    errors.push('❌ GITHUB_TOKEN is still a placeholder. Replace with real token from https://github.com/settings/tokens')
  }
  
  if (!config.modelEndpoint) {
    errors.push('❌ MODEL_ENDPOINT not configured')
  }
  
  if (errors.length > 0) {
    console.error('🚨 Configuration Errors:', errors)
  } else {
    console.log('Server config loaded:', {
      endpoint: config.modelEndpoint,
      models: { 
        phi4Multimodal: config.phi4MultimodalModel, 
        llama4Maverick: config.llama4MaverickModel,
        cohere: config.cohereModel, 
        deepseek: config.deepseekModel,
        phiReasoning: config.phiReasoningModel
      }
    });
  }
  
  return { valid: errors.length === 0, errors }
}
