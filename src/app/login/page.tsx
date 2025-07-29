"use client";

import type React from "react";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { ThemeProvider } from "@/components/theme-provider";

interface OTPLoginResponse {
  success: boolean;
  access_token?: string;
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
  message?: string;
  error?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function LoginPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for OTP inputs
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take the last digit

    setOtp(newOtp);
    setError(null);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (newOtp.every((digit) => digit !== "") && newOtp.join("").length === 6) {
      setTimeout(() => handleOtpSubmit(newOtp.join("")), 100);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpSubmit = async (otpCode?: string) => {
    const code = otpCode || otp.join("");

    if (code.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // For real OTP codes, call your Go server
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          otp: code,
        }),
      });

      const result: OTPLoginResponse = await response.json();

      if (result.access_token) {
        // Store JWT token
        localStorage.setItem("auth_token", result.access_token);

        // Store user data if provided
        if (result.user) {
          localStorage.setItem("user", JSON.stringify(result.user));
        }

        // Redirect to dashboard
        router.push("/");
      } else {
        setError(
          result.error || result.message || "Invalid OTP. Please try again."
        );
        // Clear OTP inputs on error
        setOtp(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
      }
    } catch (err) {
      console.error("Verify OTP error:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearOtp = () => {
    setOtp(["", "", "", "", "", ""]);
    setError(null);
    otpRefs.current[0]?.focus();
  };

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Logo/Brand Section */}
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-white">
              Restaurant Manager
            </h1>
            <p className="text-slate-400">
              Enter your 6-digit access code to continue
            </p>
          </div>

          {/* Login Form */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center text-white">
                Enter Access Code
              </CardTitle>
              <CardDescription className="text-center text-slate-400">
                Please enter your 6-digit verification code
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Error Alert */}
              {error && (
                <Alert
                  variant="destructive"
                  className="border-red-500/50 bg-red-500/10 mb-4"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-200">6-Digit Access Code</Label>
                  <div className="flex gap-2 justify-center">
                    {otp.map((digit, index) => (
                      <Input
                        key={index}
                        ref={(el) => {
                          otpRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-12 h-12 text-center text-lg font-bold bg-slate-700/50 border-slate-600 text-white focus:border-primary"
                        disabled={isLoading}
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="button"
                  onClick={() => handleOtpSubmit()}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={isLoading || otp.join("").length !== 6}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Verify Code
                    </>
                  )}
                </Button>

                {/* Clear Button */}
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-slate-400 hover:text-slate-200"
                  onClick={clearOtp}
                  disabled={isLoading}
                >
                  Clear Code
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-slate-400">
            <p>© 2024 Restaurant Manager. All rights reserved.</p>
            <p className="mt-1">
              Need help?{" "}
              <Button
                variant="link"
                className="px-0 text-primary hover:text-primary/80 text-sm"
              >
                Contact Support
              </Button>
            </p>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
