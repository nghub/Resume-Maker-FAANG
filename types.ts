
export interface CategoryScore {
  category: string;
  score: number;
}

export interface Improvement {
  id: string;
  section: string;
  title: string;
  recommendation: string;
  impact: 'High' | 'Medium' | 'Low';
  isFixable: boolean;
  scoreBoost?: number; // Estimated point increase
}

export interface Skill {
  name: string;
  rating: number; // 1-5
  category: 'Technical' | 'Soft' | 'Tools' | 'Languages';
}

export interface PersonalInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  linkedin?: string;
  website?: string;
  location?: string;
}

export interface CultureFit {
  companyName: string;
  inferredValues: string[]; // e.g. ["Customer Obsession", "Bias for Action"]
  alignmentScore: number; // 0-100
  analysis: string;
}

export interface VisualSettings {
  fontFamily: 'inter' | 'roboto' | 'merriweather' | 'jetbrains';
  primaryColor: string;
  layout: 'classic' | 'modern' | 'minimal';
  fontSize: 'sm' | 'base' | 'lg';
  lineHeight: 'tight' | 'normal' | 'relaxed';
}

export interface SavedResume {
  id: string;
  name: string;
  content: string;
  updatedAt: string;
}

export interface AnalysisResult {
  overallScore: number;
  projectedScore: number; // Score after applying fixes
  summary: string;
  cultureFit: CultureFit; // New field
  breakdown: CategoryScore[];
  personalInfo: PersonalInfo;
  skills: Skill[];
  certifications: string[];
  missingKeywords: string[];
  criticalKeywords: string[];
  strengths: string[];
  weaknesses: string[];
  improvements: Improvement[];
  rewrittenResume: string;
  coverLetter: string;
}

export interface HistoryItem {
  id: string;
  date: string;
  score: number;
  role: string; // Derived from Personal Info title or JD
  result: AnalysisResult;
  jdPreview: string;
  resumePreview: string;
  fullJd: string;
  fullResume: string;
}

export interface User {
  name: string;
  email: string;
  picture: string;
  sub: string; // Google ID
  exp?: number; // Expiration timestamp
}

export enum LoadingState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
}
