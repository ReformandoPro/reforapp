export type ShowcaseTone = "primary" | "success" | "warning" | "danger" | "neutral";

export type ShowcaseProject = {
  slug: string;
  title: string;
  subtitle: string;
  location: string;
  status: {
    label: string;
    tone: ShowcaseTone;
  };
  hero: {
    eyebrow: string;
    headline: string;
    description: string;
    ctaLabel: string;
  };
  metrics: Array<{
    label: string;
    value: string;
    helper?: string;
    tone?: ShowcaseTone;
  }>;
  progress: {
    label: string;
    value: number;
    helper?: string;
  };
  budget: {
    estimated: string;
    spent: string;
    remaining: string;
    deviationLabel: string;
    deviationTone: Exclude<ShowcaseTone, "primary">;
  };
  guilds: Array<{
    name: string;
    statusLabel: string;
    tone?: ShowcaseTone;
  }>;
  timeline: Array<{
    title: string;
    date: string;
    description: string;
    status: "done" | "current" | "pending";
  }>;
  highlights: Array<{
    title: string;
    description: string;
  }>;
};

