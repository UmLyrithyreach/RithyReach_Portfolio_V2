// The projects in the Works section (components/sections/Works.tsx), newest first.
// Sources: the CV (Um_Lyrithyreach-CV.pdf) for WiFiGuard, Velotolouse, VelousCambo, Samki and
// Automata, where "did" is what I did on a team; lib/data.ts for ASIP and KhodKquiz, where the
// points say what the project does. Links come from lib/data.ts and my GitHub.
//
// Screenshots: `shot` is optional. A web project's screenshot is shown whole in a browser-width
// frame; a mobile app's goes in a phone frame. To add one, put the image in public/image/projects/
// and set `shot` with its pixel size. Without one, the project is shown as text only.

export type WorkPlatform = "Web" | "Mobile" | "Web and mobile";

export interface Work {
  id: string;
  title: string;
  /** One plain line on what it is. */
  summary: string;
  /** Who it was for: course, team or own project. */
  context: string;
  date: string;
  platform: WorkPlatform;
  stack: string[];
  /** "did" = my part on the project (from the CV); "does" = what the project does. */
  pointsAre: "did" | "does";
  points: string[];
  shot?: { src: string; width: number; height: number; kind: "screen" | "phone" };
  live?: string;
  code?: string;
}

export const works: Work[] = [
  {
    id: "wifiguard",
    title: "WiFiGuard",
    summary: "A Flutter app that scans nearby Wi-Fi networks and lets people review them.",
    context: "Team final project",
    date: "July 2026",
    platform: "Mobile",
    stack: ["Flutter", "Firebase", "Provider", "GitHub Actions"],
    pointsAre: "did",
    points: [
      "Set up GitHub Actions CI to build the Android APK and iOS IPA automatically",
      "Fixed the Firebase and iOS build configuration",
      "Restored Wi-Fi scanning on Android",
    ],
    code: "https://github.com/UmLyrithyreach/Flutter_FinalProject_WiFiGaurd",
  },
  {
    id: "velotolouse",
    title: "Velotolouse",
    summary: "A pay-as-you-go bike-sharing app.",
    context: "Advanced App Development course",
    date: "April 2026",
    platform: "Mobile",
    stack: ["Flutter", "MVVM", "Provider", "Firebase"],
    pointsAre: "did",
    points: [
      "Built the app in Flutter with MVVM and Provider",
      "Implemented sign-in, a bike map and trip history on Firebase Realtime Database over REST",
      "Split the code into data, logic and UI layers, and defended the design in the final presentation",
    ],
    code: "https://github.com/UmLyrithyreach/velotolouse",
  },
  {
    id: "velouscambo",
    title: "VelousCambo",
    summary: "A bike-sharing app with a live map of stations.",
    context: "Team project",
    date: "April 2026",
    platform: "Mobile",
    stack: ["Flutter", "Firebase", "Google Maps", "Provider"],
    pointsAre: "did",
    points: [
      "Set up the Flutter and Firebase project and built the data layer: models, DTOs, services and repositories",
      "Built the Google Maps home screen with station markers, a station detail sheet and search",
      "Added the app shell: bottom navigation, shared components and an animated splash screen",
    ],
    code: "https://github.com/UmLyrithyreach/VelousCambo",
  },
  {
    id: "samki-digital-market",
    title: "Samki Digital Market",
    summary: "An e-commerce platform for small Cambodian businesses, on the web and on phones.",
    context: "Capstone II project",
    date: "March 2026",
    platform: "Web and mobile",
    stack: ["Next.js", "Sanity CMS", "Clerk", "Stripe", "Bakong KHQR", "Flutter"],
    pointsAre: "did",
    points: [
      "Researched what Cambodian MSMEs need and designed the system with UML, sequence and use case diagrams",
      "Worked on the full-stack store: Next.js, Sanity CMS, Clerk, Stripe and Bakong KHQR",
      "Built the Flutter mobile version with search and filters, a cart, and EN/KH and USD/KHR toggles",
    ],
    shot: { src: "/image/projects/capstone.webp", width: 1600, height: 916, kind: "screen" },
    live: "https://full-stack-ecommerce-tb3i.vercel.app",
    code: "https://github.com/YongVuthivathnakk/samki-digital-market-next-app",
  },
  {
    id: "automata-simulation",
    title: "Automata Simulator",
    summary: "A web app to build and test DFAs and NFAs.",
    context: "School team project",
    date: "July 2025",
    platform: "Web",
    stack: ["React", "Node.js", "Express", "C++"],
    pointsAre: "did",
    points: [
      "Built the C++ engine for DFA and NFA validation, string testing and DFA minimization",
      "Worked on the React (Vite) front end and the Node and Express back end",
      "Fixed input-handling bugs and wrote the project documentation",
    ],
    shot: { src: "/image/projects/automata-project.webp", width: 1600, height: 1000, kind: "screen" },
    live: "https://automata-fawn.vercel.app",
    code: "https://github.com/ShurikenBy6YoungTechStudents/automata-project",
  },
  {
    id: "asip-redesign",
    title: "ASIP Redesign",
    summary: "A redesign of the Angkor Social Innovation Park website.",
    context: "Own project, in progress",
    date: "2024",
    platform: "Web",
    stack: ["Next.js", "React", "GSAP", "Lenis", "Tailwind CSS"],
    pointsAre: "does",
    points: [
      "An interactive SVG of Angkor Wat",
      "Parallax galleries driven by GSAP ScrollTrigger",
      "Smooth scrolling with Lenis",
    ],
    shot: { src: "/image/projects/asipredesign.webp", width: 1600, height: 894, kind: "screen" },
    live: "https://asip-redesign-eyca.vercel.app/",
  },
  {
    id: "khodkquiz",
    title: "KhodKquiz",
    summary: "A quiz platform for coding practice.",
    context: "School team project",
    date: "2024",
    platform: "Web",
    stack: ["React", "Node.js", "Express", "PostgreSQL", "JWT"],
    pointsAre: "does",
    points: [
      "Sign-in with JWT, and role-based access for users and admins",
      "Score tracking and analytics",
      "An admin dashboard to manage quizzes",
    ],
    shot: { src: "/image/projects/KhodKquiz.webp", width: 1600, height: 1000, kind: "screen" },
    code: "https://github.com/PhaySometh/KhodKquiz",
  },
];
