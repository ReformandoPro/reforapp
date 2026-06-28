import { notFound } from "next/navigation";

import { ShowcaseProjectScreen } from "@/components/screens/showcase/ShowcaseProjectScreen";
import { getShowcaseProjectBySlug } from "@/lib/showcase/projects";

export const dynamic = "force-dynamic";

type ShowcaseProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ShowcaseProjectPage({
  params,
}: ShowcaseProjectPageProps) {
  const { slug } = await params;
  const project = getShowcaseProjectBySlug(slug);

  if (!project) notFound();

  return <ShowcaseProjectScreen project={project} variant="page" />;
}

