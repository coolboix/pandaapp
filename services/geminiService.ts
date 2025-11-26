import { GoogleGenAI, Type } from "@google/genai";
import { MagicTaskResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseTaskFromText = async (text: string, currentUsers: { userA: string, userB: string }): Promise<MagicTaskResponse | null> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const prompt = `
      Current Date: ${today}
      User A Name: ${currentUsers.userA}
      User B Name: ${currentUsers.userB}
      
      Extract task details from the following request: "${text}"
      
      If the assignee is not clear, default to 'shared'.
      If the status is not clear, default to 'todo'.
      If a specific color isn't mentioned, pick a pastel hex color that fits the mood.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            status: { type: Type.STRING, enum: ['todo', 'in-progress', 'done'] },
            assignee: { type: Type.STRING, enum: ['userA', 'userB', 'shared'] },
            dueDate: { type: Type.STRING, description: "ISO date string YYYY-MM-DD or null" },
            priorityColor: { type: Type.STRING, description: "Hex color code" }
          },
          required: ["title", "status", "assignee", "priorityColor"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as MagicTaskResponse;
    }
    return null;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};