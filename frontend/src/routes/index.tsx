import { createBrowserRouter } from "react-router"
import ComingSoonPage from "@/pages/ComingSoonPage"
import HomePage from "@/pages/HomePage"
import NotFoundPage from "@/pages/NotFoundPage"

/**
 * Route config. Later screens (feed, tender detail, chat, pipeline...) are
 * added here, ideally as lazy routes inside an AppShell layout route.
 */
export const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/login", element: <ComingSoonPage title="Log in" /> },
  { path: "/signup", element: <ComingSoonPage title="Sign up" /> },
  { path: "*", element: <NotFoundPage /> },
])
