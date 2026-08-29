import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import { parsePDFAndChunk } from './services/pdf.js';
import { getEmbedding, getBatchEmbeddings } from './services/embeddings.js';
import { storeDocumentWithChunks, searchSimilarChunks, listDocuments, deleteDocument } from './services/vectorstore.js';
import { generateRAGAnswer, streamRAGAnswer } from './services/gemini.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || '*';

// Configure Middleware
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

// Configure Multer memory storage for PDF uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF documents are allowed!'));
    }
  }
});

// Health Endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'CampusAI-RAG Backend',
    timestamp: new Date().toISOString(),
    env: {
      supabaseConfigured: !!(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY)),
      geminiConfigured: !!process.env.GEMINI_API_KEY
    }
  });
});

// Document Upload Endpoint
app.post('/api/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded.' });
    }

    const file = req.file;
    console.log(`[Upload] Processing document: ${file.originalname} (${file.size} bytes)`);

    // Parse and chunk PDF
    const { numPages, chunks } = await parsePDFAndChunk(file.buffer);
    console.log(`[Upload] Parsed ${numPages} pages into ${chunks.length} chunks.`);

    // Generate Gemini embeddings for each chunk
    const contents = chunks.map(c => c.content);
    const embeddings = await getBatchEmbeddings(contents);

    const chunksWithEmbeddings = chunks.map((chunk, i) => ({
      ...chunk,
      embedding: embeddings[i]
    }));

    // Store in Supabase pgvector / Memory store
    const docRecord = await storeDocumentWithChunks(
      file.originalname,
      file.size,
      `documents/${Date.now()}_${file.originalname}`,
      chunksWithEmbeddings
    );

    res.status(201).json({
      message: 'PDF uploaded, chunked, and vectorized successfully!',
      document: docRecord,
      pages: numPages,
      totalChunks: chunks.length
    });
  } catch (error: any) {
    console.error('Error during document upload:', error);
    res.status(500).json({ error: error.message || 'Failed to process and vectorize uploaded document.' });
  }
});

// List Documents Endpoint
app.get('/api/documents', async (_req: Request, res: Response) => {
  try {
    const docs = await listDocuments();
    res.json({ documents: docs });
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to retrieve documents.' });
  }
});

// Delete Document Endpoint
app.delete('/api/documents/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await deleteDocument(id);
    res.json({ message: 'Document deleted successfully.', id });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document.' });
  }
});

// Chat Endpoint (Supports Standard JSON and Server-Sent Events SSE Streaming)
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { prompt, stream = false } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Question prompt is required.' });
    }

    console.log(`[Chat Query]: "${prompt}" (streaming: ${stream})`);

    // Step 1: Generate Embedding for user query
    const queryEmbedding = await getEmbedding(prompt);

    // Step 2: Perform vector search in Supabase pgvector
    const retrievedChunks = await searchSimilarChunks(queryEmbedding, 5, 0.1);
    console.log(`[Vector Search]: Retrieved ${retrievedChunks.length} relevant chunks.`);

    // Step 3: Handle streaming vs non-streaming response
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const { citations } = await streamRAGAnswer(prompt, retrievedChunks, (chunkText) => {
        res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
      });

      // Send metadata and citations at the end of stream
      res.write(`data: ${JSON.stringify({ citations, done: true })}\n\n`);
      res.end();
    } else {
      const ragResult = await generateRAGAnswer(prompt, retrievedChunks);
      res.json({
        answer: ragResult.answer,
        citations: ragResult.citations
      });
    }
  } catch (error: any) {
    console.error('Error in chat endpoint:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'An error occurred while answering your question.' });
    }
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`\n⚡ CampusAI-RAG Express Server running on port ${PORT}`);
  console.log(`👉 Health check: http://localhost:${PORT}/api/health\n`);
});
