import Link from "next/link";
import { ProjectOverviewScreen } from "@/components/screens/ProjectOverviewScreen";
import { EmptyState } from "@/components/ui/EmptyState";
import { getProjectOverview } from "@/lib/services/projects";
type ProjectDetailPageProps = {
 params: Promise<{
 id: string;
 }>;
};
export default async function ProjectDetailPage({
 params,
}: ProjectDetailPageProps) {
 const { id } = await params;
 const project = getProjectOverview(id);
 return (
 <div className="space-y-6">
 <Link
 href="/projects"
 className="inline-flex text-sm font-medium text-slate-600 hover:text-slate-900"
 >
 ← Volver a obras
 </Link>
 {project ? (
 <ProjectOverviewScreen project={project} />
 ) : (
 <EmptyState
 title="Obra no encontrada"
 description="No hemos encontrado una obra con este identificador."
 />
 )}
 </div>
 );
}
