import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import * as mammoth from "mammoth";

dotenv.config();

const app = express();
const PORT = (() => {
  const portArgIdx = process.argv.indexOf('--port');
  if (portArgIdx !== -1) {
    return parseInt(process.argv[portArgIdx + 1], 10);
  }
  return process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
})();

app.use(express.json());

// Initialize Gemini
function getGeminiClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not set. Please add it to your environment variables or the AI Studio secrets panel.');
  }
  return new GoogleGenAI({ 
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Mock Google Drive files representing the 165+ Hebrew articles
const DUMMY_ARTICLES = [
  { id: '1', title: 'הגאולה האמיתית והשלימה', folder: 'Geulah Concepts', language: 'he' },
  { id: '2', title: 'תורתו של משיח', folder: 'Torah of Moshiach', language: 'he' },
  { id: '3', title: 'ימות המשיח: הסבר', folder: 'Geulah Concepts', language: 'he' },
  { id: '4', title: 'כיצד להתכונן לגאולה', folder: 'Preparation', language: 'he' },
];

// Recursive function to get all files in a folder
async function getFilesInFolder(folderId: string, apiKey: string, depth = 0): Promise<any[]> {
  if (depth > 3) return []; // Limit recursion depth
  const driveApiUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType)&key=${apiKey}`;
  const res = await fetch(driveApiUrl);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  let allFiles: any[] = [];
  for (const f of data.files || []) {
    if (f.mimeType === 'application/vnd.google-apps.folder') {
      const children = await getFilesInFolder(f.id, apiKey, depth + 1);
      allFiles = allFiles.concat(children);
    } else {
      allFiles.push(f);
    }
  }
  return allFiles;
}

// Function to read text content from public google docs or text files
async function getDocumentText(fileId: string, mimeType: string, apiKey: string) {
  try {
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`);
      if (!res.ok) return `[Failed to read document ${fileId}]`;
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const result = await mammoth.extractRawText({ buffer });
      return result.value || `[Empty docx]`;
    } else if (mimeType === 'application/vnd.google-apps.document') {
      // Use the public export URL for public docs (bypasses API key restriction for exports)
      const res = await fetch(`https://docs.google.com/document/d/${fileId}/export?format=txt`);
      if (!res.ok) return `[Failed to read document ${fileId}]`;
      return await res.text();
    } else if (mimeType.startsWith('text/')) {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`);
      if (!res.ok) return `[Failed to read file ${fileId}]`;
      return await res.text();
    }
    return `[Content of type ${mimeType} skipped]`;
  } catch (err) {
    return `[Error reading ${fileId}]`;
  }
}

app.get("/api/articles", async (req, res) => {
  try {
    const { folderId: qFolderId, translateToEnglish, forceSync } = req.query;
    const defaultFolderId = "1pa7VGwBLaOMOzVnqdxqxrUFXinv5FId7"; // Default to the newly provided folder
    const folderId = (qFolderId as string) || process.env.GOOGLE_DRIVE_FOLDER_ID || defaultFolderId;
    
    // Serve from static file for the default folder
    if ((folderId === defaultFolderId || folderId.startsWith('cached_folder_')) && forceSync !== 'true') {
      try {
        const articlesData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/data/articles.json'), 'utf-8'));
        const allArticles = articlesData.articles;
        
        if (folderId === defaultFolderId) {
          // Extract unique folders
          const folderNames = [...new Set((allArticles as any[]).map(a => a.folder).filter(f => f))];
          const folderObjects = folderNames.map((name: any) => ({
            id: 'cached_folder_' + name,
            title: name,
            folder: 'folder',
            language: 'en',
            mimeType: 'application/vnd.google-apps.folder',
            isFolder: true
          }));
          return res.json({ articles: folderObjects });
        } else {
          // Serve articles for specific cached folder
          const folderName = folderId.replace('cached_folder_', '');
          const articlesInFolder = allArticles.filter((a: any) => a.folder === folderName);
          return res.json({ articles: articlesInFolder });
        }
      } catch(e) {
        console.error('Failed to read articles cache:', e);
      }
    }

    if (!folderId) {
      return res.json({ articles: DUMMY_ARTICLES, message: "No folder ID provided, showing mock data." });
    }

    const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GOOGLE_DRIVE_API_KEY is not set in environment." });
    }

    const driveApiUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType)&key=${apiKey}`;
    const driveRes = await fetch(driveApiUrl);
    const driveData = await driveRes.json();

    if (driveData.error) {
      return res.status(400).json({ error: driveData.error.message });
    }

    const files = (driveData.files || []).filter((f: any) => f.name !== 'Moshiach');

    let articles = files.map((f: any) => {
      let title = f.name.replace(/\.[^/.]+$/, ""); // remove extension
      title = title.replace(/_/g, '"'); // Replace underscores with "
      return {
        id: f.id,
        title: title,
        folder: f.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : 'article',
        language: 'he', // Assume Hebrew based on context
        mimeType: f.mimeType,
        isFolder: f.mimeType === 'application/vnd.google-apps.folder'
      };
    });

    if (translateToEnglish === 'true' && articles.length > 0) {
      try {
        const ai = getGeminiClient();
        const titles = articles.map(a => a.title);
        const prompt = `Translate the following Hebrew file and folder names into English. Return ONLY a JSON array of strings in the same order and length. Example: ["Translated 1", "Translated 2"]\n\nJSON strictly:\n${JSON.stringify(titles)}`;
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt
        });
        const text = response.text || "[]";
        const jsonMatch = text.match(/\[.*\]/s);
        if (jsonMatch) {
          const translations = JSON.parse(jsonMatch[0]);
          if (Array.isArray(translations) && translations.length === articles.length) {
             articles = articles.map((a, i) => ({ ...a, title: translations[i], language: 'en' }));
          }
        }
      } catch (e) {
        console.error("Failed to translate categories", e);
      }
    }

    // Sort folders first
    articles.sort((a: any, b: any) => (b.isFolder ? 1 : 0) - (a.isFolder ? 1 : 0));

    res.json({ articles });
  } catch (err: any) {
    console.error("Drive API error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/articleContent", async (req, res) => {
  try {
    const { id, mimeType } = req.query;
    if (!id) return res.status(400).json({ error: "Missing document ID." });
    
    // API key is only strictly required for certain formats (like txt/docx files or folder queries). 
    // Google Docs use public export URL without API key.
    const apiKey = process.env.GOOGLE_DRIVE_API_KEY || '';

    const content = await getDocumentText(id as string, (mimeType as string) || '', apiKey);
    res.json({ content });
  } catch (err: any) {
    console.error("Failed to fetch article content:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/translate", async (req, res) => {
  try {
    const ai = getGeminiClient();
    const { id, title, mimeType } = req.body;
    
    if (!id || !title) {
        return res.status(400).json({ error: "ID and title expected." });
    }

    const apiKey = process.env.GOOGLE_DRIVE_API_KEY || '';

    // Fetch original content from drive
    let originalText = await getDocumentText(id, mimeType || '', apiKey);

    // If it's too long, truncate it to save context window, or assume it fits
    if (originalText.length > 50000) {
      originalText = originalText.substring(0, 50000) + "\n...[truncated]";
    }

    const prompt = `You are a translator for Moshiach.ai, an expert Jewish teacher on the topic of Moshiach and Geulah. 
Translate the following Hebrew article into an English summary and translation.
Make the output formatted in Markdown, with appropriate headings.

Article Title: ${title}

Original Content:
${originalText}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    
    res.json({ translation: response.text });
  } catch (err: any) {
    console.error("Translation error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const ai = getGeminiClient();
    const { message, history, folderContextId, specificDocumentId } = req.body;
    let systemInstruction = "You are an expert Jewish teacher on the topic of Moshiach and Geulah. Answer questions based on traditional Jewish sources, clearly and inspirationally.\nIMPORTANT: Whenever possible, cite your sources linking back to the original documents in Google Drive if you use context from them, formatting the link like [Document Title](https://drive.google.com/file/d/DOCUMENT_ID/view).";

    // If the user wants to chat with a specific folder context, load the documents
    if (folderContextId || specificDocumentId) {
       const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
       if (apiKey) {
         try {
           let readableFiles: any[] = [];
           if (specificDocumentId && specificDocumentId !== '1pa7VGwBLaOMOzVnqdxqxrUFXinv5FId7') {
              // Get metadata for specific doc to know mimetype
              const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${specificDocumentId}?fields=id,name,mimeType&key=${apiKey}`);
              const meta = await metaRes.json();
              if (meta && meta.id) {
                readableFiles.push(meta);
              }
           } else if (folderContextId) {
             const files = await getFilesInFolder(folderContextId, apiKey);
             // Take up to 5 readable files to avoid overwhelming the prompt context size
             readableFiles = files.filter(f => f.mimeType === 'application/vnd.google-apps.document' || f.mimeType.startsWith('text/')).slice(0, 5);
           }

           if (readableFiles.length > 0) {
              let contextData = "Here are the relevant documents you should base your answer on:\n\n";
              
              for (const f of readableFiles) {
                 const text = await getDocumentText(f.id, f.mimeType, apiKey);
                 contextData += `--- Document: ${f.name} (ID: ${f.id}) ---\n${text.substring(0, 50000)}\n\n`; // increased length limit for context if single doc
              }
              systemInstruction += `\n\n${contextData}`;
           }
         } catch (e) {
           console.error("Failed to load folder context for chat:", e);
         }
       }
    }
    
    const contents = history.map((msg: any) => ({
       role: msg.role === 'user' ? 'user' : 'model',
       parts: [{ text: msg.content }]
    }));
    
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction
      }
    });

    res.json({ response: response.text });
  } catch (err: any) {
    console.error("Chat error:", err);
    res.status(500).json({ error: err.message });
  }
});


if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  async function startServer() {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: { port: 0 }
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
  startServer();
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*all', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

export default app;
