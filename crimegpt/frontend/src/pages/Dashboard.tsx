import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  InputBase,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Plus,
  Search,
  FileText,
  AlertTriangle,
  CheckCircle,
  Activity,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { api, type Case } from '../api';
import { MONO_FONT } from '../theme';

// Status is carried by a label plus a semantic colour — never colour alone.
const STATUS_META: Record<string, { labelKey: string; tone: 'info' | 'success' | 'warning' }> = {
  new: { labelKey: 'statusNew', tone: 'info' },
  analyzed: { labelKey: 'statusAnalyzed', tone: 'info' },
  review_required: { labelKey: 'statusReviewRequired', tone: 'warning' },
  documented: { labelKey: 'statusDocumented', tone: 'success' },
};

function StatusChip({ status }: { status: Case['status'] }) {
  const { t } = useTranslation();
  const meta = STATUS_META[status];
  if (!meta) return <Chip label={status} size="small" />;
  return (
    <Chip
      label={t(meta.labelKey)}
      size="small"
      icon={meta.tone === 'warning' ? <AlertTriangle size={13} aria-hidden="true" /> : undefined}
      sx={{
        bgcolor: `rgba(var(--mui-palette-${meta.tone}-mainChannel) / 0.12)`,
        color: `${meta.tone}.main`,
        border: '1px solid',
        borderColor: `rgba(var(--mui-palette-${meta.tone}-mainChannel) / 0.4)`,
        '& .MuiChip-icon': { color: 'inherit' },
      }}
    />
  );
}

function StatCard({ icon, label, value, tone }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: 'primary' | 'warning' | 'success' | 'info';
}) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, '&:last-child': { pb: 2 } }}>
        <Box
          aria-hidden="true"
          sx={{
            p: 1.25,
            borderRadius: 1,
            display: 'flex',
            bgcolor: `rgba(var(--mui-palette-${tone}-mainChannel) / 0.12)`,
            color: `${tone}.main`,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>{label}</Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchCases = async (query?: string) => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await api.listCases(query);
      setCases(data);
    } catch (error) {
      console.error('Error fetching cases:', error);
      // Without this the empty list below reads as "no cases exist", which is a
      // very different claim from "the case service could not be reached".
      setLoadError(t('loadCasesError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCases(searchQuery);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Auto-search on empty query to restore list
    if (e.target.value === '') {
      fetchCases();
    }
  };

  // Calculations for stats
  const totalCases = cases.length;
  const reviewRequiredCases = cases.filter(c => c.status === 'review_required').length;
  const documentedCases = cases.filter(c => c.status === 'documented').length;
  const analyzedCases = cases.filter(c => c.status === 'analyzed').length;

  return (
    <Box sx={{ py: 4, px: { xs: 2, md: 4 } }}>
      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ mb: 0.5 }}>
            {t('recentCases')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('dashboardSubtitle')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={() => { setRefreshing(true); fetchCases(searchQuery); }}
            disabled={loading}
            startIcon={refreshing
              ? <CircularProgress size={16} color="inherit" />
              : <RefreshCw size={16} aria-hidden="true" />}
          >
            {t('refresh')}
          </Button>
          <Button
            id="btn-new-case"
            variant="contained"
            color="primary"
            startIcon={<Plus size={18} aria-hidden="true" />}
            onClick={() => navigate('/new')}
          >
            {t('newCase')}
          </Button>
        </Box>
      </Box>

      {/* Stats Section */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard icon={<Activity size={22} />} label={t('statTotal')} value={totalCases} tone="primary" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard icon={<AlertTriangle size={22} />} label={t('statPendingReview')} value={reviewRequiredCases} tone="warning" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard icon={<CheckCircle size={22} />} label={t('statDocumented')} value={documentedCases} tone="success" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard icon={<FileText size={22} />} label={t('statAnalyzed')} value={analyzedCases} tone="info" />
        </Grid>
      </Grid>

      {/* Search Bar */}
      <Paper
        component="form"
        role="search"
        onSubmit={handleSearchSubmit}
        variant="outlined"
        sx={{
          p: '2px 4px',
          display: 'flex',
          alignItems: 'center',
          mb: 3,
          '&:focus-within': { borderColor: 'primary.main', boxShadow: '0 0 0 1px var(--mui-palette-primary-main)' },
        }}
      >
        <IconButton type="submit" sx={{ p: '10px', color: 'text.secondary' }} aria-label={t('searchCases')} id="btn-search-submit">
          <Search size={20} aria-hidden="true" />
        </IconButton>
        <InputBase
          id="search-input"
          sx={{ ml: 1, flex: 1, color: 'text.primary', fontSize: '0.95rem' }}
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={handleSearchChange}
          inputProps={{ 'aria-label': t('searchPlaceholder') }}
        />
      </Paper>

      {/* Case Table */}
      <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8, flexDirection: 'column', gap: 2 }}>
            <CircularProgress color="primary" />
            <Typography color="text.secondary" role="status">{t('loadingCases')}</Typography>
          </Box>
        ) : loadError ? (
          <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
            <Typography variant="h6" color="error.main" sx={{ mb: 1 }}>
              {loadError}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('loadCasesErrorHint')}
            </Typography>
            <Button
              variant="contained"
              startIcon={<RefreshCw size={18} aria-hidden="true" />}
              onClick={() => fetchCases(searchQuery)}
            >
              {t('retry')}
            </Button>
          </Box>
        ) : cases.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              {t('noCases')}
            </Typography>
            <Button
              variant="contained"
              startIcon={<Plus size={18} aria-hidden="true" />}
              onClick={() => navigate('/new')}
            >
              {t('newCase')}
            </Button>
          </Box>
        ) : (
          <Table sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                <TableCell>{t('caseNumber')}</TableCell>
                <TableCell>{t('firNarrative')}</TableCell>
                <TableCell>{t('dateCreated')}</TableCell>
                <TableCell>{t('status')}</TableCell>
                <TableCell align="right">{t('actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cases.map((c) => (
                <TableRow
                  key={c.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/case/${c.id}`)}
                >
                  <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontFamily: MONO_FONT, whiteSpace: 'nowrap' }}>
                    {c.case_number || 'N/A'}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 350, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.fir_narrative}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>
                    {new Date(c.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell><StatusChip status={c.status} /></TableCell>
                  <TableCell align="right">
                    <Tooltip title={t('viewWorkspace')}>
                      <IconButton
                        id={`btn-view-${c.id}`}
                        color="primary"
                        aria-label={`Open workspace for case ${c.case_number || c.id.substring(0, 8)}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/case/${c.id}`);
                        }}
                      >
                        <ArrowRight size={18} aria-hidden="true" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Box>
  );
}
