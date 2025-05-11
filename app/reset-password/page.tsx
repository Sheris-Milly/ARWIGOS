"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Mail,
  Lock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define the inner component that uses useSearchParams
function ResetPasswordContent() {
  // ── state & Supabase setup ──
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // Check if we have the necessary parameters in the URL
    // This is usually handled by Supabase automatically
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");
    const expiresIn = searchParams.get("expires_in");
    const tokenType = searchParams.get("token_type");
    
    // If we don't have these parameters, the user might have navigated here directly
    if (!accessToken) {
      // We'll allow the form to be shown, but it will likely fail when submitted
      console.log("Missing access token in URL parameters");
    }
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast.error("Please enter both password fields");
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("Passwords don't match", {
        description: "Please make sure both passwords are identical."
      });
      return;
    }
    
    if (password.length < 6) {
      toast.error("Password too short", {
        description: "Password must be at least 6 characters long."
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Get the access token from the URL
      const accessToken = searchParams.get("access_token");
      
      if (!accessToken) {
        throw new Error("Missing access token. Please use the link from the reset email.");
      }
      
      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) throw error;
      
      // Show success message and redirect after a delay
      setResetSuccess(true);
      toast.success("Password reset successful!", {
        description: "You can now log in with your new password."
      });
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);
      
    } catch (err: any) {
      console.error(err);
      setResetError(true);
      setErrorMessage(err.message || "An error occurred during password reset");
      toast.error("Password reset failed", { 
        description: err.message || "Please try again or request a new reset link."
      });
    } finally {
      setLoading(false);
    }
  };

  // ── animations ──
  const bgCircle: Variants = {
    animate: {
      scale: [1, 1.1, 1],
      opacity: [0.6, 0.9, 0.6],
      transition: { duration: 12, repeat: Infinity, ease: "easeInOut" },
    },
  };
  const content: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { staggerChildren: 0.15, ease: "easeOut" } },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200 } },
  };

  return (
    <>
      {/* Full-screen gradient - Adjusted for a slightly different feel */}
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-600 via-gray-900 to-black" />

      {/* Content on top of gradient */}
      <div className="relative z-10 w-full min-h-screen overflow-y-auto flex items-center justify-center p-4">
        {/* Adjusted Animated Background Circles */}
        <motion.div
          className="absolute top-1/4 left-[-15%] w-[24rem] h-[24rem] bg-emerald-700/20 rounded-full filter blur-3xl opacity-70"
          variants={bgCircle}
          animate="animate"
        />
        <motion.div
          className="absolute bottom-1/4 right-[-10%] w-[32rem] h-[32rem] bg-emerald-900/15 rounded-full filter blur-3xl opacity-60"
          variants={bgCircle}
          animate="animate"
        />

        <div className="container mx-auto px-4 lg:px-8 flex flex-col items-center justify-center gap-16 w-full max-w-6xl">
          {/* Glassy Reset Password Card */}
          <motion.div
            className="w-full max-w-md bg-gray-900/70 backdrop-blur-xl border border-white/10 rounded-2xl p-8 sm:p-10 space-y-6 shadow-2xl shadow-black/30"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } }}
          >
            <AnimatePresence>
              {resetSuccess && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: "1rem", transition: { duration: 0.3 } }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.2 } }}
                >
                  <Alert className="border-emerald-500/40 bg-emerald-900/30 text-emerald-200">
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                    <AlertTitle className="text-emerald-300 font-semibold">Password Reset Successful</AlertTitle>
                    <AlertDescription className="text-emerald-300/80">
                      Your password has been updated. Redirecting to login page...
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
              
              {resetError && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: "1rem", transition: { duration: 0.3 } }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.2 } }}
                >
                  <Alert className="border-red-500/40 bg-red-900/30 text-red-200">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <AlertTitle className="text-red-300 font-semibold">Reset Failed</AlertTitle>
                    <AlertDescription className="text-red-300/80">
                      {errorMessage || "Please try again or request a new reset link."}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-center mb-4">
              {/* Logo Icon */}
              <div className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full shadow-lg shadow-emerald-500/30">
                <Lock className="w-7 h-7 text-white" />
              </div>
            </div>

            <h2 className="text-3xl font-semibold text-center text-emerald-300">
              Reset Password
            </h2>
            <p className="text-center text-emerald-100/70 -mt-1">Create a new password for your ARWIGOS account</p>

            <form onSubmit={handleResetPassword} className="space-y-5">
              {/* New Password Field */}
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400/70 group-focus-within:text-emerald-400 transition-colors duration-200" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  className="h-12 bg-gray-800/60 border-gray-700/80 text-white pl-12 pr-12 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:bg-gray-800 transition-all duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-300 transition-colors duration-200 p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              {/* Confirm Password Field */}
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400/70 group-focus-within:text-emerald-400 transition-colors duration-200" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="h-12 bg-gray-800/60 border-gray-700/80 text-white pl-12 pr-12 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:bg-gray-800 transition-all duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-300 transition-colors duration-200 p-1"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Enhanced Button */}
              <motion.button
                type="submit"
                disabled={loading || resetSuccess}
                className="w-full h-12 flex items-center justify-center bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-lg shadow-lg shadow-emerald-500/40 hover:shadow-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-emerald-500 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <motion.div
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                  />
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight size={20} className="ml-2" />
                  </>
                )}
              </motion.button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-400">
              Remember your password?{" "}
              <Link href="/login" className="text-emerald-400 font-medium hover:text-emerald-300 hover:underline transition-colors duration-200">
                Log in
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}

// Wrap with Suspense for useSearchParams
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-gradient-to-br from-emerald-600 via-gray-900 to-black flex items-center justify-center"><p className="text-white text-xl">Loading reset password page...</p></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
