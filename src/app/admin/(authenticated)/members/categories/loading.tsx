import { PageSkeleton, ListSkeleton } from "@/components/admin/shared";

export default function CategoriesLoading() {
  return (
    <PageSkeleton>
      <ListSkeleton count={4} />
    </PageSkeleton>
  );
}
