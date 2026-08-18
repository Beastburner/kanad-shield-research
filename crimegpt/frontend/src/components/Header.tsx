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
  Tooltip,
  Typography,
  type SelectChangeEvent
} from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import { ShieldCheck, Languages, UserCog, Sun, Moon } from 'lucide-react';
import { type Role } from '../api';
import { useActor } from '../useActor';

// The portal bar is a dark surface in BOTH colour schemes — authority navy on
// light, the elevated paper tone on dark — so its contents can assume light
// text throughout instead of branching per scheme.
const ON_BAR = '#F1F5F9';
const ON_BAR_MUTED = 'rgba(241, 245, 249, 0.72)';

const controlSx = {
  color: ON_BAR,
  fontSize: '0.85rem',
  fontWeight: 700,
  height: 44,
  bgcolor: 'rgba(255, 255, 255, 0.08)',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.18)' },
  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.14)' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: ON_BAR,
    borderWidth: 2,
  },
  '& .MuiSelect-icon': { color: ON_BAR_MUTED },
};

export default function Header() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { role, name, update } = useActor();
  const { mode, setMode } = useColorScheme();

  const handleLanguageChange = (event: SelectChangeEvent) => {
    i18n.changeLanguage(event.target.value);
  };

  const handleRoleChange = (event: SelectChangeEvent) => {
    update(event.target.value as Role, name);
  };

  const isDark = mode === 'dark';

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={(theme) => ({
        bgcolor: 'secondary.main',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        // With cssVariables enabled, `theme.palette.*` yields the LIGHT scheme's
        // literal values — using it here painted the bar white in dark mode.
        // `theme.vars.palette.*` emits the CSS var, which switches correctly.
        ...theme.applyStyles('dark', {
          backgroundColor: theme.vars.palette.background.paper,
          borderBottom: `1px solid ${theme.vars.palette.divider}`,
        }),
      })}
    >
      <Container maxWidth="xl">
        <Toolbar
          disableGutters
          sx={{
            justifyContent: 'space-between',
            minHeight: 68,
            gap: 2,
            flexWrap: 'wrap',
            py: { xs: 1, md: 0 },
          }}
        >
          {/* Logo & Brand */}
          <Box
            component="button"
            onClick={() => navigate('/')}
            aria-label="CrimeGPT home"
            id="brand-logo"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              p: 0.5,
              borderRadius: 1,
              font: 'inherit',
              color: 'inherit',
              textAlign: 'left',
              '&:focus-visible': { outline: `2px solid ${ON_BAR}`, outlineOffset: 2 },
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 44,
                borderRadius: 1,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={22} aria-hidden="true" />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography
                variant="h6"
                noWrap
                component="span"
                sx={{ fontWeight: 900, letterSpacing: '0.02em', color: ON_BAR, lineHeight: 1.2 }}
              >
                {t('appName')}
              </Typography>
              <Typography
                variant="caption"
                component="span"
                sx={{
                  color: ON_BAR_MUTED,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fontSize: '0.62rem',
                }}
              >
                Kanad S.H.I.E.L.D. 2026
              </Typography>
            </Box>
          </Box>

          {/* Navigation & Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {location.pathname !== '/' && (
              <Button
                variant="text"
                onClick={() => navigate('/')}
                sx={{
                  color: ON_BAR,
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
                  '&:focus-visible': { outline: `2px solid ${ON_BAR}`, outlineOffset: 2 },
                }}
              >
                {t('dashboard')}
              </Button>
            )}

            {/* Role / Actor switcher (P4 — RBAC) */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <UserCog size={18} aria-hidden="true" style={{ color: ON_BAR_MUTED, flexShrink: 0 }} />
              <TextField
                id="actor-name"
                value={name}
                onChange={(e) => update(role, e.target.value)}
                placeholder={t('officerName')}
                slotProps={{ htmlInput: { 'aria-label': t('officerName') } }}
                sx={{
                  width: 140,
                  '& .MuiInputBase-root': { ...controlSx },
                  '& input::placeholder': { color: ON_BAR_MUTED, opacity: 1 },
                }}
              />
              <FormControl size="small" variant="outlined">
                <Select
                  id="select-role"
                  value={role}
                  onChange={handleRoleChange}
                  aria-label={t('actingRole')}
                  sx={controlSx}
                >
                  <MenuItem value="IO">{t('roleIO')}</MenuItem>
                  <MenuItem value="SHO">{t('roleSHO')}</MenuItem>
                  <MenuItem value="LEGAL_ADVISOR">{t('roleLegalAdvisor')}</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Language Switcher */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Languages size={18} aria-hidden="true" style={{ color: ON_BAR_MUTED, flexShrink: 0 }} />
              <FormControl size="small" variant="outlined">
                <Select
                  id="select-language"
                  value={i18n.language}
                  onChange={handleLanguageChange}
                  aria-label={t('interfaceLanguage')}
                  sx={controlSx}
                >
                  <MenuItem value="en" id="lang-en">English</MenuItem>
                  <MenuItem value="hi" id="lang-hi">हिन्दी</MenuItem>
                  <MenuItem value="gu" id="lang-gu">ગુજરાતી</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Colour scheme toggle */}
            <Tooltip title={isDark ? t('switchToLight') : t('switchToDark')}>
              <Button
                id="btn-theme-toggle"
                onClick={() => setMode(isDark ? 'light' : 'dark')}
                aria-label={isDark ? t('switchToLight') : t('switchToDark')}
                aria-pressed={isDark}
                sx={{
                  minWidth: 44,
                  height: 44,
                  minHeight: 40,
                  px: 1.5,
                  color: ON_BAR,
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.14)' },
                  '&:focus-visible': { outline: `2px solid ${ON_BAR}`, outlineOffset: 2 },
                }}
              >
                {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
              </Button>
            </Tooltip>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
