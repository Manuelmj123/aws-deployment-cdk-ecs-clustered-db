"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Cookies from "js-cookie";

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState("");
  const [stats, setStats] = useState({
    users: 0,
    revenue: 0,
    tasks: 0,
    projects: 0,
    messages: 0,
  });

  const recentActivities = [
    "John Doe signed up",
    "Payment of $199 processed",
    "New project 'Apollo' created",
    "Task 'UI Redesign' marked complete",
    "New message from Sarah",
    "Server uptime reached 99.99%",
    "Marketing campaign launched",
  ];

  useEffect(() => {
    const emailFromCookie = Cookies.get("user_email");
    if (emailFromCookie) {
      setUserEmail(emailFromCookie);
    } else {
      fetch("/api/me")
        .then((res) => res.json())
        .then((data) => setUserEmail(data?.email || "Guest"));
    }

    setStats({
      users: 128,
      revenue: 4500,
      tasks: 42,
      projects: 12,
      messages: 87,
    });
  }, []);

  return (
    <div className="p-8 space-y-10 bg-gradient-to-br from-gray-900 via-black to-gray-900 min-h-screen text-white relative overflow-hidden">
      {/* Subtle background animation */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-green-500/10 blur-3xl"
        animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />

      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 bg-white/10 backdrop-blur-xl rounded-xl p-8 border border-white/20 shadow-2xl"
      >
        <h1 className="text-4xl font-extrabold mb-3">
          👋 Welcome back,{" "}
          <motion.span
            className="text-green-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            {userEmail}
          </motion.span>
        </h1>
        <p className="text-gray-300 text-lg">
          Here’s your personalized dashboard with the latest stats, insights, and activities.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3 relative z-10">
        <StatCard title="Users" value={stats.users} subtitle="Active this week" />
        <StatCard title="Revenue" value={`$${stats.revenue.toLocaleString()}`} subtitle="Last 30 days" />
        <StatCard title="Tasks" value={stats.tasks} subtitle="Pending completion" />
        <StatCard title="Projects" value={stats.projects} subtitle="Ongoing projects" />
        <StatCard title="Messages" value={stats.messages} subtitle="Unread messages" />
        <StatCard title="Conversion Rate" value="4.7%" subtitle="This month" />
      </div>

      <Separator className="bg-gray-700 relative z-10" />

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 shadow-xl relative z-10"
      >
        <h2 className="text-2xl font-bold mb-6">📌 Recent Activity</h2>
        <motion.ul layout className="space-y-3">
          {recentActivities.map((activity, index) => (
            <motion.li
              key={index}
              className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              {activity}
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>

      {/* Quick Actions */}
      <div className="flex gap-4 mt-6 relative z-10">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
          <Button className="bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/30 px-6 py-4 text-lg">
            Add New Project
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
          <Button variant="outline" className="border-gray-500 text-gray-300 hover:bg-white/10 px-6 py-4 text-lg">
            View All Reports
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle }) {
  return (
    <motion.div
      whileHover={{ scale: 1.04, rotateX: 2, rotateY: 2 }}
      transition={{ type: "spring", stiffness: 250 }}
    >
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg hover:shadow-green-500/30 transition-all duration-300 text-white">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">{value}</p>
          <p className="text-sm text-gray-400">{subtitle}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
