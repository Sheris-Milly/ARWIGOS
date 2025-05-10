"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import {
  Eye,
  EyeOff,
  ArrowRight,
  LineChart,
  Shield,
  MessageSquareText,
  Mail,
} from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function SignupPage() {
  // ── state & Supabase setup ──
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");

  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // ── Animations ──
  const bgCircle: Variants = {
    animate: {
      scale: [1, 1.1, 1],
      opacity: [0.5, 0.85, 0.5],
      transition: { duration: 15, repeat: Infinity, ease: "easeInOut" },
    },
  };
  const content: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { staggerChildren: 0.12, ease: "easeOut" } },
  };
  const item: Variants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 200, damping: 20 } },
  };
  const formItem: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200 } },
  };

  // ── Features for left panel ──
  const features = [
    {
      Icon: LineChart,
      title: "Portfolio Management",
      desc: "Track & analyze investments in real time.",
    },
    {
      Icon: Shield,
      title: "Market Insights",
      desc: "Stay updated with premium financial news.",
    },
    {
      Icon: MessageSquareText,
      title: "AI Advisor",
      desc: "Get personalized advice powered by AI.",
    },
  ];

  // ── Handlers ──
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !firstName || !lastName) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { first_name: firstName, last_name: lastName },
        },
      });
      if (error) throw error;
      setVerificationEmail(email);
      setShowVerificationDialog(true);
      toast.info("Signup initiated. Please check your email to verify.");
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("User already registered")) {
        toast.error("Email Already Registered", {
          description: "Please log in instead.",
          action: { label: "Login", onClick: () => router.push("/login") },
        });
      } else {
        toast.error("Signup Failed", { description: err.message || "" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationComplete = () => {
    setShowVerificationDialog(false);
    router.push("/login?verified=pending");
  };

  return (
    <>
      {/* Full‑screen emerald→dark gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-500 via-emerald-800 to-black" />

      {/* Animated background circles */}
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

      {/* Verification Dialog */}
      <AnimatePresence>
        {showVerificationDialog && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-900 border border-emerald-600/30 rounded-lg shadow-lg p-6 max-w-md w-full mx-4"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="rounded-full bg-emerald-600/20 p-4">
                  <Mail className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-emerald-400">Verify your email</h3>
                <p className="text-gray-300">
                  A link was sent to{" "}
                  <span className="font-medium text-emerald-300">{verificationEmail}</span>.
                </p>
                <div className="bg-gray-800/50 rounded-lg p-4 w-full text-left text-sm text-gray-400">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Open your inbox (and spam folder)</li>
                    <li>Click the verification link</li>
                    <li>Return here and log in</li>
                  </ul>
                </div>
                <div className="flex gap-3 w-full">
                  <Button
                    onClick={handleVerificationComplete}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Go to Login
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="flex-1 border-emerald-600/30 text-emerald-400 hover:bg-emerald-600/10"
                  >
                    Resend (TBD)
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="relative z-10 flex h-screen w-full">
        {/* Left panel */}
        <motion.div
          className="w-2/5 bg-emerald-600 relative overflow-hidden"
          initial="hidden"
          animate="show"
          variants={content}
        >
          {/* subtle grid overlay */}
          <div className="absolute inset-0 opacity-30">
            <div
              className="h-full w-full"
              style={{
                background:
                  "linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)",
                backgroundSize: "30px 30px",
              }}
            />
          </div>
          <div className="relative z-10 flex flex-col items-center justify-center h-full p-8 text-white space-y-6">
            <motion.div variants={item} className="rounded-full bg-emerald-500/30 p-4">
              {/* placeholder logo */}
              <svg
                className="w-10 h-10"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 9L12 4L21 9L12 14L3 9Z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 14L12 19L21 14"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
            <motion.h1 variants={item} className="text-3xl font-bold text-center">
              Finance Advisor
            </motion.h1>
            <motion.p variants={item} className="text-lg text-emerald-50 text-center max-w-xs">
              Your all‑in‑one financial management and advisory platform
            </motion.p>
            <div className="w-full space-y-4 max-w-xs">
              {features.map(({ Icon, title, desc }) => (
                <motion.div
                  key={title}
                  variants={item}
                  className="flex items-center space-x-3 bg-emerald-500/20 backdrop-blur-sm p-3 rounded-lg"
                >
                  <div className="bg-emerald-500 p-2 rounded-md">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium">{title}</h3>
                    <p className="text-sm text-emerald-50">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right panel */}
        <motion.div
          className="w-3/5 flex items-center justify-center bg-gray-950 p-8"
          initial="hidden"
          animate="show"
          variants={content}
        >
          <div className="w-full max-w-md space-y-6">
            <motion.div variants={formItem}>
              <h2 className="text-3xl font-bold text-emerald-400">Create an account</h2>
              <p className="text-gray-400">Start managing your finances with Finance Advisor</p>
            </motion.div>

            <motion.form
              onSubmit={handleSignup}
              className="space-y-5"
              variants={content}
            >
              <div className="grid grid-cols-2 gap-4">
                <motion.div variants={formItem} className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-300">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Imad"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="h-12 bg-gray-900 border-gray-800 text-white focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </motion.div>
                <motion.div variants={formItem} className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-300">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Jig"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="h-12 bg-gray-900 border-gray-800 text-white focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </motion.div>
              </div>

              <motion.div variants={formItem} className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 bg-gray-900 border-gray-800 text-white focus:border-emerald-500 focus:ring-emerald-500"
                />
              </motion.div>

              <motion.div variants={formItem} className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 pr-10 bg-gray-900 border-gray-800 text-white focus:border-emerald-500 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-300"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Password must be at least 8 characters long
                </p>
              </motion.div>

              <motion.div variants={formItem} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="terms"
                  className="h-4 w-4 rounded border-gray-800 bg-gray-900"
                  required
                />
                <label htmlFor="terms" className="text-sm text-gray-400">
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="text-emerald-400 hover:text-emerald-300 hover:underline"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-emerald-400 hover:text-emerald-300 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </motion.div>

              <motion.div variants={formItem}>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-lg shadow-emerald-600/20"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>Create account</span>
                      <ArrowRight size={18} />
                    </div>
                  )}
                </Button>
              </motion.div>
            </motion.form>

            <motion.div variants={formItem} className="relative flex items-center justify-center my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-800" />
              </div>
              <div className="relative px-4 text-sm bg-gray-950 text-gray-500">
                Or continue with
              </div>
            </motion.div>

            <motion.div variants={formItem} className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant="outline"
                className="h-11 bg-gray-900 border-gray-800 hover:bg-gray-800 text-gray-300"
              >
                {/* Google SVG */}
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92..." fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77..." fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s..." fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15..." fill="#EA4335" />
                </svg>
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 bg-gray-900 border-gray-800 hover:bg-gray-800 text-gray-300"
              >
                {/* Facebook SVG */}
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12..." />
                </svg>
                Facebook
              </Button>
            </motion.div>

            <motion.div variants={formItem} className="mt-8 text-center">
              <p className="text-gray-400">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-emerald-400 hover:text-emerald-300 hover:underline font-medium"
                >
                  Sign in
                </Link>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
