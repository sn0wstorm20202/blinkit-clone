import { SupportedLanguage } from '@/hooks/useVoiceRecognition';

// Conversation states
export type ConversationState =
  | 'idle'
  | 'adding_items'
  | 'confirming_cart'
  | 'requesting_address'
  | 'confirming_checkout'
  | 'payment';

// Agent action types
export type AgentAction =
  | 'search_and_add'
  | 'add_to_cart'
  | 'remove_item'
  | 'update_quantity'
  | 'navigate'
  | 'search_products'
  | 'checkout'
  | 'add_recipe_ingredients'
  | 'create_address'
  | 'update_address'
  | 'set_default_address'
  | 'ask'
  | 'confirm'
  | 'get_cart'
  | 'clear_cart'
  | 'fallback';

// Agent request payload
export interface VoiceAgentRequest {
  text: string;
  language: SupportedLanguage;
  conversationState?: {
    state: ConversationState;
    context?: Record<string, any>;
  };
  userId?: string;
}

// Individual item for cart operations
export interface CartItem {
  name: string;
  product_id?: string;
  quantity?: number;
  confidence?: number;
}

// Agent response payload
export interface VoiceAgentResponse {
  action: AgentAction;
  params: Record<string, any>;
  response: string;
  conversationState: {
    state: ConversationState;
    context?: Record<string, any>;
  };
  confidence?: number;
}

// Action dispatcher result
export interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

// Product search result
export interface ProductSearchResult {
  id: string;
  name: string;
  categoryId: string;
  categoryName?: string;
  imageUrl: string;
  quantity: string;
  price: number;
  deliveryTime: string;
}

// Recipe ingredient
export interface RecipeIngredient {
  product_name: string;
  quantity: string;
  alternatives?: string[];
}

// Recipe definition
export interface Recipe {
  name: string;
  nameHindi?: string;
  nameBengali?: string;
  ingredients: RecipeIngredient[];
}

// Conversation history entry
export interface ConversationEntry {
  timestamp: Date;
  userInput: string;
  agentResponse: string;
  action: AgentAction;
  success: boolean;
}

// Language labels for UI
export interface LanguageLabels {
  listening: string;
  stopped: string;
  tapToSpeak: string;
  speaking: string;
  processing: string;
  error: string;
  notSupported: string;
  accessibilityMode: string;
  close: string;
  clearHistory: string;
}
