
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { AnalysisResult, User } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    overallScore: { type: Type.NUMBER, description: "Total ATS score from 0-100 based on current resume" },
    projectedScore: { type: Type.NUMBER, description: "The new ATS score (must be >= 95) achievable after applying all fixes" },
    summary: { type: Type.STRING, description: "A brief 2-sentence summary of the analysis" },
    personalInfo: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        title: { type: Type.STRING },
        email: { type: Type.STRING },
        phone: { type: Type.STRING },
        linkedin: { type: Type.STRING },
        website: { type: Type.STRING },
        location: { type: Type.STRING },
      },
      required: ["name", "title"],
    },
    cultureFit: {
      type: Type.OBJECT,
      description: "Analysis of fit against inferred company values",
      properties: {
        companyName: { type: Type.STRING },
        inferredValues: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "List of inferred core values." 
        },
        alignmentScore: { type: Type.NUMBER, description: "0-100 score based on cultural fit" },
        analysis: { type: Type.STRING, description: "Brief explanation of how the resume aligns with these specific values." }
      },
      required: ["companyName", "inferredValues", "alignmentScore", "analysis"]
    },
    breakdown: {
      type: Type.ARRAY,
      description: "Must include exact 4 categories: 'Skills Match', 'Experience Relevance', 'Keywords Match', 'Role Alignment'",
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          score: { type: Type.NUMBER },
        },
      },
    },
    skills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          rating: { type: Type.INTEGER, description: "Proficiency 1-5" },
          category: { type: Type.STRING, enum: ["Technical", "Soft", "Tools", "Languages"] },
        },
      },
    },
    certifications: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    missingKeywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    criticalKeywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    weaknesses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    improvements: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          section: { type: Type.STRING },
          title: { type: Type.STRING },
          recommendation: { type: Type.STRING },
          impact: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
          scoreBoost: { type: Type.NUMBER },
          isFixable: { type: Type.BOOLEAN },
        },
      },
    },
    rewrittenResume: {
      type: Type.STRING,
      description: "Full rewritten resume in Markdown. Use # for Name, ## for Sections, ### for Roles. Ensure consistent bullet point usage.",
    },
    coverLetter: {
      type: Type.STRING,
      description: "Tailored cover letter in Markdown.",
    },
  },
  required: ["overallScore", "projectedScore", "personalInfo", "breakdown", "skills", "improvements", "rewrittenResume", "coverLetter", "cultureFit"],
};

export const analyzeResume = async (resumeText: string, jdText: string, companyName: string, user?: User): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("Configuration Error: Google API Key is missing.");
  }

  const model = "gemini-3-pro-preview";
  
  const systemInstruction = `
    You are an expert ATS Resume Optimizer. Goal: 95%+ match score.

    FORMATTING RULES FOR ATS COMPATIBILITY:
    - Use clear, consistent Markdown headers: # for Name, ## for Major Sections (e.g., EXPERIENCE, SKILLS), ### for Job Titles/Company.
    - Use standard bullet points (- or *) for responsibilities.
    - Ensure symmetrical spacing between sections.
    - Optimize for keyword density without 'stuffing'.

    PROCESS:
    1. Infer Company Values for '${companyName}'.
    2. Score Resume against JD across 4 pillars.
    3. Generate detailed 'improvements' bridging the gap to 95%.
    4. Provide 'rewrittenResume' with ENHANCED bullet points (Action Verbs + Metrics + Keywords).
    
    STRUCTURE PRESERVATION: Preserve exact career history (Names, Dates, Titles). Only optimize bullet descriptions.
    
    OUTPUT: Valid JSON.
  `;

  const prompt = `
    TARGET COMPANY: ${companyName}
    JD: ${jdText}
    RESUME: ${resumeText}
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    if (!response.text) throw new Error("Empty response from AI.");
    return JSON.parse(response.text) as AnalysisResult;
  } catch (error: any) {
    console.error("Analysis Error:", error);
    throw error;
  }
};

export const validateAndFormatResume = async (text: string): Promise<{ isValidResume: boolean; formattedContent: string; reason: string }> => {
  const model = "gemini-3-flash-preview";
  const systemInstruction = `
    Resume Validation and Formatting Engine.
    
    TASK:
    1. **VALIDATION**: Determine if text is a Resume/CV.
    2. **FORMATTING**: Clean up layout. Fix broken line breaks. Ensure consistent header hierarchy (# Name, ## Section). Standardize bullet points.
    
    PRESERVE: All facts, names, dates. Only fix the layout/presentation for ATS readability.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValidResume: { type: Type.BOOLEAN },
            formattedContent: { type: Type.STRING },
            reason: { type: Type.STRING }
          },
          required: ["isValidResume", "formattedContent", "reason"]
        },
      },
      contents: [{ role: "user", parts: [{ text }] }],
    });
    return JSON.parse(response.text);
  } catch (error) {
    return { isValidResume: true, formattedContent: text, reason: "Fallback mode active." };
  }
};

export const createChatSession = (resumeText: string, jdText: string, analysisResult: AnalysisResult | null): Chat => {
  const personalInfo = analysisResult?.personalInfo;
  const immutableProfile = personalInfo ? `NAME: ${personalInfo.name}\nEMAIL: ${personalInfo.email}\nPHONE: ${personalInfo.phone}` : "PRESERVE CONTACT INFO";

  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: `Apply IQ Copilot. Rewrite for 95% ATS score.
      STRICT PRESERVATION: Identity, Career Dates, Job Titles.
      WHAT TO CHANGE: Bullet points (Metrics, Verbs, Keywords).
      FORMAT: Clean Markdown. Headers: # Name, ## Section, ### Title.
      ${immutableProfile}`,
    },
  });
};

export const quickFixResume = async (text: string): Promise<string> => {
  const model = "gemini-3-flash-preview";
  const systemInstruction = `Editor: Fix grammar, spelling, punctuation. Ensure consistent spacing and bullet alignment. Return raw text.`;
  try {
    const response = await ai.models.generateContent({
      model,
      config: { systemInstruction },
      contents: [{ role: "user", parts: [{ text }] }],
    });
    return response.text?.replace(/^```markdown\n/, '').replace(/^```\n/, '').replace(/\n```$/, '') || text;
  } catch (error) {
    return text;
  }
};
