import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  TextField,
  Typography,
  Alert,
  Paper
} from '@mui/material';
import { 
  ArrowLeft, 
  Database, 
  Upload, 
  FileText, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { api } from '../api';

export default function NewCase() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [caseNumber, setCaseNumber] = useState('');
  const [firNarrative, setFirNarrative] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [importingCctns, setImportingCctns] = useState(false);
  const [uploadingOcr, setUploadingOcr] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firNarrative || firNarrative.trim().length < 10) {
      setError('FIR narrative must be at least 10 characters long.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const newCase = await api.createCase(firNarrative.trim(), caseNumber.trim());
      setSuccessMsg('Case created successfully! Redirecting to workspace...');
      setTimeout(() => {
        navigate(`/case/${newCase.id}`);
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to create case. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCctnsImport = async () => {
    try {
      setImportingCctns(true);
      setError(null);
      const mockFir = await api.importFromCCTNS('Ahmedabad', 'Ramesh Patel');
      setFirNarrative(mockFir.fir_narrative);
      setCaseNumber(mockFir.cctns_fir_id);
      setSuccessMsg('Successfully imported mock FIR from CCTNS integration.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError('CCTNS Import failed. Is the backend running?');
    } finally {
      setImportingCctns(false);
    }
  };

  const handleOcrClick = () => {
    fileInputRef.current?.click();
  };

  const handleOcrFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingOcr(true);
      setError(null);
      const ocrResult = await api.ocrScannedFIR(file, 'eng');
      setFirNarrative(ocrResult.text);
      const how = ocrResult.source === 'pdf_text' ? 'PDF text layer'
        : ocrResult.source === 'pdf_ocr' ? 'scanned PDF (OCR)' : 'image (OCR)';
      setSuccessMsg(`Extracted ${ocrResult.char_count} characters from ${how}.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'OCR extraction failed. Verify Tesseract dependencies.');
    } finally {
      setUploadingOcr(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Box sx={{ py: 4, px: { xs: 2, md: 4 } }}>
      {/* Back to Dashboard */}
      <Button
        startIcon={<ArrowLeft size={16} />}
        onClick={() => navigate('/')}
        sx={{ mb: 3, color: 'text.secondary' }}
      >
        {t('backToDashboard')}
      </Button>

      <Grid container spacing={4}>
        {/* Left Column: Form */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ background: '#111827', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Sparkles size={24} style={{ color: '#06b6d4' }} />
                {t('newCase')}
              </Typography>

              {error && (
                <Alert severity="error" icon={<AlertCircle size={20} />} sx={{ mb: 3, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              {successMsg && (
                <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                  {successMsg}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid size={12}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      {t('caseNumber')}
                    </Typography>
                    <TextField
                      fullWidth
                      id="case-number-input"
                      placeholder={t('caseNumberPlaceholder')}
                      value={caseNumber}
                      onChange={(e) => setCaseNumber(e.target.value)}
                      disabled={loading}
                    />
                  </Grid>

                  <Grid size={12}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      {t('firNarrative')} *
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      id="fir-narrative-input"
                      rows={8}
                      placeholder={t('firNarrativePlaceholder')}
                      value={firNarrative}
                      onChange={(e) => setFirNarrative(e.target.value)}
                      disabled={loading}
                      helperText="Note: Narrative supports multilingual input (English, Hindi, and Gujarati)."
                    />
                  </Grid>

                  <Grid size={12}>
                    <Button
                      id="btn-create-case"
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={loading || importingCctns || uploadingOcr}
                      sx={{ height: 48, fontWeight: 700 }}
                    >
                      {loading ? <CircularProgress size={24} color="inherit" /> : t('createCase')}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Quick Import Actions & Instructions */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Grid container spacing={3}>
            {/* Quick Intake Helpers */}
            <Grid size={12}>
              <Card sx={{ background: 'linear-gradient(135deg, #111827 0%, #0f172a 100%)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'primary.light' }}>
                    Quick Intake Helpers
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Accelerate police registration using connected databases or digital evidence files.
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button
                      id="btn-import-cctns"
                      variant="outlined"
                      color="secondary"
                      startIcon={importingCctns ? <CircularProgress size={16} /> : <Database size={16} />}
                      onClick={handleCctnsImport}
                      disabled={loading || importingCctns || uploadingOcr}
                      fullWidth
                      sx={{ height: 44, justifyContent: 'flex-start', px: 2 }}
                    >
                      {importingCctns ? 'Importing...' : t('importCCTNS')}
                    </Button>

                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      accept="image/*,application/pdf"
                      onChange={handleOcrFileChange}
                    />

                    <Button
                      id="btn-ocr-fir"
                      variant="outlined"
                      color="primary"
                      startIcon={uploadingOcr ? <CircularProgress size={16} /> : <Upload size={16} />}
                      onClick={handleOcrClick}
                      disabled={loading || importingCctns || uploadingOcr}
                      fullWidth
                      sx={{ height: 44, justifyContent: 'flex-start', px: 2 }}
                    >
                      {uploadingOcr ? 'Parsing FIR...' : t('uploadScannedFIR')}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Information panel */}
            <Grid size={12}>
              <Paper sx={{ p: 3, background: '#111827', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FileText size={18} style={{ color: '#06b6d4' }} />
                  Officer Workflow Instructions
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  1. Paste the written FIR narrative or scan the physical page copy using the OCR tool.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  2. Double check case registration numbers to ensure alignment with CCTNS system records.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  3. The pipeline will automatically map and translate terms, classify the applicable BNS code, and draft necessary documents.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
