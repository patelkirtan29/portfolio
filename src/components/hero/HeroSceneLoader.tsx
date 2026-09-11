"use client";

import dynamic from "next/dynamic";

// `next/dynamic`'s `ssr: false` is only allowed when the dynamic() call
// itself lives inside a Client Component — Next.js's App Router rejects
// it directly inside a Server Component (page.tsx is one). This file's
// sole job is to provide that client boundary so page.tsx can still
// import the hero with a single plain import, while HeroScene's actual
// bundle is still code-split and never rendered during SSR.
const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

export default HeroScene;
