import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1>404</h1>
        <p className="mt-2">This page doesn't exist.</p>
        <Link to="/" className="btn-base btn-primary mt-6 inline-flex">Go home</Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#ACD0DC" },
      { title: "KinGuard — Protecting the people you love" },
      { name: "description", content: "Senior-focused scam protection with AI scam detection, caregiver alerts, and SSN Shield." },
      { property: "og:title", content: "KinGuard — Protecting the people you love" },
      { name: "twitter:title", content: "KinGuard — Protecting the people you love" },
      { property: "og:description", content: "Senior-focused scam protection with AI scam detection, caregiver alerts, and SSN Shield." },
      { name: "twitter:description", content: "Senior-focused scam protection with AI scam detection, caregiver alerts, and SSN Shield." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/8f507abc-89c0-4723-8dac-fe4c794425a5" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/8f507abc-89c0-4723-8dac-fe4c794425a5" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700;800&family=Nunito:wght@500;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: () => (
    <AuthProvider>
      <Outlet />
      <Toaster
        position="top-center"
        duration={3000}
        toastOptions={{
          style: {
            background: "#B27F7C",
            color: "#fff",
            border: "none",
            fontSize: "18px",
            fontWeight: 700,
            padding: "16px 20px",
            borderRadius: "16px",
          },
        }}
      />
    </AuthProvider>
  ),
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}
