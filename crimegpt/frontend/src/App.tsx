import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import { appTheme } from './theme';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import NewCase from './pages/NewCase';
import CaseWorkspace from './pages/CaseWorkspace';

// Initialize i18n
import './i18n';

function App() {
  return (
    <ThemeProvider theme={appTheme} defaultMode="light">
      <CssBaseline />
      <Router>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            bgcolor: 'background.default',
            color: 'text.primary'
          }}
        >
          {/* The portal bar holds role and language controls; without this a
              keyboard user tabs through all of them on every page. */}
          <a className="skip-link" href="#main-content">Skip to main content</a>

          {/* Header Portal Bar */}
          <Header />

          {/* Main Content Workspace Area */}
          <Box component="main" id="main-content" tabIndex={-1} sx={{ flexGrow: 1 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/new" element={<NewCase />} />
              <Route path="/case/:id" element={<CaseWorkspace />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
