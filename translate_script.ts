import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
dotenv.config();

function getGeminiClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set');
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });
}

async function run() {
  const ai = getGeminiClient();
  const data = JSON.parse(fs.readFileSync('src/data/articles.json', 'utf8'));
  const files = data.articles;
  
  const untranslated = files.filter((a: any) => a.language === 'he');
  console.log(`Untranslated: ${untranslated.length}`);
  
  const batchSize = 25;
  for (let i = 0; i < untranslated.length; i += batchSize) {
     console.log(`Translating batch ${i} to ${i + batchSize}`);
     const batch = untranslated.slice(i, i + batchSize);
     const titles = batch.map((a: any) => a.title);
     try {
        const prompt = `Translate the following Hebrew file names into English. Return ONLY a JSON array of strings in the exact same order. Example: ["Translated 1", "Translated 2"]\n\nJSON STRICTLY:\n${JSON.stringify(titles)}`;
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt
        });
        const text = response.text || "[]";
        const jsonMatch = text.match(/\[.*\]/s);
        if (jsonMatch) {
            const translations = JSON.parse(jsonMatch[0]);
            if (Array.isArray(translations) && translations.length === batch.length) {
                for (let j = 0; j < batch.length; j++) {
                    const idx = files.findIndex((f: any) => f.id === batch[j].id);
                    if (idx > -1) {
                        files[idx].title = translations[j];
                        files[idx].language = 'en';
                    }
                }
            }
        }
     } catch(e: any) {
         console.error('Translation error', e.message);
     }
  }
  
  fs.writeFileSync('src/data/articles.json', JSON.stringify({ articles: files }, null, 2));
  console.log("Done");
}
run();
