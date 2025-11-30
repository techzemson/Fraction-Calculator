import { GoogleGenAI } from "@google/genai";
import { FractionData, OperationType } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateExplanation = async (
  f1: FractionData,
  f2: FractionData,
  op: OperationType,
  resultDecimal: number
) => {
  const ai = getClient();
  if (!ai) return null;

  const operationSymbol = 
    op === 'add' ? '+' : 
    op === 'subtract' ? '-' : 
    op === 'multiply' ? '*' : '/';

  const f1Str = `${f1.whole ? f1.whole + ' ' : ''}${f1.numerator}/${f1.denominator}`;
  const f2Str = `${f2.whole ? f2.whole + ' ' : ''}${f2.numerator}/${f2.denominator}`;
  
  const prompt = `
    I am a student learning fractions.
    I just solved this problem: (${f1Str}) ${operationSymbol} (${f2Str}).
    The result decimal is ${resultDecimal}.
    
    Please provide:
    1. A very simple, "Explain Like I'm 5" explanation of why the answer is what it is (conceptual, not just math steps).
    2. A creative, fun real-world word problem that matches these numbers exactly.
    
    Output JSON format:
    {
      "simpleExplanation": "string",
      "realWorldScenario": "string"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};
