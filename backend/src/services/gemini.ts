import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { ChunkRecord } from './vectorstore.js';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface Citation {
  documentName: string;
  pageNumber: number;
  snippet: string;
}

export interface RAGAnswerResult {
  answer: string;
  citations: Citation[];
}

/**
 * Builds context string and unique citations from retrieved vector chunks
 */
function buildContextAndCitations(chunks: ChunkRecord[]): { contextText: string; citations: Citation[] } {
  if (!chunks || chunks.length === 0) {
    return {
      contextText: 'No relevant document context found.',
      citations: []
    };
  }

  const citationsMap = new Map<string, Citation>();
  const contextParts: string[] = [];

  chunks.forEach((chunk, index) => {
    contextParts.push(`[Source ${index + 1} - ${chunk.document_name} (Page ${chunk.page_number})]:\n${chunk.content}`);

    const key = `${chunk.document_name}_${chunk.page_number}`;
    if (!citationsMap.has(key)) {
      citationsMap.set(key, {
        documentName: chunk.document_name,
        pageNumber: chunk.page_number,
        snippet: chunk.content.slice(0, 150) + (chunk.content.length > 150 ? '...' : '')
      });
    }
  });

  return {
    contextText: contextParts.join('\n\n'),
    citations: Array.from(citationsMap.values())
  };
}

/**
 * Generates RAG answer using Gemini 1.5 Flash model
 */
export async function generateRAGAnswer(prompt: string, retrievedChunks: ChunkRecord[]): Promise<RAGAnswerResult> {
  const { contextText, citations } = buildContextAndCitations(retrievedChunks);

  if (retrievedChunks.length === 0) {
    return {
      answer: "I couldn't find this information in the uploaded documents.",
      citations: []
    };
  }

  const systemPrompt = `You are CampusAI, an intelligent Student Assistant for university students.
Your task is to answer the student's question based STRICTLY on the provided document excerpts below.

INSTRUCTIONS:
- Answer accurately and concisely using Markdown formatting (bolding, lists, code blocks if needed).
- Always base your answer ONLY on the provided context excerpts.
- If the context does not contain enough information to answer the question, state EXACTLY: "I couldn't find this information in the uploaded documents."
- Do NOT make up information or use outside knowledge not mentioned in the context.

Context Excerpts:
${contextText}

Student Question:
${prompt}
`;

  if (!genAI || !apiKey) {
    console.warn('GEMINI_API_KEY not configured. Generating context-backed response.');
    return {
      answer: `Based on the uploaded documents (${retrievedChunks[0]?.document_name || 'Campus Resource'}), here is what was found:\n\n${retrievedChunks[0]?.content || ''}\n\n*Note: Configure GEMINI_API_KEY in backend/.env for full Gemini dynamic completions.*`,
      citations
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const response = await model.generateContent(systemPrompt);
    const answer = response.response.text().trim();

    return {
      answer: answer || "I couldn't find this information in the uploaded documents.",
      citations
    };
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return {
      answer: `Error generating AI response. Top document excerpt:\n\n${retrievedChunks[0]?.content}`,
      citations
    };
  }
}

/**
 * Streams RAG answer chunk-by-chunk using SSE with Gemini
 */
export async function streamRAGAnswer(
  prompt: string,
  retrievedChunks: ChunkRecord[],
  onChunk: (chunk: string) => void
): Promise<{ citations: Citation[] }> {
  const { contextText, citations } = buildContextAndCitations(retrievedChunks);

  if (retrievedChunks.length === 0) {
    onChunk("I couldn't find this information in the uploaded documents.");
    return { citations: [] };
  }

  const systemPrompt = `You are CampusAI, an intelligent Student Assistant for university students.
Your task is to answer the student's question based STRICTLY on the provided document excerpts below.

INSTRUCTIONS:
- Answer accurately and concisely using Markdown formatting.
- Always base your answer ONLY on the provided context excerpts.
- If the context does not contain enough information to answer the question, state EXACTLY: "I couldn't find this information in the uploaded documents."

Context Excerpts:
${contextText}

Student Question:
${prompt}
`;

  if (!genAI || !apiKey) {
    const fallbackAnswer = `Based on the uploaded document "${retrievedChunks[0]?.document_name || 'Campus Doc'}" (Page ${retrievedChunks[0]?.page_number || 1}):\n\n${retrievedChunks[0]?.content}`;
    for (const word of fallbackAnswer.split(' ')) {
      onChunk(word + ' ');
      await new Promise(r => setTimeout(r, 20));
    }
    return { citations };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const resultStream = await model.generateContentStream(systemPrompt);

    for await (const chunk of resultStream.stream) {
      const text = chunk.text();
      if (text) {
        onChunk(text);
      }
    }
  } catch (error) {
    console.error('Error during Gemini streaming:', error);
    onChunk(`[Stream Error]: Unable to complete stream. Top context excerpt:\n${retrievedChunks[0]?.content}`);
  }

  return { citations };
}
