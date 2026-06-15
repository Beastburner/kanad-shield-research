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

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCases = async (query?: string) => {
    try {
      setLoading(true);
      const data = await api.listCases(query);
      setCases(data);
    } catch (error) {
      console.error('Error fetching cases:', error);
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

  const getStatusChip = (status: Case['status']) => {
    switch (status) {
      case 'new':
        return <Chip label="New Intake" size="small" sx={{ bgcolor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }} />;
      case 'analyzed':
        return <Chip label="Analyzed" size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }} />;
      case 'review_required':
        return <Chip label="Review Required" size="small" icon={<AlertTriangle size={14} style={{ color: '#fbbf24' }} />} sx={{ bgcolor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }} />;
      case 'documented':
        return <Chip label="Documented" size="small" icon={<CheckCircle size={14} style={{ color: '#34d399' }} />} sx={{ bgcolor: 'rgba(16, 185, 129, 0.25)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.5)' }} />;
      default:
        return <Chip label={status} size="small" />;
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, background: 'linear-gradient(90deg, #fff 0%, #9ca3af 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {t('recentCases')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage, analyze, and generate court documents for police cases
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => { setRefreshing(true); fetchCases(searchQuery); }}
            disabled={loading}
            startIcon={refreshing ? <CircularProgress size={16} color="inherit" /> : <RefreshCw size={16} />}
            sx={{ height: 48 }}
          >
            Refresh
          </Button>
          <Button
            id="btn-new-case"
            variant="contained"
            color="primary"
            startIcon={<Plus size={18} />}
            onClick={() => navigate('/new')}
            sx={{ height: 48, fontWeight: 700 }}
          >
            {t('newCase')}
          </Button>
        </Box>
      </Box>

      {/* Stats Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.7) 0%, rgba(31, 41, 55, 0.7) 100%)', backdropFilter: 'blur(10px)' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}>
                <Activity size={24} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Total Cases</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>{totalCases}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.7) 0%, rgba(31, 41, 55, 0.7) 100%)', backdropFilter: 'blur(10px)' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                <AlertTriangle size={24} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Pending Review</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>{reviewRequiredCases}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.7) 0%, rgba(31, 41, 55, 0.7) 100%)', backdropFilter: 'blur(10px)' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <CheckCircle size={24} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Documented</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>{documentedCases}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.7) 0%, rgba(31, 41, 55, 0.7) 100%)', backdropFilter: 'blur(10px)' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                <FileText size={24} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Analyzed</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>{analyzedCases}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search Bar */}
      <Paper
        component="form"
        onSubmit={handleSearchSubmit}
        sx={{
          p: '2px 4px',
          display: 'flex',
          alignItems: 'center',
          mb: 4,
          background: '#111827',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 2,
          boxShadow: 'none',
          '&:hover': {
            borderColor: 'rgba(6, 182, 212, 0.3)',
          }
        }}
      >
        <IconButton type="submit" sx={{ p: '10px', color: 'text.secondary' }} aria-label="search" id="btn-search-submit">
          <Search size={20} />
        </IconButton>
        <InputBase
          id="search-input"
          sx={{ ml: 1, flex: 1, color: 'text.primary', fontSize: '0.95rem' }}
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </Paper>

      {/* Case Table */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          background: '#111827', 
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          borderRadius: 3
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8, flexDirection: 'column', gap: 2 }}>
            <CircularProgress color="primary" />
            <Typography color="text.secondary">Loading cases...</Typography>
          </Box>
        ) : cases.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              {t('noCases')}
            </Typography>
            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              onClick={() => navigate('/new')}
            >
              {t('newCase')}
            </Button>
          </Box>
        ) : (
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: 'rgba(255, 255, 255, 0.02)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Case Number</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>FIR Narrative</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Date Created</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>{t('status')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary' }}>{t('actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cases.map((c) => (
                <TableRow 
                  key={c.id}
                  hover
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.015) !important'
                    }
                  }}
                  onClick={() => navigate(`/case/${c.id}`)}
                >
                  <TableCell sx={{ fontWeight: 600, color: 'primary.light' }}>
                    {c.case_number || 'N/A'}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 350, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.fir_narrative}
                  </TableCell>
                  <TableCell>
                    {new Date(c.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell>{getStatusChip(c.status)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Case Workspace">
                      <IconButton 
                        id={`btn-view-${c.id}`}
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/case/${c.id}`);
                        }}
                      >
                        <ArrowRight size={18} />
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
