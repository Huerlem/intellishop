// lib/gemini.js - VERSÃO CORRIGIDA E UNIFICADA
import { GoogleGenerativeAI } from '@google/generative-ai';

// Get API key directly from environment variables
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// Rate limiting configuration
let requestCount = 0;
const MAX_REQUESTS_PER_MINUTE = 15;
const RATE_LIMIT_RESET_TIME = 60000; // 1 minute

// Reset rate limit counter every minute
setInterval(() => {
  requestCount = 0;
}, RATE_LIMIT_RESET_TIME);

// Initialize Gemini service
let genAI = null;
let model = null;

export const getGeminiService = () => {
  if (!GEMINI_API_KEY) {
    throw new Error('❌ Gemini API key is not defined. Check your .env file and ensure EXPO_PUBLIC_GEMINI_API_KEY is set');
  }

  if (!genAI) {
    console.log('🔧 Inicializando Gemini API...');
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    // 🔧 FIXED: Usando gemini-1.5-flash em vez de gemini-pro
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log('✅ Gemini API inicializada com sucesso');
  }

  return model;
};

// Rate limiting helper
export const checkRateLimit = () => {
  if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
    throw new Error(`⚠️ Rate limit exceeded. Gemini allows ${MAX_REQUESTS_PER_MINUTE} requests per minute. Please wait a moment.`);
  }
  requestCount++;
  console.log(`📊 Gemini request count: ${requestCount}/${MAX_REQUESTS_PER_MINUTE}`);
};

// Helper function to make Gemini API calls with error handling
export const makeGeminiRequest = async (prompt) => {
  try {
    console.log('🚀 Fazendo request para Gemini API...');
    
    // Check rate limit
    checkRateLimit();
    
    // Get model
    const model = getGeminiService();
    
    // Make request
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Resposta recebida do Gemini');
    return text;
    
  } catch (error) {
    console.error('❌ Erro na request do Gemini:', error);
    
    // Handle specific error types
    if (error.message?.includes('rate limit')) {
      throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
    }
    
    if (error.message?.includes('API key')) {
      throw new Error('Gemini API key is invalid or not set. Please check your configuration.');
    }
    
    // Generic error
    throw new Error(`Gemini API error: ${error.message || 'Unknown error'}`);
  }
};

// Helper to parse JSON responses from Gemini
export const parseGeminiJSON = (text, fallback = null) => {
  try {
    // Clean the response to ensure it's valid JSON
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleanedText);
    console.log('✅ JSON parsed successfully');
    return parsed;
  } catch (error) {
    console.warn('⚠️ Failed to parse Gemini JSON response:', error);
    console.warn('📄 Raw text:', text);
    return fallback;
  }
};

// Alternative fetch-based approach (fallback)
export const makeGeminiFetchRequest = async (prompt) => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not defined.');
  }

  console.log('🔄 Using fetch-based Gemini request...');
  
  const endpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ Gemini API error response:', data);
    throw new Error(data.error?.message || 'Failed to fetch from Gemini API');
  }

  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
};