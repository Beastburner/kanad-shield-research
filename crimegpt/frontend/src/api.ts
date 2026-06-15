import axios from 'axios';

const BASE_URL = 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---- Role-based access (P4) ------------------------------------------------
// The signed-in officer's role/name are kept in localStorage and attached to
// every request so the backend can enforce permissions and attribute the audit
// log + case diary.
export type Role = 'IO' | 'SHO' | 'LEGAL_ADVISOR';

export const ROLE_LABELS: Record<Role, string> = {
  IO: 'Investigating Officer',
  SHO: 'Station House Officer',
  LEGAL_ADVISOR: 'Legal Advisor',
};

export const getRole = (): Role => (localStorage.getItem('actor_role') as Role) || 'IO';
export const getActorName = (): string => localStorage.getItem('actor_name') || 'Officer';
export const setActor = (role: Role, name: string) => {
  localStorage.setItem('actor_role', role);
  localStorage.setItem('actor_name', name);
};

apiClient.interceptors.request.use((config) => {
  config.headers['X-Actor-Role'] = getRole();
  config.headers['X-Actor-Name'] = getActorName();
  return config;
});

export interface Case {
  id: string;
  case_number: string;
  status: 'new' | 'analyzed' | 'review_required' | 'documented';
  fir_narrative: string;
  created_at: string;
  updated_at: string;
}

export interface FactsBlob {
  complainant: string;
  accused: string[];
  victims: string[];
  items: string[];
  events: string[];
  location: string;
  dates: string[];
}

export interface FactsResponse {
  case_id: string;
  source: 'extraction_agent' | 'officer_edit';
  updated_at: string;
  facts: FactsBlob;
}

export interface LegalSection {
  code: 'BNS' | 'BNSS' | 'BSA';
  section_no: string;
  heading: string;
  old_code_ref: string;
  confidence: number;
  rationale: string;
  statute_chunk_id?: string;
  validated: boolean;
}

export interface Judgment {
  indiankanoon_doc_id: string;
  title: string;
  relevance: number;
  tags: string[];
}

export interface AnalysisResponse {
  case_id: string;
  status: 'analyzed' | 'review_required';
  confidence: number;
  review_required: boolean;
  facts: FactsBlob;
  sections: LegalSection[];
  judgments: Judgment[];
  validation_concerns: string[];
  disclaimer: string;
}

export interface DocumentResponse {
  id: string;
  case_id: string;
  type: string;
  file_path: string;
  sha256: string;
  s63_cert_path: string;
  generated_at: string;
  version: number;
  superseded: boolean;
  lang: string;
  disclaimer: string;
}

export interface DiaryEvent {
  event_type: string;
  description: string;
  occurred_at: string;
  actor: string;
  source: 'system' | 'officer';
}

export interface Evidence {
  id: string;
  case_id: string;
  kind: string;
  label: string | null;
  file_path: string;
  sha256: string;
  tags: string[];
  face_count: number | null;
  uploaded_by: string;
  uploaded_at: string;
}

export interface FaceMatch {
  evidence_id: string;
  label: string | null;
  score: number;
  faces: number;
}

export interface FaceMatchResult {
  probe_faces: number;
  matches: FaceMatch[];
  note: string;
}

export interface MockCCTNSResponse {
  cctns_fir_id: string;
  district: string;
  police_station: string;
  complainant: string;
  fir_narrative: string;
  registered_at: string;
  source: string;
}

export interface InterpolMatch {
  interpol_ref: string;
  name: string;
  wanted_for: string;
  country: string;
  notice: string;
}

export interface MockBharatPolResponse {
  query: string;
  matches: InterpolMatch[];
  source: string;
}

export interface TranslateResponse {
  target: string;
  text: string;
}

export interface OCRResponse {
  text: string;
  char_count: number;
  lang: string;
  source: string; // image_ocr | pdf_text | pdf_ocr
}

export const api = {
  // Cases
  createCase: async (firNarrative: string, caseNumber?: string): Promise<Case> => {
    const response = await apiClient.post<Case>('/cases', {
      fir_narrative: firNarrative,
      case_number: caseNumber || undefined,
    });
    return response.data;
  },

  listCases: async (query?: string): Promise<Case[]> => {
    const response = await apiClient.get<Case[]>('/cases', {
      params: query ? { q: query } : {},
    });
    return response.data;
  },

  getCase: async (id: string): Promise<Case> => {
    const response = await apiClient.get<Case>(`/cases/${id}`);
    return response.data;
  },

  updateCase: async (id: string, updates: Partial<Case>): Promise<Case> => {
    const response = await apiClient.patch<Case>(`/cases/${id}`, updates);
    return response.data;
  },

  // Facts
  getFacts: async (id: string): Promise<FactsResponse> => {
    const response = await apiClient.get<FactsResponse>(`/cases/${id}/facts`);
    return response.data;
  },

  updateFacts: async (id: string, facts: FactsBlob): Promise<FactsResponse> => {
    const response = await apiClient.patch<FactsResponse>(`/cases/${id}/facts`, { facts });
    return response.data;
  },

  // Analyze (runs the LLM pipeline — use on user action only)
  analyzeCase: async (id: string): Promise<AnalysisResponse> => {
    const response = await apiClient.post<AnalysisResponse>(`/cases/${id}/analyze`);
    return response.data;
  },

  // Read-only stored analysis (no pipeline re-run — use on load)
  getAnalysis: async (id: string): Promise<AnalysisResponse> => {
    const response = await apiClient.get<AnalysisResponse>(`/cases/${id}/analysis`);
    return response.data;
  },

  // Documents (lang: en | hi | gu — generates the .docx in that language)
  generateDocument: async (caseId: string, type: string, lang: string = 'en'): Promise<DocumentResponse> => {
    const response = await apiClient.post<DocumentResponse>(`/cases/${caseId}/documents`, { type, lang });
    return response.data;
  },

  listDocuments: async (caseId: string): Promise<DocumentResponse[]> => {
    const response = await apiClient.get<DocumentResponse[]>(`/cases/${caseId}/documents`);
    return response.data;
  },

  getDocumentDownloadUrl: (docId: string): string => {
    return `${BASE_URL}/documents/${docId}/file`;
  },

  getCertificateDownloadUrl: (docId: string): string => {
    return `${BASE_URL}/documents/${docId}/certificate`;
  },

  // Fetch a document/certificate as a Blob for in-browser preview (docx-preview).
  fetchDocumentBlob: async (docId: string, kind: 'file' | 'certificate'): Promise<Blob> => {
    const response = await apiClient.get(`/documents/${docId}/${kind}`, { responseType: 'blob' });
    return response.data as Blob;
  },

  // Diary
  getDiary: async (caseId: string): Promise<DiaryEvent[]> => {
    const response = await apiClient.get<DiaryEvent[]>(`/cases/${caseId}/diary`);
    return response.data;
  },

  addDiaryEntry: async (caseId: string, description: string, eventType: string = 'officer_note'): Promise<DiaryEvent> => {
    const response = await apiClient.post<DiaryEvent>(`/cases/${caseId}/diary`, {
      description,
      event_type: eventType,
    });
    return response.data;
  },

  // Evidence (P5) + face match (P7)
  uploadEvidence: async (caseId: string, file: File, label: string, tags: string): Promise<Evidence> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('label', label);
    formData.append('tags', tags);
    const response = await apiClient.post<Evidence>(`/cases/${caseId}/evidence`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  listEvidence: async (caseId: string): Promise<Evidence[]> => {
    const response = await apiClient.get<Evidence[]>(`/cases/${caseId}/evidence`);
    return response.data;
  },

  getEvidenceUrl: (evidenceId: string): string => `${BASE_URL}/evidence/${evidenceId}/file`,

  matchFace: async (caseId: string, file: File): Promise<FaceMatchResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<FaceMatchResult>(`/cases/${caseId}/face/match`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Mocks
  importFromCCTNS: async (district?: string, complainant?: string): Promise<MockCCTNSResponse> => {
    const response = await apiClient.post<MockCCTNSResponse>('/mock/cctns/fir', {
      district: district || undefined,
      complainant: complainant || undefined,
    });
    return response.data;
  },

  lookupBharatPol: async (name: string): Promise<MockBharatPolResponse> => {
    const response = await apiClient.get<MockBharatPolResponse>('/mock/bharatpol/lookup', {
      params: { name },
    });
    return response.data;
  },

  // Translation
  translateText: async (text: string, target: 'en' | 'hi' | 'gu', source: string = 'auto'): Promise<TranslateResponse> => {
    const response = await apiClient.post<TranslateResponse>('/translate', {
      text,
      target,
      source,
    });
    return response.data;
  },

  // OCR
  ocrScannedFIR: async (file: File, lang: string = 'eng'): Promise<OCRResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<OCRResponse>('/ocr', formData, {
      params: { lang },
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Health
  checkHealth: async (): Promise<{ status: string }> => {
    const response = await apiClient.get<{ status: string }>('/health');
    return response.data;
  },
};
