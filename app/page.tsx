"use client";

import { redirect } from "next/navigation";
import { useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function Home() {
  // In client component, we can check for auth status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          // User is logged in, redirect to dashboard
          window.location.href = "/dashboard";
        } else {
          // User is not logged in, redirect to login
          window.location.href = "/login";
        }
      } catch (error) {
        console.error("Auth check error:", error);
        // On error, default to login page
        window.location.href = "/login";
      }
    };
    
    checkAuth();
  }, []);
  
  // Return a loading state while checking
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-emerald-600 via-gray-900 to-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-2xl font-semibold text-white">Loading ARWIGOS</h2>
        <p className="text-emerald-300 mt-2">AI-powered Real-time Wealth Insights & Goals-Oriented Strategy</p>
      </div>
    </div>
  );
}
