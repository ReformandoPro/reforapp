import type { ReactNode } from "react";

import { Inter, Space_Grotesk } from "next/font/google";

import { cn } from "@/components/ui/cn";

const inter = Inter({ subsets: ["latin"], variable: "--font-ui" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-num",
});

export const dynamic = "force-dynamic";

export default function ShowcaseLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className={cn(inter.variable, spaceGrotesk.variable)}>{children}</div>
  );
}

