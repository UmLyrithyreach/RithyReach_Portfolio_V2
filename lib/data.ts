export type SkillCategory = "Frontend" | "Backend" | "Database" | "Styling" | "Tools";

export interface Skill {
  name: string;
  category: SkillCategory;
  level: number;
}

export const skills: Skill[] = [
  { name: "React", category: "Frontend", level: 95 },
  { name: "Next.js", category: "Frontend", level: 85 },
  { name: "Node.js", category: "Backend", level: 70 },
  { name: "Express.js", category: "Backend", level: 70 },
  { name: "PostgreSQL", category: "Database", level: 92 },
  { name: "MySQL", category: "Database", level: 90 },
  { name: "MongoDB", category: "Database", level: 50 },
  { name: "Tailwind CSS", category: "Styling", level: 95 },
  { name: "CSS3", category: "Styling", level: 85 },
  { name: "Git", category: "Tools", level: 85 },
  { name: "GitHub", category: "Tools", level: 95 },
];

export const skillCategories: SkillCategory[] = ["Frontend", "Backend", "Database", "Styling", "Tools"];

export function skillLevelLabel(l: number): string {
  return l >= 90 ? "Expert" : l >= 75 ? "Advanced" : l >= 60 ? "Intermediate" : "Learning";
}

export type ProjectStatus = "In Progress" | "Completed";

export interface Project {
  id: string;
  number: string;
  title: string;
  year: string;
  status: ProjectStatus;
  categories: string[];
  description: string;
  shortDescription: string;
  features: string[];
  tech: string[];
  stackSummary: string;
  live?: string;
  code?: string;
  image: string;
}

export const projects: Project[] = [
  {
    id: "asip-redesign",
    number: "01",
    title: "ASIP Redesign",
    year: "2024",
    status: "In Progress",
    categories: ["Frontend Web Application", "Redesign Project", "Own Project"],
    description: "An interactive redesign of the Angkor Social Innovation Park website — Lenis smooth scrolling, an interactive SVG of Angkor Wat and GSAP-driven parallax galleries.",
    shortDescription: "An interactive redesign of the Angkor Social Innovation Park website — Lenis smooth scrolling, an interactive SVG of Angkor Wat and GSAP-driven parallax galleries.",
    features: [
      "Custom interactive SVG vector illustration of Angkor Wat with advanced hover states and animations",
      "Immersive 3D and parallax scrolling effects using GSAP ScrollTrigger",
      "Orbiting and swirling ribbon-style interactive photo gallery with mouse interaction",
      "Ultra-smooth and responsive scrolling experience integrated with Lenis",
      "Clean, responsive, mobile-first design leveraging modern CSS typography",
      "Robust end-to-end testing and quality assurance written using Playwright",
    ],
    tech: ["Next.js 16", "React 19", "GSAP", "Lenis", "Tailwind CSS v4"],
    stackSummary: "next.js 16 · react 19 · gsap",
    live: "https://asip-redesign-eyca.vercel.app/",
    image: "/image/projects/asipredesign.webp",
  },
  {
    id: "automata-simulation",
    number: "02",
    title: "Automata Simulation",
    year: "2025",
    status: "Completed",
    categories: ["Full-Stack Web Application", "School Project"],
    description: "A full-stack app to build, edit and test DFAs and NFAs, visualised live.",
    shortDescription: "A full-stack app to build, edit and test DFAs and NFAs, visualised live.",
    features: [
      "A full-stack web application that simulates and visualizes Finite Automata.",
      "Supports both Deterministic Finite Automata (DFA) and Non-Deterministic Finite Automata (NFA).",
      "Allows users to create, edit, and test automata models.",
      "Provides real-time visualization of the automata's behavior.",
      "Supports exporting automata models as JSON files.",
    ],
    tech: ["React", "Express.js", "SQLite", "C++", "Vite", "Node.js"],
    stackSummary: "react · express · sqlite · c++",
    live: "https://automata-fawn.vercel.app",
    code: "https://github.com/ShurikenBy6YoungTechStudents/automata-project",
    image: "/image/projects/automata-project.webp",
  },
  {
    id: "samki-digital-market",
    number: "03",
    title: "Samki Digital Market",
    year: "2026",
    status: "Completed",
    categories: ["Full-Stack Web Application", "Capstone Project"],
    description: "Capstone Project II. A multi-vendor e-commerce platform for Cambodian skincare — seller dashboards, an AI shopping assistant, Khmer/English, and Stripe plus Bakong KHQR payments.",
    shortDescription: "Capstone Project II. A multi-vendor e-commerce platform for Cambodian skincare — seller dashboards, an AI shopping assistant, Khmer/English, and Stripe plus Bakong KHQR payments.",
    features: [
      "Multi-vendor marketplace with seller onboarding and approval flow",
      "Bakong KHQR and Stripe dual payment system",
      "AI shopping assistant with product search and order lookup",
      "Real-time seller notifications via Telegram bot",
      "Bilingual interface (English/Khmer) with USD/KHR currency switching",
      "Automated payout system with configurable hold period",
      "Order lifecycle management from purchase to delivery",
      "Responsive mobile-first design with dark mode support",
    ],
    tech: ["Next.js 16", "Sanity CMS", "Clerk", "Stripe", "Bakong KHQR", "React 19"],
    stackSummary: "next.js 16 · sanity · clerk · stripe",
    live: "https://full-stack-ecommerce-tb3i.vercel.app",
    code: "https://github.com/YongVuthivathnakk/samki-digital-market-next-app",
    image: "/image/projects/capstone.webp",
  },
  {
    id: "portfolio-2",
    number: "04",
    title: "Portfolio 2.0",
    year: "2024",
    status: "Completed",
    categories: ["Frontend Web Application"],
    description: "My previous portfolio, built with Next.js, TypeScript and Framer Motion.",
    shortDescription: "My previous portfolio, built with Next.js, TypeScript and Framer Motion.",
    features: [
      "A modern, responsive portfolio website built with Next.js and TypeScript.",
      "Utilizes Tailwind CSS for styling and Framer Motion for animations.",
      "Features a clean and intuitive user interface.",
      "Hosted on Vercel for fast and scalable deployment.",
    ],
    tech: ["Next.js", "Tailwind CSS", "Framer Motion", "TypeScript"],
    stackSummary: "next.js · tailwind css · framer motion",
    live: "https://rithyreach-portfolio.vercel.app",
    code: "https://github.com/UmLyrithyreach/my-portfolio-nextjs",
    image: "/image/projects/portfolio.webp",
  },
  {
    id: "khodkquiz",
    number: "05",
    title: "KhodKquiz",
    year: "2024",
    status: "Completed",
    categories: ["Full-Stack Web Application", "School Project"],
    description: "A full-stack quiz platform built at CADT — role-based access, real-time analytics and admin management on React, Node.js and PostgreSQL.",
    shortDescription: "A full-stack quiz platform built at CADT — role-based access, real-time analytics and admin management on React, Node.js and PostgreSQL.",
    features: [
      "User Authentication & Authorization with JWT and bcrypt",
      "Real-time Analytics and Performance Tracking",
      "PostgreSQL Database Integration via Sequelize",
      "Role-based access control and administrative dashboard",
      "Responsive design with React and Tailwind CSS",
    ],
    tech: ["React", "Express.js", "PostgreSQL", "JWT", "Node.js"],
    stackSummary: "react · express · postgresql · jwt",
    code: "https://github.com/PhaySometh/KhodKquiz",
    image: "/image/projects/KhodKquiz.webp",
  },
];

export const projectCategories = Array.from(new Set(projects.flatMap((p) => p.categories)));

export interface ContactChannel {
  platform: "Telegram" | "Email" | "Discord" | "Facebook" | "Instagram";
  handle: string;
  url: string;
  description: string;
  preferred: boolean;
  badge?: "preferred" | "pref";
}

export const contactChannels: ContactChannel[] = [
  { platform: "Telegram", handle: "@Durian_Lover67", url: "https://t.me/Durian_Lover67", description: "Quick messaging", preferred: true, badge: "preferred" },
  { platform: "Email", handle: "umlyrithyreach@gmail.com", url: "mailto:umlyrithyreach@gmail.com", description: "Professional", preferred: true, badge: "preferred" },
  { platform: "Discord", handle: "kaizen0734", url: "https://discord.com/users/kaizen0734", description: "Voice & chat", preferred: false },
  { platform: "Facebook", handle: "lyrithyreach.um", url: "https://www.facebook.com/lyrithyreach.um", description: "Social updates", preferred: false },
  { platform: "Instagram", handle: "_.rithyreach._", url: "https://www.instagram.com/_.rithyreach._/", description: "Visual content", preferred: false },
];

export const socials = {
  github: "https://github.com/UmLyrithyreach",
  linkedin: "https://www.linkedin.com/in/lyrithyreach-um-848513364",
  telegram: "https://t.me/Durian_Lover67",
};

export const email = "umlyrithyreach@gmail.com";

/** Projects whose tech list names this skill (version suffixes like "React 19" still match). */
export function projectsUsing(skillName: string): Project[] {
  const key = skillName.toLowerCase();
  return projects.filter((p) =>
    p.tech.some((t) => {
      const tech = t.toLowerCase();
      return tech === key || tech.startsWith(`${key} `);
    }),
  );
}
