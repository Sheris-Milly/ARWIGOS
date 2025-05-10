"use client";

import React, { useState, useEffect } from "react";
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

export default function LoginPage() {
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
      {/* Full‑screen emerald→dark gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-500 via-emerald-800 to-black" />

      {/* Content on top of gradient */}
      <div className="relative z-10 w-full h-screen overflow-hidden">
        {/* ── Animated Background Circles ── */}
        <motion.div
          className="absolute top-1/4 left-[-10%] w-96 h-96 bg-emerald-600/30 rounded-full filter blur-3xl"
          variants={bgCircle}
          animate="animate"
        />
        <motion.div
          className="absolute bottom-1/4 right-[-5%] w-[28rem] h-[28rem] bg-emerald-800/20 rounded-full filter blur-2xl"
          variants={bgCircle}
          animate="animate"
        />

        <div className="mx-auto px-6 lg:px-20 flex h-full items-center justify-between">
          {/* ── Left: Premium Pitch ── */}
          <motion.div
            className="flex-1 pr-12 hidden lg:flex flex-col justify-center"
            initial="hidden"
            animate="show"
            variants={content}
          >
            <motion.h1
              className="text-5xl font-extrabold text-white mb-4 leading-tight"
              variants={item}
            >
              Financial Intelligence
            </motion.h1>
            <motion.p className="text-lg text-emerald-200 mb-8" variants={item}>
              Empower your financial future with our comprehensive platform.
            </motion.p>

            <motion.div className="space-y-6" variants={item}>
              {features.map(({ Icon, title, desc }) => (
                <motion.div key={title} className="flex items-start space-x-4" variants={item}>
                  <div className="flex-shrink-0 bg-emerald-500 p-3 rounded-lg">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white text-xl font-semibold">{title}</h3>
                    <p className="text-emerald-100">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Right: Glassy Login Card ── */}
          <motion.div
            className="w-full max-w-md bg-gray-900 bg-opacity-60 backdrop-blur-lg rounded-3xl p-10 space-y-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }}
          >
            <AnimatePresence>
              {showVerificationAlert && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto", transition: { duration: 0.3 } }}
                  exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
                >
                  <Alert className="border-emerald-600/30 bg-emerald-600/10 mb-4">
                    <Mail className="h-5 w-5 text-emerald-400 mr-2" />
                    <div>
                      <AlertTitle className="text-emerald-400">Verify Your Email</AlertTitle>
                      <AlertDescription className="text-emerald-300">
                        Check your inbox for the activation link.
                      </AlertDescription>
                    </div>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-center">
              <div className="p-4 bg-emerald-500 rounded-full shadow-lg">
                <Lock className="w-6 h-6 text-white" />
              </div>
            </div>

            <h2 className="text-3xl font-semibold text-center text-emerald-300">
              Secure Access
            </h2>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1 h-12 bg-gray-800 border-gray-700 text-white pl-12 focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
                <Mail className="absolute left-4 top-4 w-5 h-5 text-emerald-400" />
              </div>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 h-12 bg-gray-800 border-gray-700 text-white pl-12 pr-12 focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
                <Lock className="absolute left-4 top-4 w-5 h-5 text-emerald-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-4 text-gray-400 hover:text-gray-200"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                className="w-full h-12 flex items-center justify-center bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-lg shadow-2xl shadow-emerald-600/30"
                whileTap={{ scale: 0.97 }}
              >
                {loading ? (
                  <motion.div
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                  />
                ) : (
                  <>
                    <span>Unlock</span>
                    <ArrowRight size={18} className="ml-2" />
                  </>
                )}
              </motion.button>
            </form>

            <p className="mt-4 text-center text-gray-400">
              Don’t have an account?{" "}
              <Link href="/signup" className="text-emerald-300 font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}
