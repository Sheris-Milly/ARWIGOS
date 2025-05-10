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
  LineChart,
  Shield,
  MessageSquareText,
} from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define the inner component that uses useSearchParams
function LoginContent() {
  // ── state & Supabase setup ──
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (searchParams.get("verified") === "pending") {
      setShowVerificationAlert(true);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Login successful! Redirecting…");
      const to = new URLSearchParams(window.location.search).get("redirectTo") || "/dashboard";
      router.push(to);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Invalid login credentials")) {
        toast.error("Incorrect email or password.", {
          description: "Double‑check or sign up if needed.",
          action: { label: "Sign up", onClick: () => router.push("/signup") },
        });
      } else if (err.message?.includes("Email not confirmed")) {
        toast.warning("Email verification pending.", {
          description: "Check your inbox for the activation link.",
        });
        setShowVerificationAlert(true);
      } else {
        toast.error("Login failed.", { description: err.message || "Unexpected error." });
      }
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

  // ── feature list ──
  const features = [
    {
      Icon: LineChart,
      title: "Real‑time Portfolio Insights",
      desc: "Track performance, analyze trends & visualize investments with interactive dashboards.",
    },
    {
      Icon: Shield,
      title: "Curated Market Intelligence",
      desc: "Access premium financial news, analyst reports & personalized stock alerts.",
    },
    {
      Icon: MessageSquareText,
      title: "AI‑Powered Advisory",
      desc: "Receive advanced ML‑driven advice and portfolio optimization suggestions.",
    },
  ];

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

        <div className="container mx-auto px-4 lg:px-8 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-16 w-full max-w-6xl">
          {/* Left: Premium Pitch - Adjusted styling */}
          <motion.div
            className="flex-1 hidden lg:flex flex-col justify-center max-w-lg"
            initial="hidden"
            animate="show"
            variants={content}
          >
            <motion.h1
              className="text-5xl xl:text-6xl font-bold text-white mb-5 leading-tight tracking-tight"
              variants={item}
            >
              Unlock Financial Clarity
            </motion.h1>
            <motion.p className="text-lg text-emerald-100/80 mb-10" variants={item}>
              Gain insights, track performance, and receive AI-driven advice.
            </motion.p>

            <motion.div className="space-y-6" variants={item}>
              {features.map(({ Icon, title, desc }) => (
                <motion.div key={title} className="flex items-start space-x-4" variants={item}>
                  <div className="flex-shrink-0 bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-xl shadow-md">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-semibold mb-1">{title}</h3>
                    <p className="text-emerald-100/70 text-sm">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: Glassy Login Card - Enhanced styling */}
          <motion.div
            className="w-full max-w-md bg-gray-900/70 backdrop-blur-xl border border-white/10 rounded-2xl p-8 sm:p-10 space-y-6 shadow-2xl shadow-black/30"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } }}
          >
            <AnimatePresence>
              {showVerificationAlert && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: "1rem", transition: { duration: 0.3 } }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.2 } }}
                >
                  {/* Adjusted Alert styling */}
                  <Alert className="border-emerald-500/40 bg-emerald-900/30 text-emerald-200">
                    <Mail className="h-5 w-5 text-emerald-400" />
                    <AlertTitle className="text-emerald-300 font-semibold">Verify Your Email</AlertTitle>
                    <AlertDescription className="text-emerald-300/80">
                      Check your inbox for the activation link.
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-center mb-4">
              {/* Enhanced Lock Icon */}
              <div className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full shadow-lg shadow-emerald-500/30">
                <Lock className="w-7 h-7 text-white" />
              </div>
            </div>

            <h2 className="text-3xl font-semibold text-center text-emerald-300">
              Secure Access
            </h2>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Enhanced Input Fields */}
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400/70 group-focus-within:text-emerald-400 transition-colors duration-200" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-12 bg-gray-800/60 border-gray-700/80 text-white pl-12 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:bg-gray-800 transition-all duration-200"
                  required
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400/70 group-focus-within:text-emerald-400 transition-colors duration-200" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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

              {/* Enhanced Button */}
              <motion.button
                type="submit"
                disabled={loading}
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
                    <span>Log In</span>
                    <ArrowRight size={20} className="ml-2" />
                  </>
                )}
              </motion.button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-400">
              Don’t have an account?{" "}
              <Link href="/signup" className="text-emerald-400 font-medium hover:text-emerald-300 hover:underline transition-colors duration-200">
                Sign up
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}

// Modify the main export to wrap LoginContent with Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-gradient-to-br from-emerald-600 via-gray-900 to-black flex items-center justify-center"><p className="text-white text-xl">Loading login page...</p></div>}> {/* Added a more fitting fallback */}
      <LoginContent />
    </Suspense>
  );
}
