import pdfParse from 'pdf-parse';

export interface PDFChunk {
  chunkIndex: number;
  pageNumber: number;
  content: string;
}

export interface PDFParseResult {
  text: string;
  numPages: number;
  chunks: PDFChunk[];
}

/**
 * Parses PDF buffer and extracts text into smart overlapping chunks with page metadata
 */
export async function parsePDFAndChunk(buffer: Buffer, chunkSize: number = 500, chunkOverlap: number = 100): Promise<PDFParseResult> {
  const pageTexts: { pageNumber: number; text: string }[] = [];

  const options = {
    pagerender: function (pageData: any) {
      return pageData.getTextContent().then(function (textContent: any) {
        let lastY, text = '';
        for (let item of textContent.items) {
          if (lastY == item.transform[5] || !lastY) {
            text += item.str;
          } else {
            text += '\n' + item.str;
          }
          lastY = item.transform[5];
        }
        return text;
      });
    }
  };

  const parsed = await pdfParse(buffer, options);
  const totalPages = parsed.numpages || 1;

  // Split content per page if page markers exist, otherwise split full text
  const rawText = parsed.text;
  const chunks: PDFChunk[] = [];

  // Clean text
  const cleanedText = rawText.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();

  // Create overlapping chunks
  let currentIndex = 0;
  let chunkCount = 0;

  while (currentIndex < cleanedText.length) {
    const end = Math.min(currentIndex + chunkSize, cleanedText.length);
    let chunkText = cleanedText.slice(currentIndex, end);

    // Try to end chunk at a boundary (sentence or newline) if possible
    if (end < cleanedText.length) {
      const lastPeriod = chunkText.lastIndexOf('.');
      const lastNewline = chunkText.lastIndexOf('\n');
      const boundary = Math.max(lastPeriod, lastNewline);
      if (boundary > chunkSize * 0.6) {
        chunkText = chunkText.slice(0, boundary + 1);
      }
    }

    const trimmedChunk = chunkText.trim();
    if (trimmedChunk.length > 20) {
      // Estimate page number based on text position
      const pageRatio = currentIndex / Math.max(cleanedText.length, 1);
      const estimatedPage = Math.min(Math.floor(pageRatio * totalPages) + 1, totalPages);

      chunks.push({
        chunkIndex: chunkCount++,
        pageNumber: estimatedPage,
        content: trimmedChunk
      });
    }

    const advanceBy = Math.max(1, chunkText.length - chunkOverlap);
    currentIndex += advanceBy;
  }

  // Fallback if text was too short to create chunks
  if (chunks.length === 0 && cleanedText.length > 0) {
    chunks.push({
      chunkIndex: 0,
      pageNumber: 1,
      content: cleanedText
    });
  }

  return {
    text: cleanedText,
    numPages: totalPages,
    chunks
  };
}
