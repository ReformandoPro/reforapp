import type { Metadata } from "next";

import { notFound } from "next/navigation";

import { ShowcaseProjectScreen } from "@/components/screens/showcase/ShowcaseProjectScreen";
import { getShowcaseProjectBySlug } from "@/lib/showcase/projects";

type ShowcaseProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  props: ShowcaseProjectPageProps
): Promise<Metadata> {
  const { slug } = await props.params;
  const project = getShowcaseProjectBySlug(slug);

  if (!project) {
    return {
      title: "Showcase · Proyecto",
    };
  }

  return {
    title: `Showcase · ${project.title}`,
    description: project.hero.description,
  };
}

export default async function ShowcaseProjectPage({
  params,
}: ShowcaseProjectPageProps) {
  const { slug } = await params;
  const project = getShowcaseProjectBySlug(slug);

  if (!project) notFound();

  return <ShowcaseProjectScreen project={project} variant="page" />;
}

