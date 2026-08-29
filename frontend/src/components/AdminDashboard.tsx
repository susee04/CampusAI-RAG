import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Trash2, Shield, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { UserSession } from '../lib/supabase';

interface DocumentItem {
  id: string;
  name: string;
  size: number;
  created_at?: string;
}

interface AdminDashboardProps {
  session: UserSession;
  onBackToLanding: () => void;
  onOpenChat: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ session, onBackToLanding, onOpenChat }) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      if (res.ok && data.documents) {
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setSelectedFile(file);
        setUploadStatus(null);
      } else {
        setUploadStatus({ type: 'error', msg: 'Only PDF files are supported.' });
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        setUploadStatus({
          type: 'success',
          msg: `"${selectedFile.name}" successfully uploaded & embedded into vector database!`
        });
        setSelectedFile(null);
        fetchDocuments();
      } else {
        setUploadStatus({
          type: 'error',
          msg: data.error || 'Failed to process document upload.'
        });
      }
    } catch (err: any) {
      setUploadStatus({
        type: 'error',
        msg: err.message || 'Error connecting to upload API.'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string, docName: string) => {
    if (!confirm(`Are you sure you want to delete "${docName}"?`)) return;

    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== docId));
      }
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToLanding}
              className="p-2 rounded-xl glass-panel text-gray-300 hover:text-white hover:border-purple-400 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                <h1 className="text-2xl font-bold">Admin Management Dashboard</h1>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Upload PDFs for smart text extraction & Gemini 768d vector embeddings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenChat}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-glowPurple hover:opacity-90 transition"
            >
              Launch Chat Interface
            </button>
          </div>
        </div>

        {/* Upload Drop Zone Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel-glow rounded-2xl p-6 md:p-8 border border-purple-500/30"
        >
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Upload className="w-5 h-5 text-purple-400" />
            Upload PDF Document
          </h2>
          <p className="text-xs text-gray-400 mb-6">
            Supported formats: .pdf (Max 20MB). Automatic parsing, chunking, and pgvector storage.
          </p>

          <div className="border-2 border-dashed border-purple-500/30 hover:border-purple-400/60 rounded-xl p-8 text-center bg-slate-900/40 transition flex flex-col items-center justify-center">
            <FileText className="w-12 h-12 text-purple-400 mb-3 animate-pulse" />
            <p className="text-sm font-medium text-gray-200">
              {selectedFile ? selectedFile.name : 'Select or drag & drop campus PDF document'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {selectedFile ? formatBytes(selectedFile.size) : 'PDF documents up to 20 MB'}
            </p>

            <input
              type="file"
              accept=".pdf,application/pdf"
              id="pdf-upload-input"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex items-center gap-3 mt-5">
              <label
                htmlFor="pdf-upload-input"
                className="px-4 py-2 rounded-xl text-xs font-semibold glass-panel border border-purple-500/40 text-purple-200 hover:bg-purple-900/30 cursor-pointer transition"
              >
                Browse File
              </label>

              {selectedFile && (
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-glowPurple hover:opacity-95 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Chunking & Vectorizing...
                    </>
                  ) : (
                    'Process PDF & Store Embeddings'
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Upload Status Banner */}
          {uploadStatus && (
            <div className={`mt-4 p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
              uploadStatus.type === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/15 border border-red-500/30 text-red-300'
            }`}>
              {uploadStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{uploadStatus.msg}</span>
            </div>
          )}
        </motion.div>

        {/* Uploaded Files Table */}
        <div className="glass-panel rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              Uploaded PDF Resources ({documents.length})
            </h2>
            <button
              onClick={fetchDocuments}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
              title="Refresh list"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400 text-sm">Loading document repository...</div>
          ) : documents.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              No uploaded documents yet. Upload a campus PDF above to enable AI RAG search!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400">
                    <th className="py-3 px-4">Document Name</th>
                    <th className="py-3 px-4">File Size</th>
                    <th className="py-3 px-4">Uploaded At</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-white/5 transition">
                      <td className="py-3.5 px-4 font-medium text-purple-200 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                        {doc.name}
                      </td>
                      <td className="py-3.5 px-4 text-gray-400">{formatBytes(doc.size)}</td>
                      <td className="py-3.5 px-4 text-gray-400">
                        {doc.created_at ? new Date(doc.created_at).toLocaleString() : 'Just now'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDelete(doc.id, doc.name)}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
                          title="Delete document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
