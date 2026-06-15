import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import { darkTheme } from './theme';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import NewCase from './pages/NewCase';
import CaseWorkspace from './pages/CaseWorkspace';

// Initialize i18n
import './i18n';

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
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
          {/* Header Portal Bar */}
          <Header />

          {/* Main Content Workspace Area */}
          <Box component="main" sx={{ flexGrow: 1 }}>
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
