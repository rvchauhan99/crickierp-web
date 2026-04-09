"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormContainer } from "@/components/common/FormContainer";
import { FormGrid } from "@/components/common/FormGrid";
import { FieldLabel } from "@/components/common/FieldLabel";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function onSubmit() {
    login(username || "Admin");
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <FormContainer title="Sign in" description="CrickiERP admin login">
          <FormGrid>
            <div className="md:col-span-2">
              <FieldLabel>Username</FieldLabel>
              <Input placeholder="Enter username" value={username} onChange={(event) => setUsername(event.target.value)} />
            </div>
            <div className="md:col-span-2">
              <FieldLabel>Password</FieldLabel>
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </FormGrid>
          <div className="pt-2">
            <Button className="w-full" onClick={onSubmit} disabled={!username.trim() || !password.trim()}>
              Login
            </Button>
          </div>
        </FormContainer>
      </div>
    </div>
  );
}
