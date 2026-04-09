"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { FormContainer } from "@/components/common/FormContainer";
import { FormGrid } from "@/components/common/FormGrid";
import { FieldLabel } from "@/components/common/FieldLabel";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authService } from "@/services/authService";
import { getApiErrorMessage } from "@/lib/apiError";

export default function ProfilePage() {
  const { user } = useAuth();
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passwordMsg, setPasswordMsg] = useState({ text: "", type: "" });
  const [loadingPass, setLoadingPass] = useState(false);

  // 2FA state
  const [qrUrl, setQrUrl] = useState("");
  const [secretStr, setSecretStr] = useState("");
  const [twoFaCode, setTwoFaCode] = useState("");
  const [twoFaMsg, setTwoFaMsg] = useState({ text: "", type: "" });
  const [loading2Fa, setLoading2Fa] = useState(false);

  const onChangePassword = async () => {
    setPasswordMsg({ text: "", type: "" });
    if (!currentPass || !newPass || !confirmPass) {
      setPasswordMsg({ text: "All fields are required", type: "error" });
      return;
    }
    if (newPass !== confirmPass) {
      setPasswordMsg({ text: "New passwords do not match", type: "error" });
      return;
    }
    setLoadingPass(true);
    try {
      await authService.changePassword({
        current_password: currentPass,
        new_password: newPass,
        confirm_password: confirmPass,
      });
      setPasswordMsg({ text: "Password changed successfully", type: "success" });
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
    } catch (err: unknown) {
      setPasswordMsg({ text: getApiErrorMessage(err, "Failed to change password"), type: "error" });
    } finally {
      setLoadingPass(false);
    }
  };

  const onGenerate2Fa = async () => {
    setTwoFaMsg({ text: "", type: "" });
    setLoading2Fa(true);
    try {
      const res = await authService.generate2Fa();
      setQrUrl(res.data.qrCodeUrl);
      setSecretStr(res.data.secret);
    } catch (err: unknown) {
      setTwoFaMsg({ text: getApiErrorMessage(err, "Failed to generate 2FA"), type: "error" });
    } finally {
      setLoading2Fa(false);
    }
  };

  const onEnable2Fa = async () => {
    setTwoFaMsg({ text: "", type: "" });
    if (!twoFaCode || twoFaCode.length !== 6) {
      setTwoFaMsg({ text: "Invalid code", type: "error" });
      return;
    }
    setLoading2Fa(true);
    try {
      await authService.enable2Fa(twoFaCode);
      setTwoFaMsg({ text: "2FA Enabled Successfully", type: "success" });
      setQrUrl("");
    } catch (err: unknown) {
      setTwoFaMsg({ text: getApiErrorMessage(err, "Failed to enable 2FA"), type: "error" });
    } finally {
      setLoading2Fa(false);
    }
  };

  const onDisable2Fa = async () => {
    setTwoFaMsg({ text: "", type: "" });
    setLoading2Fa(true);
    try {
      await authService.disable2Fa();
      setTwoFaMsg({ text: "2FA Disabled Successfully", type: "success" });
    } catch (err: unknown) {
      setTwoFaMsg({ text: getApiErrorMessage(err, "Failed to disable 2FA"), type: "error" });
    } finally {
      setLoading2Fa(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Security Settings</h1>
        <p className="text-muted-foreground">Manage your account security and authentication methods.</p>
        <p className="text-xs text-slate-500">{user?.email ?? user?.fullName}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
        {/* Change Password */}
        <div>
          <FormContainer title="Change Password" description="Update your password">
            {passwordMsg.text && (
              <div className={`mb-4 text-sm font-medium ${passwordMsg.type === "error" ? "text-red-500" : "text-green-600"}`}>
                {passwordMsg.text}
              </div>
            )}
            <FormGrid>
              <div className="col-span-1">
                <FieldLabel>Current Password</FieldLabel>
                <Input type="password" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} disabled={loadingPass} />
              </div>
              <div className="col-span-1">
                <FieldLabel>New Password</FieldLabel>
                <Input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} disabled={loadingPass} />
              </div>
              <div className="col-span-1">
                <FieldLabel>Confirm New Password</FieldLabel>
                <Input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} disabled={loadingPass} />
              </div>
            </FormGrid>
            <div className="pt-4">
              <Button onClick={onChangePassword} disabled={loadingPass || !currentPass || !newPass || !confirmPass}>
                {loadingPass ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </FormContainer>
        </div>

        {/* 2FA Setup */}
        <div>
          <FormContainer title="Two-Factor Authentication" description="Add an extra layer of security to your account">
            {twoFaMsg.text && (
              <div className={`mb-4 text-sm font-medium ${twoFaMsg.type === "error" ? "text-red-500" : "text-green-600"}`}>
                {twoFaMsg.text}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div>
                  <h4 className="font-medium text-sm">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-500">Enable or disable 2FA for your account.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={onDisable2Fa} disabled={loading2Fa}>Disable</Button>
                  <Button size="sm" onClick={qrUrl ? () => setQrUrl("") : onGenerate2Fa} disabled={loading2Fa}>
                    {qrUrl ? "Cancel Setup" : "Setup 2FA"}
                  </Button>
                </div>
              </div>

              {qrUrl && (
                <div className="p-4 border rounded-md space-y-4 bg-muted/30">
                  <h4 className="font-medium">Setup Instructions</h4>
                  <ol className="list-decimal pl-4 space-y-2 text-sm">
                    <li>Download an authenticator app (Google Authenticator, Authy, etc.)</li>
                    <li>Scan the QR code below or enter the secret key manually</li>
                  </ol>
                  <div className="flex flex-col items-center p-4 bg-white rounded-md mx-auto w-fit">
                    <Image src={qrUrl} alt="2FA QR Code" width={192} height={192} className="h-48 w-48" unoptimized />
                    <p className="mt-2 text-xs font-mono select-all bg-gray-100 p-1 rounded min-w-40 text-center">{secretStr}</p>
                  </div>
                  
                  <div className="pt-2">
                    <FieldLabel>Verification Code</FieldLabel>
                    <div className="flex gap-2 mt-1">
                      <Input 
                        placeholder="000000" 
                        maxLength={6} 
                        value={twoFaCode} 
                        onChange={(e) => setTwoFaCode(e.target.value)} 
                        className="flex-1"
                      />
                      <Button onClick={onEnable2Fa} disabled={!twoFaCode || twoFaCode.length !== 6 || loading2Fa}>
                        Verify & Enable
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </FormContainer>
        </div>
      </div>
    </div>
  );
}
