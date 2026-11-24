import React from "react";
import V9Navbar from "@/components/v9/V9Navbar";
import V9Footer from "@/components/v9/V9Footer";
import V9PageTransition from "@/components/v9/V9PageTransition";

export default function V9Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#111110] selection:bg-[#8E1C1C] selection:text-white">
      <V9Navbar />
      <div className="min-h-[82vh]">
        <V9PageTransition>{children}</V9PageTransition>
      </div>
      <V9Footer />
    </div>
  );
}
