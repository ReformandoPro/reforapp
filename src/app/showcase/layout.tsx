import type { ReactNode } from "react";

import { Inter, Space_Grotesk } from "next/font/google";

import { cn } from "@/components/ui/cn";

import "@/styles/showcase/tokens.css";
import "@/styles/showcase/foundations.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-ui" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-num",
});

export default function ShowcaseLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className={cn("showcaseScope", inter.variable, spaceGrotesk.variable)}>
      {children}
    </div>
  );
}

