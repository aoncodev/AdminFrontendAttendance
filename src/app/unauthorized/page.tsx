"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, ArrowLeft, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { ThemeProvider } from "@/components/theme-provider";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <CardTitle className="text-2xl text-white">Access Denied</CardTitle>
            <CardDescription className="text-slate-400">
              You don&apos;t have permission to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-300 text-center">
              Please contact your administrator if you believe this is an error.
            </p>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Button
                onClick={() => router.push("/")}
                className="w-full bg-primary hover:bg-primary/90"
              >
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ThemeProvider>
  );
}
