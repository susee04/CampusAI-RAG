import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';

export const supabase = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export interface DocumentRecord {
  id: string;
  name: string;
  size: number;
  storage_path?: string;
  created_at?: string;
}

export interface ChunkRecord {
  id: string;
  document_id: string;
  document_name: string;
  chunk_index: number;
  page_number: number;
  content: string;
  similarity?: number;
}

// In-memory fallback vector database for local dev or when Supabase credentials are missing
const memoryDocuments: Map<string, DocumentRecord> = new Map();
const memoryChunks: (ChunkRecord & { embedding: number[] })[] = [];

/**
 * Cosine similarity helper for in-memory fallback matching
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Stores document metadata and chunks into Supabase pgvector table (with fallback)
 */
export async function storeDocumentWithChunks(
  name: string,
  size: number,
  storagePath: string,
  chunks: { chunkIndex: number; pageNumber: number; content: string; embedding: number[] }[]
): Promise<DocumentRecord> {
  const docId = crypto.randomUUID();
  const docRecord: DocumentRecord = {
    id: docId,
    name,
    size,
    storage_path: storagePath,
    created_at: new Date().toISOString()
  };

  if (supabase) {
    try {
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert({
          id: docId,
          name,
          size,
          storage_path: storagePath
        })
        .select()
        .single();

      if (docError) {
        console.warn('Supabase document insert error, using fallback:', docError.message);
      } else if (docData) {
        docRecord.id = docData.id;
      }

      const chunkRows = chunks.map(c => ({
        id: crypto.randomUUID(),
        document_id: docRecord.id,
        document_name: name,
        chunk_index: c.chunkIndex,
        page_number: c.pageNumber,
        content: c.content,
        embedding: c.embedding
      }));

      const { error: chunkError } = await supabase
        .from('document_chunks')
        .insert(chunkRows);

      if (chunkError) {
        console.warn('Supabase chunks insert error, using fallback:', chunkError.message);
      } else {
        return docRecord;
      }
    } catch (err) {
      console.warn('Supabase error during store operations, storing in-memory fallback:', err);
    }
  }

  // Fallback in memory storage
  memoryDocuments.set(docRecord.id, docRecord);
  chunks.forEach(c => {
    memoryChunks.push({
      id: crypto.randomUUID(),
      document_id: docRecord.id,
      document_name: name,
      chunk_index: c.chunkIndex,
      page_number: c.pageNumber,
      content: c.content,
      embedding: c.embedding
    });
  });

  return docRecord;
}

/**
 * Searches for top relevant text chunks matching the embedding query
 */
export async function searchSimilarChunks(
  queryEmbedding: number[],
  matchCount: number = 5,
  similarityThreshold: number = 0.1
): Promise<ChunkRecord[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('match_document_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: similarityThreshold,
        match_count: matchCount
      });

      if (!error && data && data.length > 0) {
        return data as ChunkRecord[];
      }
    } catch (err) {
      console.warn('RPC vector match error, falling back to memory vector search:', err);
    }
  }

  // Fallback in-memory similarity search
  const results = memoryChunks.map(chunk => ({
    ...chunk,
    similarity: cosineSimilarity(queryEmbedding, chunk.embedding)
  }))
  .filter(chunk => chunk.similarity >= similarityThreshold)
  .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
  .slice(0, matchCount);

  return results.map(({ embedding, ...rest }) => rest);
}

/**
 * Lists all uploaded documents
 */
export async function listDocuments(): Promise<DocumentRecord[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn('Supabase document fetch error, falling back to memory store:', err);
    }
  }

  return Array.from(memoryDocuments.values());
}

/**
 * Deletes document and its chunks
 */
export async function deleteDocument(docId: string): Promise<boolean> {
  if (supabase) {
    try {
      await supabase.from('documents').delete().eq('id', docId);
    } catch (err) {
      console.warn('Supabase document delete error:', err);
    }
  }

  memoryDocuments.delete(docId);
  for (let i = memoryChunks.length - 1; i >= 0; i--) {
    if (memoryChunks[i].document_id === docId) {
      memoryChunks.splice(i, 1);
    }
  }

  return true;
}
