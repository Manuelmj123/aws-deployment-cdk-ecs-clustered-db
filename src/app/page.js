"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";

export default function Home() {
  const router = useRouter();
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hasSession, setHasSession] = useState(false);

  const title = "Deploy Your App with Projen";

  useEffect(() => {
    const sessionCookie = Cookies.get("session");
    setHasSession(!!sessionCookie);
  }, []);

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleButtonClick = () => {
    router.push(hasSession ? "/dashboard" : "/login");
  };

  const handleSignUpClick = () => {
    router.push("/signup");
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6"
    >
      {/* HERO TITLE */}
      <motion.h1
        className="text-5xl md:text-6xl font-extrabold flex flex-wrap justify-center mb-6 select-none"
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        {title.split("").map((char, i) => (
          <motion.span
            key={i}
            className="inline-block cursor-pointer"
            onMouseEnter={() => {
              setHoveredIndex(i);
              setTimeout(() => setHoveredIndex(null), 800);
            }}
            animate={
              hoveredIndex === i
                ? {
                    x:
                      (Math.random() - 0.5) * 150 +
                      (mousePos.x / window.innerWidth - 0.5) * 300,
                    y:
                      (Math.random() - 0.5) * 150 +
                      (mousePos.y / window.innerHeight - 0.5) * 300,
                    rotate: Math.random() * 360,
                    opacity: 0.4,
                  }
                : { x: 0, y: 0, rotate: 0, opacity: 1 }
            }
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </motion.h1>

      {/* SUBTITLE */}
      <motion.p
        className="text-lg md:text-xl text-gray-300 mb-6 text-center max-w-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1 }}
      >
        This is a <span className="font-semibold text-green-400">template project</span> built with cutting-edge tools to help you deploy quickly and efficiently.
      </motion.p>

      {/* TECHNOLOGIES */}
      <motion.div
        className="flex flex-wrap justify-center gap-3 mb-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
      >
        {[
          "Next.js 15",
          "TailwindCSS",
          "ShadCN UI",
          "Framer Motion",
          "MySQL",
          "Prisma",
          "Docker",
          "Projen"
        ].map((tech, idx) => (
          <motion.span
            key={idx}
            className="px-4 py-2 bg-gray-800 rounded-full text-sm shadow-lg hover:shadow-green-500/50 transition-all duration-300 cursor-default"
            whileHover={{ scale: 1.1, rotate: 3 }}
          >
            {tech}
          </motion.span>
        ))}
      </motion.div>

      {/* BUTTONS */}
      <motion.div
        className="flex gap-4"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
      >
        <Button
          type="button"
          onClick={handleButtonClick}
          size="lg"
          className="px-8 py-6 text-lg font-semibold bg-green-500 hover:bg-green-600 transition-all duration-300 shadow-lg hover:shadow-green-500/50"
        >
          {hasSession ? "Go to Dashboard" : "Sign In"}
        </Button>

        <Button
          type="button"
          onClick={handleSignUpClick}
          size="lg"
          variant="outline"
          className="px-8 py-6 text-lg font-semibold border-green-500 text-green-400 hover:bg-green-500 hover:text-white transition-all duration-300 shadow-lg hover:shadow-green-500/50"
        >
          Sign Up
        </Button>
      </motion.div>
    </div>
  );
}
