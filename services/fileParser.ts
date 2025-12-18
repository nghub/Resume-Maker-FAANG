
declare global {
  interface Window {
    pdfjsLib: any;
    mammoth: any;
  }
}

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const validateDuplicateFile = (file: File, currentFileName: string | null): void => {
  if (currentFileName && file.name === currentFileName) {
    throw new Error(`The file "${file.name}" has already been uploaded.`);
  }
};

export const parseFile = async (file: File): Promise<string> => {
  // 1. Check File Size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Please upload a file smaller than ${MAX_FILE_SIZE_MB}MB.`);
  }

  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  try {
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return await parsePdf(file);
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      fileName.endsWith('.docx')
    ) {
      return await parseDocx(file);
    } else if (fileType.startsWith('text/') || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
      return await readTextFile(file);
    } else {
      throw new Error("Unsupported file format. Please upload PDF, DOCX, or TXT.");
    }
  } catch (error: any) {
    console.error("File parsing error:", error);
    
    // Pass through specific errors we threw
    if (error.message.includes("File is too large") || error.message.includes("Unsupported")) {
      throw error;
    }
    
    // Handle Password Protected PDFs
    if (error.name === 'PasswordException' || error.message.includes('password')) {
      throw new Error("This PDF is password protected. Please remove the password and try again.");
    }

    // Generic Fallback
    throw new Error(`Failed to read ${file.name}. The file might be corrupted or in an unrecognized format.`);
  }
};

const readTextFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text.trim()) {
        reject(new Error("The file appears to be empty."));
      } else {
        resolve(text);
      }
    };
    reader.onerror = () => reject(new Error("Error reading text file"));
    reader.readAsText(file);
  });
};

/**
 * Robust PDF Parsing Strategy:
 * Instead of simple text extraction which often fails on columns (reading left-right across columns),
 * we categorize text items by their Y-coordinate (vertical position) to identify lines,
 * and then sort by X-coordinate (horizontal position) within those lines.
 */
const parsePdf = async (file: File): Promise<string> => {
  if (!window.pdfjsLib) throw new Error("System Error: PDF parser (PDF.js) failed to load. Please refresh the page.");
  
  // Configure worker
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    if (pdf.numPages === 0) throw new Error("This PDF has no pages.");

    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Advanced Sorting Logic for Columns/Tables
      const items = textContent.items.map((item: any) => ({
        str: item.str,
        // PDF coordinates: (0,0) is bottom-left. 
        // transform[4] is X, transform[5] is Y.
        x: item.transform[4],
        y: item.transform[5],
        height: item.height || 0
      }));

      // Group items into lines based on Y-coordinate tolerance
      // Items on the "same line" usually vary slightly in Y due to fonts/rendering
      const LINE_TOLERANCE = 5; 
      const lines: { y: number; items: typeof items }[] = [];

      items.forEach((item: any) => {
        // Find an existing line that matches this item's Y within tolerance
        const line = lines.find(l => Math.abs(l.y - item.y) < LINE_TOLERANCE);
        if (line) {
          line.items.push(item);
        } else {
          lines.push({ y: item.y, items: [item] });
        }
      });

      // 1. Sort lines Top-to-Bottom (PDF Y is 0 at bottom, so Descending Y)
      lines.sort((a, b) => b.y - a.y);

      // 2. Sort items within lines Left-to-Right (Ascending X)
      lines.forEach(line => {
        line.items.sort((a: any, b: any) => a.x - b.x);
      });

      // 3. Join text
      const pageText = lines.map(line => {
         // Join items in the line, adding space if X distance implies a space
         // Simple join for now is usually sufficient after sorting
         return line.items.map((item: any) => item.str).join(' ');
      }).join('\n');

      fullText += pageText + '\n\n';
    }
    
    // Check for scanned PDF (images only)
    if (!fullText.trim() || fullText.trim().length < 50) {
      throw new Error("We couldn't extract text from this PDF. It might be a scanned image. Please convert it to a text-searchable PDF or use a Word doc.");
    }
    
    return fullText;
  } catch (e: any) {
    throw e;
  }
};

const parseDocx = async (file: File): Promise<string> => {
  if (!window.mammoth) throw new Error("System Error: DOCX parser (Mammoth) failed to load. Please refresh the page.");
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await window.mammoth.extractRawText({ arrayBuffer });
    
    if (!result.value.trim()) {
       throw new Error("We couldn't extract text from this Word document. It might be empty or contain only images.");
    }
    
    return result.value;
  } catch (e: any) {
    throw e;
  }
};
