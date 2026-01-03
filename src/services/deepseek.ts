// DeepSeek R1 Reasoner API Service
// For the "Ask AI" module - helping students understand any concept

const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const API_URL = 'https://api.deepseek.com/v1/chat/completions';

// Fallback models in case primary is unavailable
const MODELS = [
  'deepseek-reasoner',  // DeepSeek R1 - best for reasoning
  'deepseek-chat',      // Fallback to regular chat model
];

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  content: string;
  reasoningContent?: string; // DeepSeek R1 provides chain-of-thought reasoning
}

const SYSTEM_PROMPT = `You are an expert academic tutor and learning assistant for university students. Your role is to help students understand complex concepts across all academic disciplines.

CORE PRINCIPLES:
1. EXPLAIN CLEARLY: Break down complex concepts into understandable parts
2. USE EXAMPLES: Provide real-world examples and analogies
3. BE THOROUGH: Cover the topic comprehensively but accessibly
4. ENCOURAGE LEARNING: Guide students to deeper understanding, don't just give answers
5. ACADEMIC RIGOR: Maintain accuracy and cite relevant theories/sources when appropriate

RESPONSE STYLE:
- Start with a brief, accessible overview
- Then dive into detailed explanation
- Use bullet points and numbered lists for clarity
- Include examples where helpful
- End with a summary or key takeaways
- If relevant, suggest related concepts to explore

ACADEMIC DISCIPLINES:
You can help with any subject including:
- Sciences (Biology, Chemistry, Physics, etc.)
- Mathematics and Statistics
- Social Sciences (Psychology, Sociology, Economics)
- Humanities (History, Philosophy, Literature)
- Business and Management
- Health Sciences and Medicine
- Engineering and Technology
- Law and Political Science

Always be encouraging and supportive. If a student is struggling, break things down further.`;

async function callDeepSeekAPI(
  messages: Message[],
  model: string,
  maxTokens: number = 4000
): Promise<ChatResponse> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  return {
    content: data.choices[0]?.message?.content || '',
    reasoningContent: data.choices[0]?.message?.reasoning_content,
  };
}

export async function askDeepSeek(
  userMessage: string,
  conversationHistory: Message[] = []
): Promise<ChatResponse> {
  if (!API_KEY) {
    throw new Error('DeepSeek API key is not configured. Please add VITE_DEEPSEEK_API_KEY to your .env.local file.');
  }

  // Build the full message array with system prompt and history
  const messages: Message[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];

  // Try each model in order until one works
  let lastError: Error | null = null;
  
  for (const model of MODELS) {
    try {
      console.log(`Trying DeepSeek model: ${model}`);
      const response = await callDeepSeekAPI(messages, model);
      console.log(`Successfully used model: ${model}`);
      return response;
    } catch (error) {
      console.warn(`Model ${model} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // If it's a 429 (rate limit) or 503 (unavailable), try next model
      if (error instanceof Error && 
          (error.message.includes('429') || error.message.includes('503') || error.message.includes('404'))) {
        continue;
      }
      
      // For other errors, throw immediately
      throw error;
    }
  }

  throw lastError || new Error('All DeepSeek models failed');
}

// Helper function to format conversation history for the API
export function formatConversationHistory(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Message[] {
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));
}

