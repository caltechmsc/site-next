import { PageSkeleton, AdminListSkeleton } from "@/components/admin/shared";

export default function AdminsLoading() {
  return (
    <PageSkeleton>
      <AdminListSkeleton />
    </PageSkeleton>
  );
}
