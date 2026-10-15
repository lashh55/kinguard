import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

/** Sends signed-out visitors to the welcome page with a friendly "create your account" note. */
export function useRequireAccount() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/", search: { signup: 1 }, replace: true });
  }, [loading, user, navigate]);
  return { signedOut: !loading && !user, user, goToSignup: () => navigate({ to: "/", search: { signup: 1 } }) };
}
