import { Link } from "react-router"
import { Logo } from "@/components/layout/Logo"
import { Button } from "@/components/ui/button"

export default function NotFoundPage() {
  return (
    <>
      <title>Page not found · TenderScout</title>
      <main
        id="main-content"
        className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-6 px-4 text-center"
      >
        <Logo />
        <p className="font-mono text-sm text-brand">404</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="text-muted-foreground">
          The page you're looking for doesn't exist or has moved.
        </p>
        <Button asChild>
          <Link to="/">Back to home</Link>
        </Button>
      </main>
    </>
  )
}
