import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import * as mammoth from "mammoth";
import dotenv from "dotenv";
import { articlesData } from "../src/data/articlesData";

dotenv.config();

export const apiRouter = Router();

// Initialize Gemini
function getGeminiClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not set.');
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

apiRouter.get("/api/articles", async (req, res) => {
  try {
    const { folderId: qFolderId, translateToEnglish, forceSync } = req.query;
    const defaultFolderId = "1pa7VGwBLaOMOzVnqdxqxrUFXinv5FId7";
    const folderId = (qFolderId as string) || process.env.GOOGLE_DRIVE_FOLDER_ID || defaultFolderId;
    
    if ((folderId === defaultFolderId || folderId.startsWith('cached_folder_')) && forceSync !== 'true') {
      try {
        const allArticles = articlesData.articles;
        if (folderId === defaultFolderId) {
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
          const folderName = folderId.replace('cached_folder_', '');
          const articlesInFolder = allArticles.filter((a: any) => a.folder === folderName);
          return res.json({ articles: articlesInFolder });
        }
      } catch(e) {
        console.error('Failed to read articles cache:', e);
      }
    }

    if (!folderId) {
      return res.json({ articles: DUMMY_ARTICLES, message: "No folder ID provided." });
    }

    const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GOOGLE_DRIVE_API_KEY is not set." });
    }

    const driveApiUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType)&key=${apiKey}`;
    const driveRes = await fetch(driveApiUrl);
    const driveData = await driveRes.json();

    if (driveData.error) {
      return res.status(400).json({ error: driveData.error.message });
    }

    const files = (driveData.files || []).filter((f: any) => f.name !== 'Moshiach');

    let articles = files.map((f: any) => {
      let title = f.name.replace(/\.[^/.]+$/, "").replace(/_/g, '"');
      return {
        id: f.id,
        title: title,
        folder: f.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : 'article',
        language: 'he',
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

    articles.sort((a: any, b: any) => (b.isFolder ? 1 : 0) - (a.isFolder ? 1 : 0));
    res.json({ articles });
  } catch (err: any) {
    console.error("Drive API error:", err);
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get("/api/articleContent", async (req, res) => {
  try {
    const { id, mimeType } = req.query;
    if (!id) return res.status(400).json({ error: "Missing document ID." });
    const apiKey = process.env.GOOGLE_DRIVE_API_KEY || '';
    const content = await getDocumentText(id as string, (mimeType as string) || '', apiKey);
    res.json({ content });
  } catch (err: any) {
    console.error("Failed to fetch article content:", err);
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post("/api/translate", async (req, res) => {
  try {
    const ai = getGeminiClient();
    const { id, title, mimeType } = req.body;
    if (!id || !title) return res.status(400).json({ error: "ID and title expected." });

    const apiKey = process.env.GOOGLE_DRIVE_API_KEY || '';
    let originalText = await getDocumentText(id, mimeType || '', apiKey);

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

apiRouter.post("/api/chat", async (req, res) => {
  try {
    const ai = getGeminiClient();
    const { message, history, folderContextId, specificDocumentId } = req.body;
    let systemInstruction = "You are an expert Jewish teacher on the topic of Moshiach and Geulah. Answer questions based on traditional Jewish sources, clearly and inspirationally.\nIMPORTANT: Whenever possible, cite your sources linking back to the original documents in Google Drive if you use context from them, formatting the link like [Document Title](https://drive.google.com/file/d/DOCUMENT_ID/view).";

    if (folderContextId || specificDocumentId) {
       const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
       if (apiKey) {
         try {
           let readableFiles: any[] = [];
           if (specificDocumentId && specificDocumentId !== '1pa7VGwBLaOMOzVnqdxqxrUFXinv5FId7') {
              const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${specificDocumentId}?fields=id,name,mimeType&key=${apiKey}`);
              const meta = await metaRes.json();
              if (meta && meta.id) {
                readableFiles.push(meta);
              }
           } else if (folderContextId) {
             const files = await getFilesInFolder(folderContextId, apiKey);
             readableFiles = files.filter(f => f.mimeType === 'application/vnd.google-apps.document' || f.mimeType.startsWith('text/')).slice(0, 5);
           }

           if (readableFiles.length > 0) {
              let contextData = "Here are the relevant documents you should base your answer on:\n\n";
              for (const f of readableFiles) {
                 const text = await getDocumentText(f.id, f.mimeType, apiKey);
                 contextData += `--- Document: ${f.name} (ID: ${f.id}) ---\n${text.substring(0, 50000)}\n\n`;
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
