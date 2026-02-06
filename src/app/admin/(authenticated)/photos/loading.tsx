import { PageSkeleton, PhotoGridSkeleton } from "@/components/admin/shared";

export default function PhotosLoading() {
  return (
    <PageSkeleton>
      <PhotoGridSkeleton />
    </PageSkeleton>
  );
}
