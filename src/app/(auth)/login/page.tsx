"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FormContainer } from "@/components/common/FormContainer";
import { FormGrid } from "@/components/common/FormGrid";
import { FieldLabel } from "@/components/common/FieldLabel";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/authService";
import { getApiErrorMessage } from "@/lib/apiError";
import { BRANDING } from "@/lib/constants/branding";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isBootstrapping } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 2FA state
  const [requires2Fa, setRequires2Fa] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    if (isBootstrapping) return;
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isBootstrapping, router]);

  if (isBootstrapping || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 text-sm text-gray-500">
        Loading...
      </div>
    );
  }

  async function onSubmit() {
    setError("");
    setLoading(true);
    try {
      if (requires2Fa) {
        if (!code || code.length !== 6) {
          setError("Please enter a valid 6-digit code");
          setLoading(false);
          return;
        }
        const res = await authService.verify2Fa(tempToken, code);
        if (res?.data?.user) {
          login(res.data.user, res.data.accessToken);
          router.push("/dashboard");
        }
      } else {
        const res = await authService.login(username, password);
        if (res?.data?.require_2fa) {
          setRequires2Fa(true);
          setTempToken(res.data.tempToken);
        } else if (res?.data?.user) {
          login(res.data.user, res.data.accessToken);
          router.push("/dashboard");
        }
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to login"));
    } finally {
      setLoading(false);
    }
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSubmit();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <FormContainer title="Sign in" description={BRANDING.loginDescription}>
          {error && <div className="mb-4 text-sm text-red-500 font-medium">{error}</div>}

          <form onSubmit={handleFormSubmit}>
            {!requires2Fa ? (
              <FormGrid>
                <div className="md:col-span-2">
                  <FieldLabel>Username / Email</FieldLabel>
                  <Input
                    placeholder="Enter username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    disabled={loading}
                    autoFocus
                    autoComplete="username"
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="flex justify-between">
                    <FieldLabel>Password</FieldLabel>
                    <Link href="/forgot-password" className="text-xs text-blue-600 hover:text-blue-800">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      disabled={loading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                    </button>
                  </div>
                </div>
              </FormGrid>
            ) : (
              <FormGrid>
                <div className="md:col-span-2">
                  <FieldLabel>Two-Factor Authentication Code</FieldLabel>
                  <Input
                    placeholder="Enter 6-digit code"
                    value={code}
                    maxLength={6}
                    onChange={(event) => setCode(event.target.value)}
                    disabled={loading}
                    autoFocus
                    autoComplete="one-time-code"
                    inputMode="numeric"
                  />
                </div>
              </FormGrid>
            )}

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full"
                disabled={loading || (!requires2Fa && (!username.trim() || !password.trim()))}
              >
                {loading ? "Please wait..." : requires2Fa ? "Verify Code" : "Login"}
              </Button>
              {requires2Fa && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => setRequires2Fa(false)}
                  disabled={loading}
                >
                  Back
                </Button>
              )}
            </div>
          </form>
        </FormContainer>
        <p className="mt-8 text-center text-[13px] text-muted-foreground/80">
          {BRANDING.poweredByText} <br />
          All Rights Reserved © 2026
        </p>
      </div>
    </div>
  );
}
