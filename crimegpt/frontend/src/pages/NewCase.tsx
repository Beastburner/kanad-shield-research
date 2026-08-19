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
  AlertCircle,
  ShieldAlert
} from 'lucide-react';
import { api, type ScreenResult, type DuplicateFirDetail } from '../api';

export default function NewCase() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [caseNumber, setCaseNumber] = useState('');
  const [firNarrative, setFirNarrative] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [importingCctns, setImportingCctns] = useState(false);
  const [uploadingOcr, setUploadingOcr] = useState(false);
  // Tamper screening runs automatically on the same scanned file that goes to
  // OCR — the point of intake is exactly where "was this edited?" matters.
  const [screenResult, setScreenResult] = useState<ScreenResult | null>(null);
  const [duplicate, setDuplicate] = useState<DuplicateFirDetail | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  // Validate on blur rather than only on submit, and show it on the field.
  const [narrativeTouched, setNarrativeTouched] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const narrativeTooShort = firNarrative.trim().length < 10;
  const showNarrativeError = narrativeTouched && narrativeTooShort;

  const handleSubmit = async (e: React.FormEvent, force = false) => {
    e.preventDefault();
    if (narrativeTooShort) {
      setNarrativeTouched(true);
      document.getElementById('fir-narrative-input')?.focus();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setDuplicate(null);
      const newCase = await api.createCase(firNarrative.trim(), caseNumber.trim(), force);
      setSuccessMsg(t('caseCreated'));
      setTimeout(() => {
        navigate(`/case/${newCase.id}`);
      }, 1200);
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail;
      if (err.response?.status === 409 && detail?.code === 'duplicate_fir') {
        // Not an error — the FIR is already registered. Show the existing case
        // instead of a failure message.
        setDuplicate(detail);
      } else {
        // detail can be an object on other 4xx shapes; never render one raw.
        setError(typeof detail === 'string' ? detail : t('createCaseFailed'));
      }
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
      setSuccessMsg(t('cctnsImported'));
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(t('cctnsFailed'));
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
      setScreenResult(null);
      // One upload, two results: text extraction and tamper triage on the SAME
      // bytes. Screening failure must never block OCR, hence allSettled.
      const [ocrOutcome, screenOutcome] = await Promise.allSettled([
        api.ocrScannedFIR(file, 'eng'),
        api.screenDocument(file),
      ]);
      if (ocrOutcome.status === 'rejected') throw ocrOutcome.reason;
      const ocrResult = ocrOutcome.value;
      if (screenOutcome.status === 'fulfilled') setScreenResult(screenOutcome.value);
      setFirNarrative(ocrResult.text);
      const how = ocrResult.source === 'pdf_text' ? t('ocrSourcePdfText')
        : ocrResult.source === 'pdf_ocr' ? t('ocrSourcePdfOcr') : t('ocrSourceImage');
      setSuccessMsg(t('ocrExtracted', { chars: ocrResult.char_count, source: how }));
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || t('ocrFailed'));
    } finally {
      setUploadingOcr(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Box sx={{ py: 4, px: { xs: 2, md: 4 } }}>
      {/* Back to Dashboard */}
      <Button
        startIcon={<ArrowLeft size={16} aria-hidden="true" />}
        onClick={() => navigate('/')}
        sx={{ mb: 3, color: 'text.secondary' }}
      >
        {t('backToDashboard')}
      </Button>

      <Grid container spacing={4}>
        {/* Left Column: Form */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Sparkles size={24} aria-hidden="true" style={{ color: 'var(--mui-palette-primary-main)' }} />
                {t('newCase')}
              </Typography>

              {error && (
                <Alert severity="error" role="alert" icon={<AlertCircle size={20} />} sx={{ mb: 3, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              {duplicate && (
                <Alert severity="warning" role="alert" sx={{ mb: 3, borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {t('duplicateFirTitle')}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1.5 }}>
                    {t('duplicateFirBody', {
                      case: duplicate.existing_case_number || duplicate.existing_case_id.slice(0, 8),
                      date: new Date(duplicate.created_at).toLocaleDateString(),
                      similarity: Math.round(duplicate.similarity * 100),
                    })}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    <Button size="small" variant="contained"
                      onClick={() => navigate(`/case/${duplicate.existing_case_id}`)}>
                      {t('openExistingCase')}
                    </Button>
                    <Button size="small" variant="outlined" color="warning" disabled={loading}
                      onClick={(e) => handleSubmit(e as unknown as React.FormEvent, true)}>
                      {t('registerAnyway')}
                    </Button>
                  </Box>
                </Alert>
              )}

              {successMsg && (
                <Alert severity="success" role="status" sx={{ mb: 3, borderRadius: 2 }}>
                  {successMsg}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid size={12}>
                    <Typography component="label" htmlFor="case-number-input" variant="subtitle2" sx={{ mb: 1, fontWeight: 700, display: 'block' }}>
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
                    <Typography component="label" htmlFor="fir-narrative-input" variant="subtitle2" sx={{ mb: 1, fontWeight: 700, display: 'block' }}>
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
                      onBlur={() => setNarrativeTouched(true)}
                      disabled={loading}
                      error={showNarrativeError}
                      helperText={
                        <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                          <span>{showNarrativeError ? t('narrativeTooShort') : t('firNarrativeHelper')}</span>
                          <Box component="span" sx={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                            {t('charactersEntered', { n: firNarrative.trim().length })}
                          </Box>
                        </Box>
                      }
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
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
                    {t('quickIntake')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {t('quickIntakeHint')}
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button
                      id="btn-import-cctns"
                      variant="outlined"
                      color="secondary"
                      startIcon={importingCctns ? <CircularProgress size={16} /> : <Database size={16} aria-hidden="true" />}
                      onClick={handleCctnsImport}
                      disabled={loading || importingCctns || uploadingOcr}
                      fullWidth
                      sx={{ height: 44, justifyContent: 'flex-start', px: 2 }}
                    >
                      {importingCctns ? t('importing') : t('importCCTNS')}
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
                      startIcon={uploadingOcr ? <CircularProgress size={16} /> : <Upload size={16} aria-hidden="true" />}
                      onClick={handleOcrClick}
                      disabled={loading || importingCctns || uploadingOcr}
                      fullWidth
                      sx={{ height: 44, justifyContent: 'flex-start', px: 2 }}
                    >
                      {uploadingOcr ? t('parsingFIR') : t('uploadScannedFIR')}
                    </Button>

                    {screenResult && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <ShieldAlert size={15} aria-hidden="true" style={{ color: 'var(--mui-palette-warning-main)' }} />
                          {t('screenTitle')}
                        </Typography>
                        {screenResult.flags.map((f, i) => (
                          <Alert key={i} sx={{ py: 0.5, alignItems: 'flex-start' }}
                            severity={f.severity === 'warning' ? 'warning'
                              : f.severity === 'caution' ? 'info'
                              : f.check === 'overall' ? 'success' : 'info'}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{f.finding}</Typography>
                            <Typography variant="caption" color="text.secondary">{f.detail}</Typography>
                          </Alert>
                        ))}
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                          {screenResult.note}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Information panel */}
            <Grid size={12}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FileText size={18} aria-hidden="true" style={{ color: 'var(--mui-palette-primary-main)' }} />
                  {t('workflowTitle')}
                </Typography>
                <Box component="ol" sx={{ m: 0, pl: 2.5, color: 'text.secondary', '& li': { mb: 1.5 }, '& li:last-of-type': { mb: 0 } }}>
                  <Typography component="li" variant="body2">
                    {t('workflowStep1')}
                  </Typography>
                  <Typography component="li" variant="body2">
                    {t('workflowStep2')}
                  </Typography>
                  <Typography component="li" variant="body2">
                    {t('workflowStep3')}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
