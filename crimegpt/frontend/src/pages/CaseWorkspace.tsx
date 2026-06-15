import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { renderAsync } from 'docx-preview';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Tab,
  Tabs,
  TextField,
  Typography,
  Alert,
  AlertTitle,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Paper,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import {
  ArrowLeft,
  Briefcase,
  Scale,
  FileDown,
  BookOpen,
  Calendar,
  Globe,
  Plus,
  Trash2,
  CheckCircle,
  FileCheck,
  Languages,
  ShieldAlert,
  Fingerprint,
  Eye,
  X,
  Image as ImageIcon,
  ScanFace,
  Upload,
  Lock
} from 'lucide-react';
import { api, type Case, type FactsBlob, type LegalSection, type Judgment, type DocumentResponse, type DiaryEvent, type Evidence, type FaceMatchResult } from '../api';
import { useActor } from '../useActor';

// Simple Translate Widget Component
function TranslatingText({ text, activeLang }: { text: string; activeLang: string }) {
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    // Reset translation if base text changes
    setTranslatedText(null);
  }, [text]);

  const handleTranslate = async (target: 'hi' | 'gu') => {
    try {
      setTranslating(true);
      const res = await api.translateText(text, target);
      setTranslatedText(res.text);
    } catch (err) {
      console.error('Translation failed', err);
    } finally {
      setTranslating(false);
    }
  };

  if (activeLang === 'en' || (!translatedText && activeLang === 'en')) {
    return (
      <Box>
        <Typography variant="body2">{text}</Typography>
        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
          <Button 
            size="small" 
            variant="text" 
            startIcon={translating ? <CircularProgress size={12} /> : <Languages size={12} />} 
            onClick={() => handleTranslate('hi')}
            sx={{ fontSize: '0.75rem', p: 0, minWidth: 0, color: 'text.secondary' }}
          >
            Translate to Hindi
          </Button>
          <Button 
            size="small" 
            variant="text" 
            startIcon={translating ? <CircularProgress size={12} /> : <Languages size={12} />} 
            onClick={() => handleTranslate('gu')}
            sx={{ fontSize: '0.75rem', p: 0, minWidth: 0, color: 'text.secondary' }}
          >
            Translate to Gujarati
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {translatedText ? (
        <Box sx={{ bgcolor: 'rgba(6, 182, 212, 0.05)', p: 1.5, borderRadius: 1.5, borderLeft: '3px solid #06b6d4' }}>
          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>{translatedText}</Typography>
          <Button 
            size="small" 
            variant="text" 
            onClick={() => setTranslatedText(null)}
            sx={{ fontSize: '0.72rem', mt: 0.5, p: 0, minWidth: 0, color: 'text.secondary' }}
          >
            Show Original English
          </Button>
        </Box>
      ) : (
        <Box>
          <Typography variant="body2">{text}</Typography>
          <Button 
            size="small" 
            variant="text" 
            startIcon={translating ? <CircularProgress size={12} /> : <Languages size={12} />} 
            onClick={() => handleTranslate(activeLang as 'hi' | 'gu')}
            sx={{ fontSize: '0.75rem', mt: 0.5, p: 0, minWidth: 0 }}
          >
            Translate rationale to {activeLang === 'gu' ? 'Gujarati' : 'Hindi'}
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default function CaseWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { canWrite } = useActor();

  // Tab State
  const [tabValue, setTabValue] = useState(0);

  // Data States
  const [caseObj, setCaseObj] = useState<Case | null>(null);
  const [facts, setFacts] = useState<FactsBlob | null>(null);
  const [sections, setSections] = useState<LegalSection[]>([]);
  const [judgments, setJudgments] = useState<Judgment[]>([]);
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [diary, setDiary] = useState<DiaryEvent[]>([]);
  const [analysisConfidence, setAnalysisConfidence] = useState(0);
  const [reviewRequired, setReviewRequired] = useState(false);
  const [validationConcerns, setValidationConcerns] = useState<string[]>([]);
  const [disclaimer, setDisclaimer] = useState('AI-assisted draft — officer review required.');

  // Loading States
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [savingFacts, setSavingFacts] = useState(false);
  const [generatingDoc, setGeneratingDoc] = useState<string | null>(null);
  
  // BharatPol Search
  const [bpQuery, setBpQuery] = useState('');
  const [bpResult, setBpResult] = useState<any>(null);
  const [bpLoading, setBpLoading] = useState(false);

  // Quick Translation Tool
  const [transInput, setTransInput] = useState('');
  const [transOutput, setTransOutput] = useState<string | null>(null);
  const [transLoading, setTransLoading] = useState(false);

  // Manual diary entry (P2)
  const [diaryNote, setDiaryNote] = useState('');
  const [addingDiary, setAddingDiary] = useState(false);

  // Evidence (P5) + face match (P7)
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [evLabel, setEvLabel] = useState('');
  const [evTags, setEvTags] = useState('');
  const [evUploading, setEvUploading] = useState(false);
  const evFileRef = useRef<HTMLInputElement>(null);
  const probeFileRef = useRef<HTMLInputElement>(null);
  const [faceResult, setFaceResult] = useState<FaceMatchResult | null>(null);
  const [faceMatching, setFaceMatching] = useState(false);

  const handleQuickTranslate = async (target: 'hi' | 'gu') => {
    if (!transInput.trim()) return;
    try {
      setTransLoading(true);
      setTransOutput(null);
      const res = await api.translateText(transInput, target);
      setTransOutput(res.text);
    } catch (err) {
      console.error('Translation failed', err);
      setTransOutput('Translation failed.');
    } finally {
      setTransLoading(false);
    }
  };

  // In-browser document viewer (renders the generated .docx without downloading)
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerTitle, setViewerTitle] = useState('');
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerBlob, setViewerBlob] = useState<Blob | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  const openViewer = async (docId: string, kind: 'file' | 'certificate', title: string) => {
    setViewerOpen(true);
    setViewerTitle(title);
    setViewerLoading(true);
    setViewerBlob(null);
    try {
      const blob = await api.fetchDocumentBlob(docId, kind);
      setViewerBlob(blob);
    } catch (err) {
      console.error('Failed to load document for preview', err);
      setError('Could not load document preview.');
      setViewerOpen(false);
    } finally {
      setViewerLoading(false);
    }
  };

  // Render the .docx into the dialog once both the blob and the container exist.
  useEffect(() => {
    if (viewerOpen && viewerBlob && viewerRef.current) {
      viewerRef.current.innerHTML = '';
      renderAsync(viewerBlob, viewerRef.current, undefined, {
        className: 'docx-view',
        inWrapper: true,
      }).catch((e) => console.error('docx render failed', e));
    }
  }, [viewerOpen, viewerBlob]);

  // Errors / Success Messages
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchWorkspaceData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      
      // Fetch Case Details
      const caseData = await api.getCase(id);
      setCaseObj(caseData);

      // Fetch Case Diary (Timeline)
      try {
        const diaryData = await api.getDiary(id);
        setDiary(diaryData);
      } catch (err) {
        console.error('Error fetching diary', err);
      }

      // Fetch Documents
      try {
        const docsData = await api.listDocuments(id);
        setDocuments(docsData);
      } catch (err) {
        console.error('Error fetching documents', err);
      }

      // Fetch Evidence (P5)
      try {
        const evData = await api.listEvidence(id);
        setEvidence(evData);
      } catch (err) {
        console.error('Error fetching evidence', err);
      }

      // Fetch Facts (might return 404 if not analyzed yet)
      try {
        const factsData = await api.getFacts(id);
        setFacts(factsData.facts);
      } catch (err: any) {
        if (err.response?.status === 404) {
          // Facts don't exist yet, we must run /analyze
          setFacts(null);
        } else {
          console.error('Error fetching facts', err);
        }
      }

      // If already analyzed, load the STORED analysis (read-only — does NOT re-run the
      // LLM pipeline, so no extra cost and no duplicate "analyzed" diary entries).
      if (caseData.status === 'analyzed' || caseData.status === 'review_required' || caseData.status === 'documented') {
        try {
          const analysisData = await api.getAnalysis(id);
          setSections(analysisData.sections || []);
          setJudgments(analysisData.judgments || []);
          setAnalysisConfidence(analysisData.confidence || 0);
          setReviewRequired(analysisData.review_required || false);
          setValidationConcerns(analysisData.validation_concerns || []);
          if (analysisData.disclaimer) {
            setDisclaimer(analysisData.disclaimer);
          }
        } catch (err) {
          console.error('Error fetching stored analysis', err);
        }
      }

    } catch (err: any) {
      console.error(err);
      setError('Failed to load workspace data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, [id]);

  const handleRunAnalysis = async () => {
    if (!id) return;
    try {
      setAnalyzing(true);
      setError(null);
      setSuccess(null);
      const res = await api.analyzeCase(id);
      
      setCaseObj(prev => prev ? { ...prev, status: res.status } : null);
      setFacts(res.facts);
      setSections(res.sections);
      setJudgments(res.judgments);
      setAnalysisConfidence(res.confidence);
      setReviewRequired(res.review_required);
      setValidationConcerns(res.validation_concerns);
      if (res.disclaimer) {
        setDisclaimer(res.disclaimer);
      }

      // Update case diary
      const diaryData = await api.getDiary(id);
      setDiary(diaryData);

      setSuccess('AI Legal analysis complete!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Analysis pipeline failed. Check GROQ API credentials.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveFacts = async () => {
    if (!id || !facts) return;
    try {
      setSavingFacts(true);
      setError(null);
      setSuccess(null);
      await api.updateFacts(id, facts);
      setSuccess('Facts updated and logged to audit trail.');
      
      // Refresh timeline
      const diaryData = await api.getDiary(id);
      setDiary(diaryData);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError('Failed to save fact corrections.');
    } finally {
      setSavingFacts(false);
    }
  };

  const handleGenerateDoc = async (type: string) => {
    if (!id) return;
    try {
      setGeneratingDoc(type);
      setError(null);
      setSuccess(null);
      await api.generateDocument(id, type, i18n.language);
      const langName = i18n.language === 'hi' ? 'Hindi' : i18n.language === 'gu' ? 'Gujarati' : 'English';
      setSuccess(`Document '${type}' generated in ${langName}!`);
      
      // Update Case Object Status to 'documented'
      const updatedCase = await api.getCase(id);
      setCaseObj(updatedCase);
      
      // Refresh documents and timeline
      const docsData = await api.listDocuments(id);
      setDocuments(docsData);
      const diaryData = await api.getDiary(id);
      setDiary(diaryData);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Precondition check failed. Make sure to run legal analysis first.');
    } finally {
      setGeneratingDoc(null);
    }
  };

  const handleBharatPolLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bpQuery) return;
    try {
      setBpLoading(true);
      setBpResult(null);
      const res = await api.lookupBharatPol(bpQuery);
      setBpResult(res);
    } catch (err) {
      console.error(err);
      setBpResult({ matches: [], source: 'MOCK_BHARATPOL', query: bpQuery });
    } finally {
      setBpLoading(false);
    }
  };

  const handleAddDiary = async () => {
    if (!id || !diaryNote.trim()) return;
    try {
      setAddingDiary(true);
      setError(null);
      await api.addDiaryEntry(id, diaryNote.trim());
      setDiaryNote('');
      const diaryData = await api.getDiary(id);
      setDiary(diaryData);
      setSuccess('Diary entry logged.');
      setTimeout(() => setSuccess(null), 2500);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to add diary entry.');
    } finally {
      setAddingDiary(false);
    }
  };

  const handleUploadEvidence = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    try {
      setEvUploading(true);
      setError(null);
      await api.uploadEvidence(id, file, evLabel, evTags);
      setEvLabel('');
      setEvTags('');
      const evData = await api.listEvidence(id);
      setEvidence(evData);
      const diaryData = await api.getDiary(id);
      setDiary(diaryData);
      setSuccess('Evidence uploaded and hashed.');
      setTimeout(() => setSuccess(null), 2500);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Evidence upload failed.');
    } finally {
      setEvUploading(false);
      if (evFileRef.current) evFileRef.current.value = '';
    }
  };

  const handleFaceMatch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    try {
      setFaceMatching(true);
      setFaceResult(null);
      setError(null);
      const res = await api.matchFace(id, file);
      setFaceResult(res);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Face match failed (is OpenCV installed on the backend?).');
    } finally {
      setFaceMatching(false);
      if (probeFileRef.current) probeFileRef.current.value = '';
    }
  };

  // Editable lists management functions
  const handleFactStringChange = (field: keyof FactsBlob, value: string) => {
    if (!facts) return;
    setFacts({ ...facts, [field]: value });
  };

  const handleFactArrayChange = (field: keyof FactsBlob, index: number, value: string) => {
    if (!facts) return;
    const arr = [...(facts[field] as string[])];
    arr[index] = value;
    setFacts({ ...facts, [field]: arr });
  };

  const addFactArrayItem = (field: keyof FactsBlob) => {
    if (!facts) return;
    const arr = [...(facts[field] as string[]), ''];
    setFacts({ ...facts, [field]: arr });
  };

  const removeFactArrayItem = (field: keyof FactsBlob, index: number) => {
    if (!facts) return;
    const arr = [...(facts[field] as string[])];
    arr.splice(index, 1);
    setFacts({ ...facts, [field]: arr });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={50} color="primary" />
        <Typography color="text.secondary">Fetching case details...</Typography>
      </Box>
    );
  }

  if (error && !caseObj) {
    return (
      <Box sx={{ py: 4, px: 4, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        <Button variant="contained" onClick={() => navigate('/')}>{t('backToDashboard')}</Button>
      </Box>
    );
  }

  const documentTypes = [
    { type: 'chargesheet', label: 'Chargesheet', desc: 'Main police report containing facts, sections, and evidence.' },
    { type: 'remand_request', label: 'Remand Request', desc: 'Required to hold the accused in custody for interrogation.' },
    { type: 'seizure_receipt', label: 'Seizure Receipt', desc: 'Receipt issued for properties or cash seized during investigation.' },
    { type: 'court_custody_letter', label: 'Court Custody Letter', desc: 'Formal request to transfer the accused to judicial custody.' },
    { type: 'accused_panchanama', label: 'Accused Panchanama', desc: 'Witness-verified record of items found on the accused.' },
    { type: 'medical_treatment_letter', label: 'Medical Treatment Letter', desc: 'Authorized letter requesting medical checks for accused.' },
    { type: 'face_identification_form', label: 'Face Identification Form', desc: 'Mock face match integrity and verification report.' },
    { type: 'lers_request', label: 'Meta/WhatsApp LERS Request', desc: 'Law-enforcement data request to Meta (FB/IG/WhatsApp) under BNSS s.94.' }
  ];

  return (
    <Box sx={{ py: 4, px: { xs: 2, md: 4 } }}>
      {/* Header section */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/')} sx={{ color: 'text.secondary', bgcolor: 'rgba(255,255,255,0.03)' }}>
            <ArrowLeft size={20} />
          </IconButton>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
              Case Workspace: {caseObj?.case_number || 'Unnamed Case'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip label={`ID: ${caseObj?.id.substring(0, 8)}...`} size="small" variant="outlined" sx={{ color: 'text.secondary' }} />
              <Chip 
                label={caseObj?.status.toUpperCase()} 
                size="small" 
                color={
                  caseObj?.status === 'new' ? 'primary' : 
                  caseObj?.status === 'review_required' ? 'warning' : 'success'
                }
              />
              <Typography variant="caption" color="text.secondary">
                Registered: {new Date(caseObj?.created_at || '').toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {analysisConfidence > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', mr: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {t('confidence')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={analysisConfidence * 100} 
                  sx={{ width: 100, height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { bgcolor: analysisConfidence > 0.6 ? '#10b981' : '#f59e0b' } }} 
                />
                <Typography variant="body2" sx={{ fontWeight: 700, color: analysisConfidence > 0.6 ? '#10b981' : '#f59e0b' }}>
                  {Math.round(analysisConfidence * 100)}%
                </Typography>
              </Box>
            </Box>
          )}

          <Button
            id="btn-reanalyze"
            variant="contained"
            color="primary"
            startIcon={analyzing ? <CircularProgress size={18} color="inherit" /> : <Scale size={18} />}
            onClick={handleRunAnalysis}
            disabled={analyzing}
          >
            {caseObj?.status === 'new' ? 'Run AI Analysis' : t('reanalyze')}
          </Button>
        </Box>
      </Box>

      {/* Read-only role banner (P4) */}
      {!canWrite && (
        <Alert severity="info" icon={<Lock size={20} />} sx={{ mb: 3, borderRadius: 2 }}>
          You are signed in as <strong>Legal Advisor</strong> (read & legal-analysis only). Fact edits, document filing and evidence upload are disabled — switch role in the header to act as IO/SHO.
        </Alert>
      )}

      {/* Global Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          {success}
        </Alert>
      )}

      {/* Review Banner if required */}
      {reviewRequired && (
        <Alert severity="warning" icon={<ShieldAlert size={28} />} sx={{ mb: 4, borderRadius: 3, border: '1px solid rgba(245, 158, 11, 0.3)', bgcolor: 'rgba(245, 158, 11, 0.05)' }}>
          <AlertTitle sx={{ fontWeight: 700, fontSize: '1.05rem' }}>{t('officerReview')} Required</AlertTitle>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 500 }}>
              The legal classifier flagged concerns regarding the statutory boundary limits:
            </Typography>
            <List dense sx={{ listStyleType: 'disc', pl: 3, py: 0 }}>
              {validationConcerns.map((c, i) => (
                <ListItem key={i} sx={{ display: 'list-item', p: 0, mb: 0.5 }}>
                  <ListItemText primary={<Typography variant="body2">{c}</Typography>} />
                </ListItem>
              ))}
            </List>
            <Typography variant="caption" sx={{ display: 'block', mt: 2, fontWeight: 700, letterSpacing: '0.5px' }}>
              PROCEED WITH CAUTION: {disclaimer}
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Primary Workspace Sections */}
      {!facts ? (
        /* Gating: Analysis hasn't run yet */
        <Card sx={{ background: '#111827', py: 6, px: 4, textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <CardContent>
            <Box sx={{ mb: 3, color: 'primary.main', display: 'flex', justifyContent: 'center' }}>
              <Scale size={64} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
              Case Fact Extraction & Analysis Required
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
              The FIR narrative must be processed by the LLM classification pipeline to extract structured fact fields (complainant, accused, dates) and match applicable BNS sections before legal documents can be generated.
            </Typography>
            <Button
              id="btn-run-analysis"
              variant="contained"
              size="large"
              color="primary"
              disabled={analyzing}
              onClick={handleRunAnalysis}
              startIcon={analyzing ? <CircularProgress size={20} color="inherit" /> : <Scale size={20} />}
              sx={{ px: 4, py: 1.5 }}
            >
              {analyzing ? t('analyzing') : 'Execute AI Pipeline'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Workspace Tabs Layout */
        <Box>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={tabValue} 
              onChange={(_, val) => setTabValue(val)} 
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="1. Facts Extraction" id="tab-facts" icon={<Briefcase size={16} />} iconPosition="start" />
              <Tab label="2. Legal Classification" id="tab-legal" icon={<Scale size={16} />} iconPosition="start" />
              <Tab label="3. Legal Documents" id="tab-docs" icon={<FileCheck size={16} />} iconPosition="start" />
              <Tab label="4. Case Diary (Timeline)" id="tab-timeline" icon={<Calendar size={16} />} iconPosition="start" />
              <Tab label="5. Evidence & Face Match" id="tab-evidence" icon={<ImageIcon size={16} />} iconPosition="start" />
              <Tab label="6. Mock Integrations & Tools" id="tab-mocks" icon={<Globe size={16} />} iconPosition="start" />
            </Tabs>
          </Box>

          {/* TAB 1: FACTS EXTRACTION */}
          {tabValue === 0 && (
            <Card sx={{ background: '#111827' }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {t('facts')}
                  </Typography>
                  <Button
                    id="btn-save-facts"
                    variant="contained"
                    color="primary"
                    startIcon={savingFacts ? <CircularProgress size={16} color="inherit" /> : <CheckCircle size={16} />}
                    onClick={handleSaveFacts}
                    disabled={savingFacts || !canWrite}
                  >
                    {savingFacts ? 'Saving...' : t('saveFacts')}
                  </Button>
                </Box>
                
                <Alert severity="info" sx={{ mb: 4, borderRadius: 2 }}>
                  Verify the LLM-extracted facts below. Officers can modify names, dates, items, or locations. Save corrections to update court documents.
                </Alert>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Complainant Name</Typography>
                    <TextField
                      fullWidth
                      id="fact-complainant"
                      value={facts.complainant || ''}
                      onChange={(e) => handleFactStringChange('complainant', e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>{t('location')}</Typography>
                    <TextField
                      fullWidth
                      id="fact-location"
                      value={facts.location || ''}
                      onChange={(e) => handleFactStringChange('location', e.target.value)}
                    />
                  </Grid>

                  {/* Accused Dynamic Array */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{t('accused')}</Typography>
                      <Button size="small" startIcon={<Plus size={14} />} onClick={() => addFactArrayItem('accused')}>
                        {t('addAccused')}
                      </Button>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {facts.accused.map((val, idx) => (
                        <Box key={idx} sx={{ display: 'flex', gap: 1 }}>
                          <TextField
                            fullWidth
                            id={`fact-accused-${idx}`}
                            size="small"
                            value={val}
                            onChange={(e) => handleFactArrayChange('accused', idx, e.target.value)}
                          />
                          <IconButton color="error" onClick={() => removeFactArrayItem('accused', idx)}>
                            <Trash2 size={18} />
                          </IconButton>
                        </Box>
                      ))}
                      {facts.accused.length === 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', pl: 1 }}>No accused identified yet.</Typography>
                      )}
                    </Box>
                  </Grid>

                  {/* Victims Dynamic Array */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{t('victims')}</Typography>
                      <Button size="small" startIcon={<Plus size={14} />} onClick={() => addFactArrayItem('victims')}>
                        {t('addVictim')}
                      </Button>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {facts.victims.map((val, idx) => (
                        <Box key={idx} sx={{ display: 'flex', gap: 1 }}>
                          <TextField
                            fullWidth
                            id={`fact-victim-${idx}`}
                            size="small"
                            value={val}
                            onChange={(e) => handleFactArrayChange('victims', idx, e.target.value)}
                          />
                          <IconButton color="error" onClick={() => removeFactArrayItem('victims', idx)}>
                            <Trash2 size={18} />
                          </IconButton>
                        </Box>
                      ))}
                      {facts.victims.length === 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', pl: 1 }}>No victims identified yet.</Typography>
                      )}
                    </Box>
                  </Grid>

                  {/* Stolen Items Dynamic Array */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{t('items')}</Typography>
                      <Button size="small" startIcon={<Plus size={14} />} onClick={() => addFactArrayItem('items')}>
                        {t('addItem')}
                      </Button>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {facts.items.map((val, idx) => (
                        <Box key={idx} sx={{ display: 'flex', gap: 1 }}>
                          <TextField
                            fullWidth
                            id={`fact-item-${idx}`}
                            size="small"
                            value={val}
                            onChange={(e) => handleFactArrayChange('items', idx, e.target.value)}
                          />
                          <IconButton color="error" onClick={() => removeFactArrayItem('items', idx)}>
                            <Trash2 size={18} />
                          </IconButton>
                        </Box>
                      ))}
                      {facts.items.length === 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', pl: 1 }}>No items recorded.</Typography>
                      )}
                    </Box>
                  </Grid>

                  {/* Dates Dynamic Array */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{t('dates')}</Typography>
                      <Button size="small" startIcon={<Plus size={14} />} onClick={() => addFactArrayItem('dates')}>
                        {t('addDate')}
                      </Button>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {facts.dates.map((val, idx) => (
                        <Box key={idx} sx={{ display: 'flex', gap: 1 }}>
                          <TextField
                            fullWidth
                            id={`fact-date-${idx}`}
                            size="small"
                            value={val}
                            onChange={(e) => handleFactArrayChange('dates', idx, e.target.value)}
                          />
                          <IconButton color="error" onClick={() => removeFactArrayItem('dates', idx)}>
                            <Trash2 size={18} />
                          </IconButton>
                        </Box>
                      ))}
                      {facts.dates.length === 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', pl: 1 }}>No dates recorded.</Typography>
                      )}
                    </Box>
                  </Grid>

                  {/* Sequence of Events */}
                  <Grid size={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{t('events')}</Typography>
                      <Button size="small" startIcon={<Plus size={14} />} onClick={() => addFactArrayItem('events')}>
                        {t('addEvent')}
                      </Button>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {facts.events.map((val, idx) => (
                        <Box key={idx} sx={{ display: 'flex', gap: 1 }}>
                          <TextField
                            fullWidth
                            multiline
                            id={`fact-event-${idx}`}
                            size="small"
                            value={val}
                            onChange={(e) => handleFactArrayChange('events', idx, e.target.value)}
                          />
                          <IconButton color="error" onClick={() => removeFactArrayItem('events', idx)}>
                            <Trash2 size={18} />
                          </IconButton>
                        </Box>
                      ))}
                      {facts.events.length === 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', pl: 1 }}>No events recorded.</Typography>
                      )}
                    </Box>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    id="btn-save-facts-footer"
                    variant="contained"
                    color="primary"
                    startIcon={savingFacts ? <CircularProgress size={16} color="inherit" /> : <CheckCircle size={16} />}
                    onClick={handleSaveFacts}
                    disabled={savingFacts || !canWrite}
                  >
                    {savingFacts ? 'Saving Facts...' : t('saveFacts')}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* TAB 2: LEGAL CLASSIFICATION */}
          {tabValue === 1 && (
            <Box>
              {/* Sections list */}
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
                {t('sections')}
              </Typography>

              {sections.length === 0 ? (
                <Alert severity="info" sx={{ mb: 4, borderRadius: 2 }}>
                  No legal sections were suggested. The analysis requires a clearer case narrative.
                </Alert>
              ) : (
                <Grid container spacing={3} sx={{ mb: 5 }}>
                  {sections.map((sec, idx) => (
                    <Grid size={12} key={idx}>
                      <Card sx={{ background: '#111827', borderLeft: '4px solid #06b6d4' }}>
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Chip 
                                label={`${sec.code} ${sec.section_no}`} 
                                color="primary" 
                                sx={{ fontWeight: 800, fontSize: '0.95rem' }} 
                              />
                              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                {sec.heading}
                              </Typography>
                            </Box>
                            
                            <Chip 
                              label={`cf. ${sec.old_code_ref}`} 
                              variant="outlined" 
                              size="small"
                              sx={{ 
                                bgcolor: 'rgba(255,255,255,0.03)', 
                                color: 'text.secondary',
                                border: '1px dashed rgba(255,255,255,0.15)'
                              }} 
                            />
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                              Confidence:
                            </Typography>
                            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={sec.confidence * 100} 
                                sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.05)', '& .MuiLinearProgress-bar': { bgcolor: sec.confidence > 0.7 ? '#10b981' : '#f59e0b' } }} 
                              />
                              <Typography variant="body2" sx={{ fontWeight: 700, color: sec.confidence > 0.7 ? '#10b981' : '#f59e0b' }}>
                                {Math.round(sec.confidence * 100)}%
                              </Typography>
                            </Box>
                          </Box>

                          <Divider sx={{ mb: 2 }} />

                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: 'text.secondary' }}>
                            Pipeline Classification Rationale:
                          </Typography>
                          <TranslatingText text={sec.rationale} activeLang={i18n.language} />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}

              {/* Judgments list */}
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
                {t('judgments')}
              </Typography>

              {judgments.length === 0 ? (
                <Typography color="text.secondary" sx={{ fontStyle: 'italic', pl: 1, mb: 4 }}>No precedent Indian Kanoon judgments retrieved.</Typography>
              ) : (
                <Grid container spacing={3}>
                  {judgments.map((jug, idx) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={idx}>
                      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#111827' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'secondary.light', lineHiegth: 1.3 }}>
                              {jug.title}
                            </Typography>
                            <Chip 
                              label={`Match: ${Math.round(jug.relevance * 100)}%`} 
                              size="small" 
                              sx={{ bgcolor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }} 
                            />
                          </Box>

                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                            {jug.tags.map((tag, tIdx) => (
                              <Chip key={tIdx} label={tag} size="small" variant="outlined" sx={{ color: 'text.secondary' }} />
                            ))}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}

          {/* TAB 3: LEGAL DOCUMENTS */}
          {tabValue === 2 && (
            <Grid container spacing={4}>
              {/* Document Actions */}
              <Grid size={{ xs: 12, md: 5 }}>
                <Card sx={{ background: '#111827' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                      Draft Court Documents
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Automate document preparation. Generated templates prefill all active case facts.
                    </Typography>
                    <Alert severity="info" icon={<Languages size={16} />} sx={{ mb: 3, py: 0.5 }}>
                      Output language: <strong>{i18n.language === 'hi' ? 'हिन्दी (Hindi)' : i18n.language === 'gu' ? 'ગુજરાતી (Gujarati)' : 'English'}</strong> — switch it from the header language selector.
                    </Alert>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {documentTypes.map((doc, idx) => (
                        <Box key={idx} sx={{ p: 1.5, border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2, bgcolor: '#0f172a' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>{doc.label}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
                            {doc.desc}
                          </Typography>
                          <Button
                            id={`btn-gen-${doc.type}`}
                            variant="outlined"
                            size="small"
                            color="primary"
                            startIcon={generatingDoc === doc.type ? <CircularProgress size={12} /> : <Plus size={12} />}
                            disabled={generatingDoc !== null || !canWrite}
                            onClick={() => handleGenerateDoc(doc.type)}
                            fullWidth
                          >
                            {generatingDoc === doc.type ? 'Generating...' : t('generateDoc')}
                          </Button>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Generated Documents List */}
              <Grid size={{ xs: 12, md: 7 }}>
                <Card sx={{ background: '#111827', minHeight: 400 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                      Generated Documents & Evidence Certificates
                    </Typography>

                    {documents.length === 0 ? (
                      <Box sx={{ py: 8, textAlgin: 'center', color: 'text.secondary', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <FileDown size={48} />
                        <Typography sx={{ fontStyle: 'italic' }}>No court documents generated yet.</Typography>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {documents.map((doc, idx) => (
                          <Paper key={idx} sx={{ p: 3, background: '#0f172a', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                              <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 800, textTransform: 'capitalize' }}>
                                    {doc.type.replace(/_/g, ' ')}
                                  </Typography>
                                  <Chip label={`v${doc.version}`} size="small" color="primary" sx={{ height: 20, fontWeight: 700 }} />
                                  {doc.superseded
                                    ? <Chip label="superseded" size="small" sx={{ height: 20, bgcolor: 'rgba(148,163,184,0.15)', color: '#94a3b8' }} />
                                    : <Chip label="current" size="small" sx={{ height: 20, bgcolor: 'rgba(16,185,129,0.15)', color: '#10b981' }} />}
                                  <Chip label={(doc.lang || 'en').toUpperCase()} size="small" variant="outlined" sx={{ height: 20, color: 'text.secondary' }} />
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                  Generated: {new Date(doc.generated_at).toLocaleString()}
                                </Typography>
                              </Box>

                              <Tooltip title="This SHA-256 hash forms a digital fingerprint that proves file integrity in court.">
                                <Chip
                                  icon={<Fingerprint size={14} style={{ color: '#06b6d4' }} />}
                                  label={`${doc.sha256.substring(0, 16)}...`}
                                  size="small"
                                  sx={{ bgcolor: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4', fontWeight: 600 }}
                                />
                              </Tooltip>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
                              <Button
                                id={`btn-view-doc-${doc.id}`}
                                variant="contained"
                                size="small"
                                color="primary"
                                onClick={() => openViewer(doc.id, 'file', doc.type.replace(/_/g, ' '))}
                                startIcon={<Eye size={14} />}
                              >
                                View
                              </Button>

                              <Button
                                id={`btn-view-cert-${doc.id}`}
                                variant="text"
                                size="small"
                                color="primary"
                                onClick={() => openViewer(doc.id, 'certificate', `${doc.type.replace(/_/g, ' ')} — s.63 Certificate`)}
                                startIcon={<Eye size={14} />}
                              >
                                View Certificate
                              </Button>

                              <Button
                                id={`btn-download-doc-${doc.id}`}
                                variant="outlined"
                                size="small"
                                color="secondary"
                                component="a"
                                href={api.getDocumentDownloadUrl(doc.id)}
                                target="_blank"
                                startIcon={<FileDown size={14} />}
                              >
                                {t('downloadDoc')}
                              </Button>

                              <Button
                                id={`btn-download-cert-${doc.id}`}
                                variant="outlined"
                                size="small"
                                color="primary"
                                component="a"
                                href={api.getCertificateDownloadUrl(doc.id)}
                                target="_blank"
                                startIcon={<FileCheck size={14} />}
                              >
                                {t('downloadCert')}
                              </Button>
                            </Box>

                            <Divider sx={{ my: 1.5 }} />
                            <Typography variant="caption" color="warning.main" sx={{ fontWeight: 600 }}>
                              Disclaimer: {doc.disclaimer}
                            </Typography>
                          </Paper>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* TAB 4: CASE DIARY TIMELINE */}
          {tabValue === 3 && (
            <Card sx={{ background: '#111827' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                  {t('diary')}
                </Typography>

                {/* Manual diary entry (P2) */}
                {canWrite && (
                  <Box sx={{ display: 'flex', gap: 1.5, mb: 4, alignItems: 'flex-start' }}>
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      placeholder="Log an investigative step (e.g. 'Recorded witness statement of Ramesh; arrest of accused at 14:30')"
                      value={diaryNote}
                      onChange={(e) => setDiaryNote(e.target.value)}
                    />
                    <Button
                      variant="contained"
                      startIcon={addingDiary ? <CircularProgress size={14} color="inherit" /> : <Plus size={14} />}
                      onClick={handleAddDiary}
                      disabled={addingDiary || !diaryNote.trim()}
                      sx={{ whiteSpace: 'nowrap', height: 40 }}
                    >
                      Add Entry
                    </Button>
                  </Box>
                )}

                <Box sx={{ position: 'relative', pl: 4, '&::before': { content: '""', position: 'absolute', left: 16, top: 4, bottom: 4, width: 2, bgcolor: 'rgba(255,255,255,0.08)' } }}>
                  {diary.map((evt, idx) => {
                    let Icon = Briefcase;
                    let color = '#3b82f6';
                    if (evt.event_type === 'fir_filed') {
                      Icon = Plus;
                      color = '#10b981';
                    } else if (evt.event_type === 'analyzed') {
                      Icon = Scale;
                      color = '#06b6d4';
                    } else if (evt.event_type === 'facts_edited') {
                      Icon = BookOpen;
                      color = '#f59e0b';
                    } else if (evt.event_type === 'document_generated') {
                      Icon = FileCheck;
                      color = '#8b5cf6';
                    } else if (evt.event_type === 'evidence_uploaded') {
                      Icon = ImageIcon;
                      color = '#06b6d4';
                    } else if (evt.source === 'officer') {
                      Icon = BookOpen;
                      color = '#ec4899';
                    }

                    return (
                      <Box key={idx} sx={{ position: 'relative', mb: 4, '&:last-child': { mb: 0 } }}>
                        {/* Timeline Icon */}
                        <Box sx={{ position: 'absolute', left: -36, top: 2, width: 24, height: 24, borderRadius: '50%', bgcolor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px ' + color }}>
                          <Icon size={12} style={{ color: '#000' }} />
                        </Box>

                        {/* Event Content */}
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          {evt.description}
                          {evt.source === 'officer' && (
                            <Chip label="manual" size="small" sx={{ ml: 1, height: 18, fontSize: '0.6rem', bgcolor: 'rgba(236,72,153,0.15)', color: '#ec4899' }} />
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(evt.occurred_at).toLocaleString()}
                          {evt.actor && evt.actor !== 'system' ? ` · ${evt.actor}` : ''}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* TAB 5: EVIDENCE & FACE MATCH */}
          {tabValue === 4 && (
            <Grid container spacing={4}>
              {/* Upload + list */}
              <Grid size={{ xs: 12, md: 7 }}>
                <Card sx={{ background: '#111827' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ImageIcon size={20} style={{ color: '#06b6d4' }} /> Evidence Locker
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Upload evidence images/files. Each is SHA-256 hashed for chain of custody, tagged, and scanned for faces.
                    </Typography>

                    {canWrite && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                        <TextField size="small" label="Label (e.g. CCTV still, accused photo)" value={evLabel} onChange={(e) => setEvLabel(e.target.value)} />
                        <TextField size="small" label="Tags (comma-separated)" value={evTags} onChange={(e) => setEvTags(e.target.value)} />
                        <input type="file" ref={evFileRef} style={{ display: 'none' }} accept="image/*,application/pdf" onChange={handleUploadEvidence} />
                        <Button
                          variant="contained"
                          startIcon={evUploading ? <CircularProgress size={14} color="inherit" /> : <Upload size={14} />}
                          onClick={() => evFileRef.current?.click()}
                          disabled={evUploading}
                        >
                          {evUploading ? 'Uploading...' : 'Upload Evidence'}
                        </Button>
                      </Box>
                    )}

                    {evidence.length === 0 ? (
                      <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>No evidence uploaded yet.</Typography>
                    ) : (
                      <Grid container spacing={2}>
                        {evidence.map((ev) => (
                          <Grid size={{ xs: 6, sm: 4 }} key={ev.id}>
                            <Paper sx={{ p: 1, background: '#0f172a', border: '1px solid rgba(255,255,255,0.05)' }}>
                              {ev.kind === 'image' ? (
                                <Box component="img" src={api.getEvidenceUrl(ev.id)} alt={ev.label || 'evidence'}
                                  sx={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 1, mb: 1 }} />
                              ) : (
                                <Box sx={{ height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 1, mb: 1 }}>
                                  <FileDown size={32} style={{ color: '#64748b' }} />
                                </Box>
                              )}
                              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {ev.label || 'Untitled'}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                                {ev.face_count != null && ev.face_count > 0 && (
                                  <Chip icon={<ScanFace size={11} />} label={`${ev.face_count} face`} size="small" sx={{ height: 20, bgcolor: 'rgba(6,182,212,0.12)', color: '#06b6d4' }} />
                                )}
                                {ev.tags.map((tg, i) => (
                                  <Chip key={i} label={tg} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', color: 'text.secondary' }} />
                                ))}
                              </Box>
                              <Tooltip title={ev.sha256}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: '0.6rem' }}>
                                  {ev.sha256.substring(0, 18)}…
                                </Typography>
                              </Tooltip>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Face match */}
              <Grid size={{ xs: 12, md: 5 }}>
                <Card sx={{ background: '#111827' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ScanFace size={20} style={{ color: '#8b5cf6' }} /> Face Match
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Upload a probe face photo to match against the case's evidence images.
                    </Typography>
                    <Alert severity="warning" sx={{ mb: 2, py: 0.5 }}>
                      Demonstrative matcher — not a forensic identification.
                    </Alert>
                    <input type="file" ref={probeFileRef} style={{ display: 'none' }} accept="image/*" onChange={handleFaceMatch} />
                    <Button
                      variant="contained"
                      color="secondary"
                      fullWidth
                      startIcon={faceMatching ? <CircularProgress size={14} color="inherit" /> : <ScanFace size={14} />}
                      onClick={() => probeFileRef.current?.click()}
                      disabled={faceMatching || evidence.length === 0}
                    >
                      {faceMatching ? 'Matching...' : 'Upload Probe & Match'}
                    </Button>

                    {faceResult && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Probe faces detected: <strong>{faceResult.probe_faces}</strong>
                        </Typography>
                        {faceResult.matches.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">No comparable evidence faces.</Typography>
                        ) : (
                          faceResult.matches.map((m) => (
                            <Box key={m.evidence_id} sx={{ mb: 1.5 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2">{m.label || 'Untitled'}</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: m.score > 0.6 ? '#10b981' : '#f59e0b' }}>
                                  {Math.round(m.score * 100)}%
                                </Typography>
                              </Box>
                              <LinearProgress variant="determinate" value={m.score * 100}
                                sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.05)', '& .MuiLinearProgress-bar': { bgcolor: m.score > 0.6 ? '#10b981' : '#f59e0b' } }} />
                            </Box>
                          ))
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* TAB 6: MOCK INTEGRATIONS & TOOLS */}
          {tabValue === 5 && (
            <Grid container spacing={4}>
              {/* BharatPol Search */}
              <Grid size={{ xs: 12, md: 7 }}>
                <Card sx={{ background: '#111827' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Globe size={20} style={{ color: '#3b82f6' }} />
                      {t('bharatpol')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Simulate international criminal checkups using the mock BharatPolInterpol databases.
                    </Typography>

                    <Box component="form" onSubmit={handleBharatPolLookup} sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
                      <TextField
                        fullWidth
                        id="bp-search-input"
                        placeholder="Search name (e.g. Suresh Kumar)..."
                        value={bpQuery}
                        onChange={(e) => setBpQuery(e.target.value)}
                      />
                      <Button
                        id="btn-bp-search"
                        variant="contained"
                        type="submit"
                        disabled={bpLoading || !bpQuery}
                        sx={{ px: 3 }}
                      >
                        {bpLoading ? <CircularProgress size={16} /> : 'Lookup'}
                      </Button>
                    </Box>

                    {bpResult && (
                      <Paper sx={{ p: 3, background: '#0f172a', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <Typography variant="subtitle2" color="secondary.light" sx={{ fontWeight: 700, mb: 2 }}>
                          Database Source: {bpResult.source}
                        </Typography>

                        {bpResult.matches.length === 0 ? (
                          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                            No Interpol notices found for query "{bpResult.query}".
                          </Typography>
                        ) : (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {bpResult.matches.map((match: any, idx: number) => (
                              <Box key={idx} sx={{ p: 2, bgcolor: 'rgba(239, 68, 68, 0.05)', borderLeft: '3px solid #ef4444', borderRadius: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'error.main' }}>
                                    {match.notice}
                                  </Typography>
                                  <Chip label={match.interpol_ref} size="small" color="error" variant="outlined" />
                                </Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>Name: {match.name}</Typography>
                                <Typography variant="body2" color="text.secondary">Country of Origin: {match.country}</Typography>
                                <Typography variant="body2" color="text.secondary">Wanted for: {match.wanted_for}</Typography>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Paper>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Translation Utility */}
              <Grid size={{ xs: 12, md: 5 }}>
                <Card sx={{ background: '#111827' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Languages size={20} style={{ color: '#06b6d4' }} />
                      Quick Translation Tool
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Translate legal case details manually into English, Hindi, or Gujarati.
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        id="trans-input"
                        placeholder="Type text to translate..."
                        value={transInput}
                        onChange={(e) => setTransInput(e.target.value)}
                      />
                      <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          fullWidth
                          disabled={!transInput.trim() || transLoading}
                          startIcon={transLoading ? <CircularProgress size={12} /> : <Languages size={12} />}
                          onClick={() => handleQuickTranslate('hi')}
                        >
                          To Hindi
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          fullWidth
                          disabled={!transInput.trim() || transLoading}
                          startIcon={transLoading ? <CircularProgress size={12} /> : <Languages size={12} />}
                          onClick={() => handleQuickTranslate('gu')}
                        >
                          To Gujarati
                        </Button>
                      </Box>
                      {transOutput && (
                        <Box sx={{ bgcolor: 'rgba(6, 182, 212, 0.05)', p: 1.5, borderRadius: 1.5, borderLeft: '3px solid #06b6d4' }}>
                          <Typography variant="body2">{transOutput}</Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      )}

      {/* In-browser document viewer */}
      <Dialog open={viewerOpen} onClose={() => setViewerOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textTransform: 'capitalize', pr: 1 }}>
          {viewerTitle || 'Document'}
          <IconButton onClick={() => setViewerOpen(false)} size="small" sx={{ color: 'text.secondary' }}>
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: '#e5e7eb', minHeight: 400 }}>
          {viewerLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8, gap: 2 }}>
              <CircularProgress size={28} />
              <Typography sx={{ color: '#374151' }}>Loading document preview…</Typography>
            </Box>
          )}
          {/* docx-preview renders the .docx into this container (white "paper" on grey) */}
          <Box ref={viewerRef} sx={{ display: viewerLoading ? 'none' : 'block', '& .docx-wrapper': { background: 'transparent', padding: 0 } }} />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
