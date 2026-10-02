import { useEffect, useState } from 'react';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { AuthProvider } from './features/auth/context/AuthContext';
import AppRoutes from './routes/routes';
import ComponentLibraryPage from './pages/__component-library';

/**
 * Dev-only hash-route escape hatch for the feature 001 component library.
 * MUST resolve BEFORE `<BrowserRouter>` mounts — otherwise BrowserRouter
 * would intercept the empty path while the hash route is active.
 */
function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash;
}

// The single-file client preview (`bun run build:preview`) is served from an
// arbitrary URL, so it uses hash routing; the real app keeps clean paths.
const Router = import.meta.env.VITE_ROUTER === 'hash' ? HashRouter : BrowserRouter;

function App() {
  const hash = useHashRoute();

  // Dev-only component library escape hatch (returned EARLY).
  if (import.meta.env.DEV && hash === '#__component-library') {
    return <ComponentLibraryPage />;
  }

  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
