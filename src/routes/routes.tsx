import { Loader2 } from 'lucide-react';
import { Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { lazyWithPreload } from '../utils/lazyWithPreload';
import ProtectedRoute from './ProtectedRoute';
import UnprotectedRoute from './UnprotectedRoute';
import ProtectedLayout from './ProtectedLayout';
import { useAuth } from '../features/auth/hooks/useAuth';
import { RequirePermission, firstPermittedPath } from '../features/auth/permissions';
import { NoAccessPage } from '../features/auth/pages/NoAccessPage';

// ── Lazy auth pages ─────────────────────────────────────────────────────────
const SignInPage = lazyWithPreload(() =>
  import('../features/auth/pages/SignInPage').then((m) => ({ default: m.SignInPage })),
);
const ForgotPasswordPage = lazyWithPreload(() =>
  import('../features/auth/pages/ForgotPasswordPage').then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);
const EnterOtpPage = lazyWithPreload(() =>
  import('../features/auth/pages/EnterOtpPage').then((m) => ({ default: m.EnterOtpPage })),
);
const SetNewPasswordPage = lazyWithPreload(() =>
  import('../features/auth/pages/SetNewPasswordPage').then((m) => ({
    default: m.SetNewPasswordPage,
  })),
);

// ── Lazy feature pages (one entry per screen; see .claude/skills/new-feature-screen) ──
const DashboardPage = lazyWithPreload(() =>
  import('../features/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const PatientsPage = lazyWithPreload(() =>
  import('../features/patients/pages/PatientsPage').then((m) => ({ default: m.PatientsPage })),
);
const AiSummaryPage = lazyWithPreload(() =>
  import('../features/ai-summary/pages/AiSummaryPage').then((m) => ({ default: m.AiSummaryPage })),
);

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="size-9 animate-spin text-primary" aria-hidden />
    </div>
  );
}

/** Wrap a protected route element in its required-permission guard. */
const guarded = (permission: string, element: ReactNode): ReactNode => (
  <RequirePermission permission={permission}>{element}</RequirePermission>
);

/**
 * Resolves the post-login / "/" landing to the first page the user can view, or
 * the dedicated no-access screen if they can view nothing.
 */
function LandingRedirect() {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const path = firstPermittedPath(new Set(user?.permissions ?? []));
  return path ? <Navigate to={path} replace /> : <NoAccessPage />;
}

const publicPage = (element: ReactNode): ReactNode => (
  <UnprotectedRoute>
    <Suspense fallback={<PageLoader />}>{element}</Suspense>
  </UnprotectedRoute>
);

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingRedirect />} />

      {/* Public auth routes — flat, no prefix. */}
      <Route path="login" element={publicPage(<SignInPage />)} />
      <Route path="forgot-password" element={publicPage(<ForgotPasswordPage />)} />
      <Route path="enter-otp" element={publicPage(<EnterOtpPage />)} />
      <Route path="set-password" element={publicPage(<SetNewPasswordPage />)} />

      {/* Protected app routes — flat, share the layout via a pathless parent. */}
      <Route
        element={
          <ProtectedRoute>
            <ProtectedLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={guarded('dashboard.view', <DashboardPage />)} />
        <Route path="patients" element={guarded('patients.view', <PatientsPage />)} />
        <Route path="ai-summary" element={guarded('ai_summary.view', <AiSummaryPage />)} />
      </Route>

      <Route path="*" element={<LandingRedirect />} />
    </Routes>
  );
}
