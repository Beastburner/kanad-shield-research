import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AppBar,
  Box,
  Button,
  Container,
  FormControl,
  MenuItem,
  Select,
  TextField,
  Toolbar,
  Typography,
  type SelectChangeEvent
} from '@mui/material';
import { ShieldCheck, Languages, UserCog } from 'lucide-react';
import { ROLE_LABELS, type Role } from '../api';
import { useActor } from '../useActor';

export default function Header() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { role, name, update } = useActor();

  const handleLanguageChange = (event: SelectChangeEvent) => {
    i18n.changeLanguage(event.target.value);
  };

  const handleRoleChange = (event: SelectChangeEvent) => {
    update(event.target.value as Role, name);
  };

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{ 
        background: 'rgba(17, 24, 39, 0.8)', 
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: 'none'
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between', height: 70 }}>
          {/* Logo & Brand */}
          <Box 
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
            onClick={() => navigate('/')}
            id="brand-logo"
          >
            <Box 
              sx={{ 
                p: 1, 
                borderRadius: 2, 
                background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)'
              }}
            >
              <ShieldCheck size={24} />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography 
                variant="h6" 
                noWrap 
                sx={{ 
                  fontFamily: '"Outfit", sans-serif',
                  fontWeight: 800, 
                  letterSpacing: '0.5px', 
                  color: '#ffffff',
                  lineHeight: 1.2
                }}
              >
                {t('appName')}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'primary.light', 
                  fontWeight: 600, 
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  fontSize: '0.65rem'
                }}
              >
                Kanad S.H.I.E.L.D. 2026
              </Typography>
            </Box>
          </Box>

          {/* Navigation & Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {location.pathname !== '/' && (
              <Button 
                variant="text" 
                onClick={() => navigate('/')}
                sx={{ color: 'text.secondary', fontWeight: 600, '&:hover': { color: 'primary.light' } }}
              >
                Dashboard
              </Button>
            )}

            {/* Role / Actor switcher (P4 — RBAC) */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <UserCog size={18} style={{ color: '#9ca3af' }} />
              <TextField
                id="actor-name"
                size="small"
                value={name}
                onChange={(e) => update(role, e.target.value)}
                placeholder="Officer name"
                sx={{
                  width: 130,
                  '& .MuiInputBase-root': { height: 36, fontSize: '0.8rem', bgcolor: 'rgba(255,255,255,0.03)' },
                  '& .MuiOutlinedInput-notchedOutline': { border: '1px solid rgba(255,255,255,0.08)' },
                }}
              />
              <FormControl size="small" variant="outlined">
                <Select
                  id="select-role"
                  value={role}
                  onChange={handleRoleChange}
                  sx={{
                    color: 'text.primary',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    height: 36,
                    bgcolor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.06)' },
                  }}
                  MenuProps={{ slotProps: { paper: { sx: { bgcolor: '#111827', border: '1px solid rgba(255,255,255,0.08)' } } } }}
                >
                  <MenuItem value="IO">{ROLE_LABELS.IO}</MenuItem>
                  <MenuItem value="SHO">{ROLE_LABELS.SHO}</MenuItem>
                  <MenuItem value="LEGAL_ADVISOR">{ROLE_LABELS.LEGAL_ADVISOR}</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Language Switcher */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Languages size={18} style={{ color: '#9ca3af' }} />
              <FormControl size="small" variant="outlined">
                <Select
                  id="select-language"
                  value={i18n.language}
                  onChange={handleLanguageChange}
                  sx={{
                    color: 'text.primary',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    height: 36,
                    bgcolor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none',
                    },
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.06)',
                    }
                  }}
                  MenuProps={{
                    slotProps: {
                      paper: {
                        sx: {
                          bgcolor: '#111827',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                        }
                      }
                    }
                  }}
                >
                  <MenuItem value="en" id="lang-en">English</MenuItem>
                  <MenuItem value="hi" id="lang-hi">हिन्दी</MenuItem>
                  <MenuItem value="gu" id="lang-gu">ગુજરાતી</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
