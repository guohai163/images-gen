export type ImageFormState = {
  baseUrl: string;
  apiKey: string;
  model: 'gpt-image-2';
  prompt: string;
  size: '1024x1024' | '1024x1536' | '1536x1024' | 'auto';
  quality: 'low' | 'medium' | 'high' | 'auto';
  generationMode: 'text' | 'reference' | 'edit';
};

export type GenerationHistoryItem = {
  id: string;
  createdAt: string;
  prompt: string;
  width: number;
  height: number;
  imageDataUrl: string;
  filename: string;
};

export type ApiErrorState = {
  status?: number;
  message: string;
  details?: string;
};

export type GeneratedImage = GenerationHistoryItem;

export type SizePreset = {
  label: string;
  value: ImageFormState['size'];
};

export type UsageResponse = {
  isValid?: boolean;
  mode?: string;
  planName?: string;
  remaining?: number;
  unit?: string;
  subscription?: {
    daily_limit_usd?: number;
    daily_usage_usd?: number;
    weekly_limit_usd?: number;
    weekly_usage_usd?: number;
    monthly_limit_usd?: number;
    monthly_usage_usd?: number;
    expires_at?: string;
  };
  usage?: {
    average_duration_ms?: number;
    rpm?: number;
    tpm?: number;
    today?: {
      actual_cost?: number;
      cost?: number;
      requests?: number;
      input_tokens?: number;
      output_tokens?: number;
      total_tokens?: number;
    };
    total?: {
      actual_cost?: number;
      cost?: number;
      requests?: number;
      input_tokens?: number;
      output_tokens?: number;
      total_tokens?: number;
    };
  };
};

export type UsageState = {
  data: UsageResponse | null;
  isLoading: boolean;
  error: ApiErrorState | null;
  updatedAt: string | null;
};

export type GenerateRequestPayload = {
  baseUrl: string;
  apiKey: string;
  model: 'gpt-image-2';
  prompt: string;
  size: string;
  quality: ImageFormState['quality'];
  mode?: 'text' | 'reference' | 'edit';
};

export type UsageRequestPayload = {
  baseUrl: string;
  apiKey: string;
};

export type UploadState = {
  files: File[];
  previewUrls: string[];
  error: string | null;
};
