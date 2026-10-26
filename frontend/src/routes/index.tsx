import ComingSoonPage from "@/pages/ComingSoonPage"
import HomePage from "@/pages/HomePage"
import LoginPage from "@/pages/LoginPage"
import NotFoundPage from "@/pages/NotFoundPage"
import SignupPage from "@/pages/SignupPage"
import { createBrowserRouter } from "react-router"

/**
 * Route config. Later screens (feed, tender detail, chat, pipeline...) are
 * added here, ideally as lazy routes inside an AppShell layout route.
 */
export const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  {
    path: "/forgot-password",
    element: <ComingSoonPage title="Reset password" />,
  },
  { path: "/terms", element: <ComingSoonPage title="Terms" /> },
  { path: "/privacy", element: <ComingSoonPage title="Privacy Policy" /> },
  { path: "/dashboard", element: <ComingSoonPage title="Dashboard" /> },
  { path: "*", element: <NotFoundPage /> },
])
