"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Mail,
  User,
  Lock,
  LineChart,
  Shield,
  MessageSquareText,
} from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"; // Keep Card for the verification dialog

export default function SignupPage() {
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

  // ── Animations (copied from login) ──
  const bgCircle: Variants = {
    animate: {
      scale: [1, 1.1, 1],
      opacity: [0.6, 0.9, 0.6],
      transition: { duration: 12, repeat: Infinity, ease: "easeInOut" },
    },
  };
  const contentVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { staggerChildren: 0.15, ease: "easeOut" } },
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200 } },
  };

  // ── Feature list (copied from login) ──
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

  // ── Handlers (kept from original signup) ──
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !firstName || !lastName) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { first_name: firstName, last_name: lastName },
          // emailRedirectTo: `${window.location.origin}/auth/callback`, // Optional
        },
      });

      if (error) throw error;

      if (data.user && data.user.identities && data.user.identities.length === 0) {
        toast.warning("Signup requires an additional step.");
      } else if (data.user) {
        setVerificationEmail(email);
        setShowVerificationDialog(true);
        toast.info("Confirmation email sent! Please check your inbox (and spam folder).");
      } else {
        toast.error("Signup incomplete. Please try again or contact support.");
      }

    } catch (err: any) {
      console.error("Signup Error:", err);
      if (err.message?.includes("User already registered")) {
        toast.error("Email Already Registered", {
          description: "An account with this email already exists. Please log in or use a different email.",
          action: { label: "Go to Login", onClick: () => router.push("/login") },
        });
      } else if (err.message?.includes("Password should be at least 6 characters")) {
        toast.error("Weak Password", {
          description: "Password must be at least 6 characters long.",
        });
      } else {
        toast.error("Signup Failed", {
          description: err.message || "An unexpected error occurred. Please try again.",
        });
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
      {/* Full-screen gradient (from login) */}
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-600 via-gray-900 to-black" />

      {/* Content on top of gradient */}
      <div className="relative z-10 w-full min-h-screen overflow-y-auto flex items-center justify-center p-4">
        {/* Animated Background Circles (from login) */}
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
          {/* Left: Premium Pitch (from login) */}
          <motion.div
            className="flex-1 hidden lg:flex flex-col justify-center max-w-lg"
            initial="hidden"
            animate="show"
            variants={contentVariants}
          >
            <motion.h1
              className="text-5xl xl:text-6xl font-bold text-white mb-5 leading-tight tracking-tight"
              variants={itemVariants}
            >
              Start Your Financial Journey
            </motion.h1>
            <motion.p className="text-lg text-emerald-100/80 mb-10" variants={itemVariants}>
              Join today to manage your finances smarter and achieve your goals.
            </motion.p>

            <motion.div className="space-y-6" variants={itemVariants}>
              {features.map(({ Icon, title, desc }) => (
                <motion.div key={title} className="flex items-start space-x-4" variants={itemVariants}>
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

          {/* Right: Glassy Signup Card (styled like login) */}
          <motion.div
            className="w-full max-w-md bg-gray-900/70 backdrop-blur-xl border border-white/10 rounded-2xl p-8 sm:p-10 space-y-6 shadow-2xl shadow-black/30"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } }}
          >
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full shadow-lg shadow-emerald-500/30">
                <User className="w-7 h-7 text-white" /> {/* Changed icon to User */} 
              </div>
            </div>

            <h2 className="text-3xl font-semibold text-center text-emerald-300">
              Create Your Account
            </h2>

            <form onSubmit={handleSignup} className="space-y-5">
              {/* First and Last Name Inputs - Adjusted styling */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="first-name" className="text-sm font-medium text-emerald-100/80">First Name</Label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3 h-4 w-4 text-emerald-100/50 pointer-events-none" />
                    <Input
                      id="first-name"
                      type="text"
                      placeholder="name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="pl-10 w-full bg-gray-800/50 border-white/10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/80 text-white placeholder-gray-500 rounded-lg shadow-sm transition duration-150 ease-in-out"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="last-name" className="text-sm font-medium text-emerald-100/80">Last Name</Label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3 h-4 w-4 text-emerald-100/50 pointer-events-none" />
                    <Input
                      id="last-name"
                      type="text"
                      placeholder="surname"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="pl-10 w-full bg-gray-800/50 border-white/10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/80 text-white placeholder-gray-500 rounded-lg shadow-sm transition duration-150 ease-in-out"
                    />
                  </div>
                </div>
              </div>

              {/* Email Input - Adjusted styling */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-emerald-100/80">Email Address</Label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 h-4 w-4 text-emerald-100/50 pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 w-full bg-gray-800/50 border-white/10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/80 text-white placeholder-gray-500 rounded-lg shadow-sm transition duration-150 ease-in-out"
                  />
                </div>
              </div>

              {/* Password Input - Adjusted styling */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-emerald-100/80">Password</Label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 h-4 w-4 text-emerald-100/50 pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 pr-10 w-full bg-gray-800/50 border-white/10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/80 text-white placeholder-gray-500 rounded-lg shadow-sm transition duration-150 ease-in-out"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-emerald-100/60 hover:text-emerald-100/90 focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button - Adjusted styling */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold py-3 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </>
                ) : (
                  <>
                    Sign Up <ArrowRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </form>

            {/* Footer Link - Adjusted styling */}
            <p className="text-sm text-center w-full text-emerald-100/70">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-emerald-400 hover:text-emerald-300 hover:underline underline-offset-2 transition duration-150 ease-in-out">
                Log In Instead
              </Link>
            </p>
          </motion.div>
        </div>
      </div>

      {/* Verification Dialog (Modal - kept from original signup, styling slightly adjusted) */}
      <AnimatePresence>
        {showVerificationDialog && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Using original Card component here for the dialog */}
            <motion.div
              className="bg-gray-800 border border-emerald-600/30 rounded-xl shadow-2xl max-w-md w-full mx-auto overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
            >
              <CardHeader className="bg-gray-800/80 border-b border-gray-700/50 p-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="rounded-full bg-emerald-500/10 p-3 border border-emerald-500/30">
                    <Mail className="w-7 h-7 text-emerald-400" />
                  </div>
                  <CardTitle className="text-xl sm:text-2xl font-semibold text-emerald-300">Check Your Inbox!</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <p className="text-gray-300 text-sm sm:text-base text-center">
                  We've sent a verification link to:
                  <br />
                  <span className="font-medium text-emerald-200 block mt-1 break-all">{verificationEmail}</span>
                </p>
                <div className="bg-gray-700/50 rounded-lg p-4 w-full text-left text-sm text-gray-400 border border-gray-600/50">
                  <p className="font-semibold mb-2 text-gray-200">Next Steps:</p>
                  <ul className="list-disc list-inside space-y-1.5">
                    <li>Find the email from Finance Advisor.</li>
                    <li>Click the verification link inside.</li>
                    <li>Return here and log in to your new account.</li>
                  </ul>
                  <p className="mt-3 text-xs">Can't find it? Check your spam/junk folder.</p>
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-4 bg-gray-800/80 border-t border-gray-700/50">
                 <Button
                    onClick={handleVerificationComplete}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-md transition duration-150 ease-in-out"
                  >
                    Okay, Go to Login
                  </Button>
                  {/* Optional: Add Resend functionality later if needed */}
              </CardFooter>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
