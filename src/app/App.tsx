import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '../design/ThemeProvider';
import { I18nProvider } from '../i18n/I18nProvider';
import { SessionProvider } from '../auth/SessionProvider';
import { DataProviderRoot } from '../data/DataContext';
import { RequireRole } from '../auth/RequireRole';
import { ToastProvider } from '../components/molecule/Toast/Toast';
import { ErrorBoundary } from '../components/organism/ErrorBoundary/ErrorBoundary';
import { DevTools } from '../dev/DevTools';
import { getRoutes, getStrings } from './registry';
import { withShell } from './shells';
import { ScrollToTop } from './ScrollToTop';
import { publishManifest } from './manifest';
import { coreStrings } from '../i18n/coreStrings';

/**
 * Provider order: Theme > I18n > Data > Session (needs the users table) > Toast > Router. Payments and Supabase
 * providers slot in here later as seams; Company-OS is not wired (D-183 equivalent) until Justin says so.
 */
export function App() {
  const allRoutes = getRoutes();
  const allStrings = [coreStrings, ...getStrings()];
  publishManifest(allRoutes);
  return (
    <ThemeProvider>
      <I18nProvider tables={allStrings}>
        <DataProviderRoot>
          <SessionProvider>
            <ToastProvider>
              <HashRouter>
                <ScrollToTop />
                <Routes>
                  {allRoutes.map((r) => <Route key={r.path} path={r.path} element={<RequireRole roles={r.roles}>{withShell(r, <ErrorBoundary resetKey={r.path}>{r.element}</ErrorBoundary>)}</RequireRole>} />)}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <DevTools />
              </HashRouter>
            </ToastProvider>
          </SessionProvider>
        </DataProviderRoot>
      </I18nProvider>
    </ThemeProvider>
  );
}
