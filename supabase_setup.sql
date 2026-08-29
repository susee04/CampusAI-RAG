-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create documents table to track uploaded files
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  size bigint not null,
  storage_path text,
  mime_type text default 'application/pdf',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create document_chunks table to store text chunks and vector embeddings
create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade,
  document_name text not null,
  chunk_index integer not null,
  page_number integer default 1,
  content text not null,
  embedding vector(768), -- Gemini text-embedding-004 produces 768-dimensional vectors
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create HNSW index for fast vector similarity queries
create index if not exists document_chunks_embedding_hnsw_idx
on public.document_chunks
using hnsw (embedding vector_cosine_ops);

-- Create vector match function for RPC call from backend
create or replace function match_document_chunks (
  query_embedding vector(768),
  match_threshold float default 0.3,
  match_count int default 5
)
returns table (
  id uuid,
  document_id uuid,
  document_name text,
  chunk_index int,
  page_number int,
  content text,
  similarity float
)
language sql stable
as $$
  select
    document_chunks.id,
    document_chunks.document_id,
    document_chunks.document_name,
    document_chunks.chunk_index,
    document_chunks.page_number,
    document_chunks.content,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  from document_chunks
  where 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
$$;

-- Create Storage bucket for PDFs (if executing in Supabase query editor)
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;
