
import { GoogleGenAI, Type, Schema, Chat } from "@google/genai";
import { AnalysisResult } from "../types";

const apiKey = process.env.API_KEY;
// Initialize conditionally to prevent immediate crash if key is missing, check at runtime
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const analysisSchema: Schema = {
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
          description: "List of inferred core values (e.g. 'Customer Obsession', 'Move Fast') based on company name." 
        },
        alignmentScore: { type: Type.NUMBER, description: "0-100 score based on cultural fit" },
        analysis: { type: Type.STRING, description: "Brief explanation of how the resume aligns with these specific values." }
      },
      required: ["companyName", "inferredValues", "alignmentScore", "analysis"]
    },
    breakdown: {
      type: Type.ARRAY,
      description: "Must include these exact 4 categories: 'Skills Match', 'Experience Relevance', 'Keywords Match', 'Role Alignment'",
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
          rating: { type: Type.INTEGER, description: "Proficiency 1-5 based on context" },
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
          title: { type: Type.STRING, description: "Short actionable title e.g. 'Quantify Sales Impact'" },
          recommendation: { type: Type.STRING, description: "Detailed instruction. IF proposing a rewrite, strictly use format: 'Explanation... Before: [old] After: [new]'" },
          impact: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
          scoreBoost: { type: Type.NUMBER, description: "Estimated score increase (e.g., 5, 10) if this specific issue is fixed." },
          isFixable: { type: Type.BOOLEAN },
        },
      },
    },
    rewrittenResume: {
      type: Type.STRING,
      description: "The full rewritten resume in Markdown, incorporating all fixes to reach 95%+ score.",
    },
    coverLetter: {
      type: Type.STRING,
      description: "Tailored cover letter in Markdown.",
    },
  },
  required: ["overallScore", "projectedScore", "personalInfo", "breakdown", "skills", "improvements", "rewrittenResume", "coverLetter", "cultureFit"],
};

export const analyzeResume = async (resumeText: string, jdText: string, companyName: string): Promise<AnalysisResult> => {
  if (!apiKey || !ai) {
    throw new Error("Configuration Error: Google API Key is missing. Please check your environment variables.");
  }

  const model = "gemini-2.5-flash";
  
  const systemInstruction = `
    You are an expert ATS Resume Optimizer and Corporate Culture Analyst. Your goal is to help the candidate achieve a **95% or higher** match score.

    PROCESS:
    1. **Company Culture Analysis**: 
       - Use the provided 'Company Name' ('${companyName}').
       - INFER their famous leadership principles or core values (e.g., Amazon has 'Customer Obsession', 'Dive Deep'; Google has 'Googleness'; Startups value 'Agility').
       - If the company is unknown, infer values from the Job Description tone.
       - Evaluate if the resume demonstrates these specific behavioral traits.

    2. **Analyze**: Compare the Resume against the Job Description (JD).

    3. **Scoring Criteria**: You MUST calculate the 'overallScore' based on the following weighted pillars:
       - **Technical / AI & ML Keywords**: Presence of specific hard skills (e.g., LLMs, GenAI, personalization, model eval, Python, PyTorch).
       - **Domain / Product Fit**: Alignment with specific domain needs (e.g., content discovery, audio, search, personalization, FinTech).
       - **Experience & Seniority**: Years of experience, specific leadership roles (e.g., Principal PM, Tech Lead), and roadmap ownership.
       - **Measurable Impact / Metrics**: Presence of quantified results (e.g., "Reduced churn by 15%", "Improved conversion by 20%", "$5M revenue").
       - **Cross-functional / Communication**: Evidence of working with Engineering, Data Science, UX, and Stakeholders (e.g., PRDs, specs).
       - **Education / Certifications / Formatting**: Standard headers, clear layout, relevant degrees/certs.

    4. **Target 95%**: The 'projectedScore' MUST be at least 95. The 'improvements' list must be extensive enough to bridge the gap.

    5. **Breakdown**: You MUST provide category scores for: "Skills Match", "Experience Relevance", "Keywords Match", "Role Alignment".

    6. **Fixes**: 
       - Provide highly specific, actionable 'improvements'.
       - **Categorize by Impact**: Assign 'High', 'Medium', or 'Low'.
       - **Fixability**: Indicate if the issue is easily fixable (isFixable: true).
       - Assign a 'scoreBoost' (points) to each improvement.
       - For the 'recommendation' field, IF suggesting a text rewrite, YOU MUST strictly follow this format:
         "Explanation text here...
         Before: [old text]
         After: [new text]"
         Do not use bolding for the words 'Before:' and 'After:', just plain text with a colon.
         
       - SPECIFIC CATEGORIES REQUIRED:
         - **Experience Relevance**: Find weak bullet points. Suggest rephrasing adding **quantifiable metrics** (%, $, count) and **strong action verbs**.
         - **Critical Keywords**: Suggest adding keywords found in the JD.
         - **Missing Keywords**: Suggest integration strategies.
         - **Formatting**: Suggest standardizing headers.
         
    7. **Rewrite**: The 'rewrittenResume' must be a complete overhaul that incorporates ALL fixes to theoretically achieve that 95% score.
    
    IMPORTANT: In the 'rewrittenResume', TRY to respect the candidate's original structure where possible, but prioritize standard ATS formatting (Clean headers, no columns) if the original is messy.

    OUTPUT: Return ONLY a valid JSON object matching the schema.
  `;

  const prompt = `
    TARGET COMPANY: ${companyName}
    
    JOB DESCRIPTION:
    ${jdText}

    RESUME:
    ${resumeText}

    Perform a deep ATS analysis and Company Culture fit check. List specific, actionable improvements categorized by impact.
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

    if (!response.text) {
      throw new Error("The AI service returned an empty response. Please try again.");
    }
    
    return JSON.parse(response.text) as AnalysisResult;
  } catch (error: any) {
    console.error("FAANG Resume IQ Analysis Error:", error);
    
    if (error.message?.includes("429") || error.status === 429) {
      throw new Error("High traffic volume. The AI service is currently busy. Please wait a minute and try again.");
    }
    if (error.message?.includes("SAFETY")) {
      throw new Error("The analysis was blocked by safety filters. Please ensure the resume content is professional and appropriate.");
    }
    if (error.message?.includes("API_KEY") || error.message?.includes("401")) {
      throw new Error("Authentication Error. Invalid or missing API Key.");
    }
    if (error.message?.includes("JSON")) {
      throw new Error("Failed to parse the AI response. Please try the scan again.");
    }

    throw new Error("An unexpected error occurred during analysis. Please check your connection and try again.");
  }
};

export const createChatSession = (resumeText: string, jdText: string, analysisResult: AnalysisResult | null): Chat => {
  if (!apiKey || !ai) {
    throw new Error("Configuration Error: API Key is missing.");
  }

  // Create a strict immutable profile string
  const personalInfo = analysisResult?.personalInfo;
  const immutableProfile = personalInfo ? `
    FULL NAME: ${personalInfo.name}
    EMAIL: ${personalInfo.email}
    PHONE: ${personalInfo.phone}
    LINKEDIN: ${personalInfo.linkedin || 'N/A'}
    LOCATION: ${personalInfo.location || 'N/A'}
  ` : "PRESERVE ORIGINAL CONTACT INFO";

  const context = `
    TARGET COMPANY: ${analysisResult?.cultureFit?.companyName || "Unknown"}
    INFERRED VALUES: ${analysisResult?.cultureFit?.inferredValues?.join(', ') || "N/A"}
    
    IMMUTABLE PERSONAL DETAILS (DO NOT CHANGE):
    ${immutableProfile}

    JOB DESCRIPTION CONTEXT: ${jdText ? jdText.substring(0, 2000) + "..." : "N/A"}
    CURRENT RESUME CONTEXT: ${resumeText ? resumeText.substring(0, 2000) + "..." : "N/A"}
  `;

  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `You are the FAANG Resume IQ Copilot. Your goal is to rewrite the resume to reach a 95%+ ATS score, BUT you must strictly preserve the candidate's identity, career history structure, and original formatting.

      STRICT PRESERVATION RULES:
      1. **IDENTITY LOCK**: NEVER change the candidate's Name, Email, Phone number, LinkedIn URL, or Location. Use the exact details provided in the IMMUTABLE PERSONAL DETAILS section.
      2. **HISTORY LOCK**: NEVER change Company Names, Job Titles, or Dates of Employment. You can only improve the *bullet points* under these roles.
      3. **FORMAT & STRUCTURE LOCK (CRITICAL)**: 
         - **Do NOT reorder sections.** If "Experience" comes before "Skills", keep it that way.
         - **Do NOT rename headers.** If the user uses "Work History", do NOT change it to "Experience".
         - **Do NOT change the layout style.** Keep indentation and bullet styles consistent with the original input.
         - Your job is to improve the *content* (keywords, metrics, verbs) INSIDE the existing scaffold, not to redesign the document.

      OPTIMIZATION RULES (WHAT TO CHANGE):
      1. **Summary**: Rewrite the professional summary to align with the JD keywords and Company Culture.
      2. **Bullet Points**: Rewrite experience bullet points to include:
         - **Hard Skills** from the JD (e.g. Python, GenAI).
         - **Metrics**: Add numbers (%, $, count) to quantify impact.
         - **Action Verbs**: Use strong leadership verbs.
      3. **Skills Section**: Add missing critical keywords to the existing Skills section list.

      OUTPUT PROTOCOL:
      1. **Single Best Option**: Provide the single best version.
      2. **Direct Updates**: Wrap the FULL rewritten resume in <updated_resume> tags.
         <updated_resume>
         [Full Markdown Resume Content Here]
         </updated_resume>
      3. **Re-Scoring**: Calculate and output:
         "**New Estimated ATS Score: XX/100**"
         [[SCORE:XX]]

      ${context}`,
    },
  });
};
