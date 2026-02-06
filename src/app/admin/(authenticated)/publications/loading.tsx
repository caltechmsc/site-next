import {
  PageSkeleton,
  PublicationListSkeleton,
} from "@/components/admin/shared";

export default function PublicationsLoading() {
  return (
    <PageSkeleton>
      <PublicationListSkeleton />
    </PageSkeleton>
  );
}
