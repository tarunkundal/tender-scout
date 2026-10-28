import { RedirectIfAuthed } from "@/components/auth/RedirectIfAuthed"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { AppShell } from "@/components/layout/AppShell"
import AppPlaceholderPage from "@/pages/AppPlaceholderPage"
import ComingSoonPage from "@/pages/ComingSoonPage"
import DashboardPage from "@/pages/DashboardPage"
import ForgotPasswordPage from "@/pages/ForgotPasswordPage"
import GoogleCallbackPage from "@/pages/GoogleCallbackPage"
import HomePage from "@/pages/HomePage"
import LoginPage from "@/pages/LoginPage"
import NotFoundPage from "@/pages/NotFoundPage"
import ResetPasswordPage from "@/pages/ResetPasswordPage"
import SettingsPage from "@/pages/SettingsPage"
import SetupCompanyPage from "@/pages/SetupCompanyPage"
import SetupProfilePage from "@/pages/SetupProfilePage"
import SignupPage from "@/pages/SignupPage"
import VerifyEmailPage from "@/pages/VerifyEmailPage"
import { createBrowserRouter } from "react-router"

/**
 * Route config. Public pages; auth pages that bounce signed-in users
 * (RedirectIfAuthed); the onboarding steps (company, then profile) and the
 * AppShell screens behind RequireAuth. Later screens go inside the AppShell
 * layout route.
 */
export const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/terms", element: <ComingSoonPage title="Terms" /> },
  { path: "/privacy", element: <ComingSoonPage title="Privacy Policy" /> },
  { path: "/verify-email", element: <VerifyEmailPage /> },
  // Google sign-in landing (also the SDK's popup callback route).
  { path: "/auth/callback", element: <GoogleCallbackPage /> },
  {
    element: <RedirectIfAuthed />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/signup", element: <SignupPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
      { path: "/reset-password", element: <ResetPasswordPage /> },
    ],
  },
  {
    element: <RequireAuth requireCompany={false} />,
    children: [{ path: "/setup/company", element: <SetupCompanyPage /> }],
  },
  {
    element: <RequireAuth requireProfile={false} />,
    children: [{ path: "/setup/profile", element: <SetupProfilePage /> }],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: "/dashboard", element: <DashboardPage /> },
          {
            path: "/tenders",
            element: <AppPlaceholderPage title="Tenders" />,
          },
          {
            path: "/documents",
            element: <AppPlaceholderPage title="Documents" />,
          },
          {
            path: "/pipeline",
            element: <AppPlaceholderPage title="Pipeline" />,
          },
          { path: "/settings", element: <SettingsPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
])
