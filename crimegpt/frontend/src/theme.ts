import { createTheme } from '@mui/material/styles';

// Enable MUI CSS theme variables so both colour schemes resolve from one stylesheet.
// This is what lets `sx` reference channel tokens such as
// `rgba(var(--mui-palette-success-mainChannel) / 0.12)` and stay scheme-aware.
declare module '@mui/material/styles' {
  interface CssThemeVariables {
    enabled: true;
  }
}

/**
 * Design system: "Trust & Authority" + data-dense government tooling.
 * Light is the default scheme (matches the Government/Public Service palette);
 * dark is the derived counterpart for night-shift control-room use.
 *
 * Every colour below is a semantic role. Pages must reference roles
 * (`background.paper`, `success.main`, `divider`) rather than raw hex, so a
 * scheme switch needs no per-component branching.
 */

const SERIF = '"EB Garamond", "Noto Serif Devanagari", "Noto Serif Gujarati", Georgia, "Times New Roman", serif';
// Lato has no Devanagari or Gujarati coverage; the Noto faces carry hi/gu text
// at a matched optical size instead of dropping to an arbitrary system font.
const SANS = '"Lato", "Noto Sans Devanagari", "Noto Sans Gujarati", "Segoe UI", system-ui, -apple-system, sans-serif';
const MONO = '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

export const appTheme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'data-mui-color-scheme',
  },
  defaultColorScheme: 'light',
  colorSchemes: {
    light: {
      palette: {
        mode: 'light',
        // Accent / CTA — 5.9:1 on white, AA for body text and AAA at large sizes.
        primary: {
          main: '#0369A1',
          light: '#0284C7',
          dark: '#075985',
          contrastText: '#FFFFFF',
        },
        // Authority navy — used for the portal bar and headline surfaces. 16.8:1 on the page background.
        secondary: {
          main: '#0F172A',
          light: '#334155',
          dark: '#020617',
          contrastText: '#FFFFFF',
        },
        background: {
          default: '#F8FAFC',
          paper: '#FFFFFF',
        },
        text: {
          primary: '#020617',
          secondary: '#64748B', // 4.8:1 on white — passes AA for body text.
        },
        divider: '#E2E8F0',
        success: { main: '#166534', contrastText: '#FFFFFF' }, // 7.1:1 on white, 5.9:1 on its own 12% tint
        warning: { main: '#92400E', contrastText: '#FFFFFF' }, // 7.1:1 on white, 5.9:1 on its own 12% tint
        error: { main: '#DC2626', contrastText: '#FFFFFF' },   // 4.8:1 on white
        info: { main: '#0369A1', contrastText: '#FFFFFF' },
        action: {
          hover: 'rgba(15, 23, 42, 0.04)',
          selected: 'rgba(3, 105, 161, 0.08)',
        },
      },
    },
    dark: {
      palette: {
        mode: 'dark',
        primary: {
          main: '#38BDF8', // 8.7:1 on the dark page background
          light: '#7DD3FC',
          dark: '#0EA5E9',
          contrastText: '#04121F',
        },
        secondary: {
          main: '#CBD8E8',
          light: '#E2E8F0',
          dark: '#94A3B8',
          contrastText: '#04121F',
        },
        background: {
          default: '#0B1220',
          paper: '#131C2E',
        },
        text: {
          primary: '#E8EEF7',
          secondary: '#9FB0C7', // 8.5:1 on the dark page background
        },
        divider: 'rgba(148, 163, 184, 0.18)',
        success: { main: '#4ADE80', contrastText: '#04121F' },
        warning: { main: '#FBBF24', contrastText: '#04121F' },
        error: { main: '#F87171', contrastText: '#04121F' },
        info: { main: '#38BDF8', contrastText: '#04121F' },
        action: {
          hover: 'rgba(226, 232, 240, 0.06)',
          selected: 'rgba(56, 189, 248, 0.14)',
        },
      },
    },
  },
  typography: {
    fontFamily: SANS,
    // Serif reserved for page and section titles, where it reads as institutional.
    // Anything scannable (h5/h6, tabs, tables, buttons) stays on the sans face.
    h1: { fontFamily: SERIF, fontWeight: 600, letterSpacing: '-0.01em' },
    h2: { fontFamily: SERIF, fontWeight: 600, letterSpacing: '-0.01em' },
    h3: { fontFamily: SERIF, fontWeight: 600 },
    h4: { fontFamily: SERIF, fontWeight: 600, fontSize: '1.75rem' },
    h5: { fontFamily: SANS, fontWeight: 700, fontSize: '1.35rem', letterSpacing: '-0.01em' },
    h6: { fontFamily: SANS, fontWeight: 700, fontSize: '1.05rem' },
    subtitle1: { fontWeight: 700 },
    subtitle2: { fontWeight: 700, letterSpacing: '0.01em' },
    body1: { fontSize: '0.95rem', lineHeight: 1.55 },
    body2: { fontSize: '0.875rem', lineHeight: 1.55 },
    caption: { fontSize: '0.78rem' },
    button: { textTransform: 'none', fontWeight: 700, letterSpacing: '0.01em' },
  },
  shape: {
    // Restrained radius — government tooling, not a consumer app.
    borderRadius: 6,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // Density 8/10: a tighter scale than the marketing default.
        ':root': {
          '--space-1': '4px',
          '--space-2': '8px',
          '--space-3': '12px',
          '--space-4': '16px',
          '--space-5': '24px',
          '--space-6': '32px',
        },
        // Motion 3/10 — subtle only, and fully disabled when the OS asks.
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.01ms !important',
            scrollBehavior: 'auto !important',
          },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          // 44px minimum touch target.
          minHeight: 44,
          padding: '8px 18px',
          transition: 'background-color 180ms ease, border-color 180ms ease, color 180ms ease',
          '&:focus-visible': {
            outline: '2px solid var(--mui-palette-primary-main)',
            outlineOffset: 2,
          },
        },
        sizeSmall: { minHeight: 44, padding: '4px 12px' },
        outlined: { borderColor: 'var(--mui-palette-divider)' },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&:focus-visible': {
            outline: '2px solid var(--mui-palette-primary-main)',
            outlineOffset: 2,
          },
        },
        sizeMedium: { width: 44, height: 44 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid var(--mui-palette-divider)',
          boxShadow: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        outlined: { borderColor: 'var(--mui-palette-divider)' },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiInputBase: {
      styleOverrides: {
        // Buttons already had a 44px floor; text fields did not, and `size="small"`
        // left them at 31-39px.
        root: { minHeight: 44 },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: 'var(--mui-palette-background-paper)',
          '& fieldset': { borderColor: 'var(--mui-palette-divider)' },
          '&:hover fieldset': { borderColor: 'var(--mui-palette-text-secondary)' },
          '&.Mui-focused fieldset': {
            borderColor: 'var(--mui-palette-primary-main)',
            borderWidth: 2,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 700, borderRadius: 4 },
        sizeSmall: { height: 24 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        // Dense rows — this is a case list, not a marketing table.
        root: { paddingTop: 10, paddingBottom: 10 },
        head: ({ theme }) => ({
          fontWeight: 700,
          fontSize: '0.78rem',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          // text.secondary measured 4.39:1 on the tinted head — just under AA at
          // this size. Light gets a stronger tone (6.9:1); dark already passed.
          color: '#475569',
          backgroundColor: 'var(--mui-palette-action-hover)',
          ...theme.applyStyles('dark', { color: theme.vars.palette.text.secondary }),
        }),
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { height: 3, backgroundColor: 'var(--mui-palette-primary-main)' },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 48,
          fontWeight: 700,
          fontSize: '0.9rem',
          textTransform: 'none',
          color: 'var(--mui-palette-text-secondary)',
          '&.Mui-selected': { color: 'var(--mui-palette-primary-main)' },
          '&:focus-visible': {
            outline: '2px solid var(--mui-palette-primary-main)',
            outlineOffset: -2,
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 6, border: '1px solid currentColor' },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { backgroundColor: 'var(--mui-palette-action-hover)' },
      },
    },
  },
});

export const MONO_FONT = MONO;
