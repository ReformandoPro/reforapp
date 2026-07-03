begin;

-- Policies are dropped automatically with table/bucket removal in most cases, but keep it simple.
drop table if exists public.project_documents;

delete from storage.buckets where id = 'project-documents';

commit;
