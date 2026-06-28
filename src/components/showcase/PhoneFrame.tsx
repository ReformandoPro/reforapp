import type { ReactNode } from "react";

import { cn } from "@/components/ui/cn";

import styles from "./PhoneFrame.module.css";

type PhoneFrameProps = {
  children: ReactNode;
  className?: string;
};

export function PhoneFrame({ children, className }: PhoneFrameProps) {
  return (
    <div className={cn(styles.phone, className)}>
      <div className={styles.pbody}>{children}</div>
    </div>
  );
}

