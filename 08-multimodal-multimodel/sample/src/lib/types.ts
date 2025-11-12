// Types and interfaces for the AI Decision Engine

export enum InputModality {
  TEXT = 'text',
  IMAGE_WITH_TEXT = 'image_with_text',
  AUDIO = 'audio',
  VIDEO = 'video',
  MULTIMODAL = 'multimodal'
}

export enum ModelType {
  // Router
  PHI4_MULTIMODAL = 'Phi-4-multimodal',
  // Vision
  LLAMA4_MAVERICK = 'Llama-4-Maverick',
  // Specialists
  COHERE = 'Cohere-Command-R+',
  DEEPSEEK = 'DeepSeek-R1',
  PHI_REASONING = 'Phi-4-Reasoning'
}

export interface DecisionStep {
  step_number: number;
  step_name: string;
  description: string;
  details: Record<string, any>;
  timestamp?: number;
}

export interface ModelExecution {
  model_name: string;
  model_type: ModelType;
  input_summary: string;
  output_summary: string;
  tokens_used?: number;
  time_seconds: number;
  cost_usd?: number;
  thinking_process: string;
  error?: string; // Optional error message if execution failed
}

export interface AnalysisResponse {
  request_id: string;
  detected_modality: InputModality;
  decision_steps: DecisionStep[];
  model_executions: ModelExecution[];
  final_output: {
    result: string;
    type: string;
  };
  total_time_seconds: number;
  total_cost_usd: number;
  learning_summary: {
    multimodal: string;
    multimodel: string;
    why_both: string;
    performance: string;
  };
}

export interface AnalysisRequest {
  input_type: string;
  input_data: string;
  scenario?: string;
  user_question?: string;
}

export interface StreamingEvent {
  type: 'started' | 'step_start' | 'step_complete' | 'model_start' | 'model_complete' | 'ai_thinking' | 'complete' | 'error' | 'model_error';
  [key: string]: any;
}
