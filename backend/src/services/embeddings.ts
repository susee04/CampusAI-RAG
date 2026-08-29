import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Generates 768-dimensional embeddings using Google Gemini text-embedding-004 model
 */
export async function getEmbedding(text: string): Promise<number[]> {
  if (!genAI || !apiKey) {
    console.warn('GEMINI_API_KEY is not configured. Generating fallback simulated embedding.');
    return generateFallbackEmbedding(text);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('Error fetching Gemini embedding:', error);
    return generateFallbackEmbedding(text);
  }
}

/**
 * Batch generate embeddings for multiple text chunks
 */
export async function getBatchEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  for (const text of texts) {
    const embedding = await getEmbedding(text);
    embeddings.push(embedding);
  }
  return embeddings;
}

/**
 * Deterministic fallback embedding function for local dev testing without API key
 */
function generateFallbackEmbedding(text: string): number[] {
  const embedding = new Array(768).fill(0);
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const index = (i * 31 + charCode) % 768;
    embedding[index] = (embedding[index] + charCode / 255.0) / 2.0;
  }
  // Normalize vector
  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0)) || 1;
  return embedding.map(val => val / norm);
}
