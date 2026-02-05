import {
  PageSkeleton,
  CollaboratorListSkeleton,
} from "@/components/admin/shared";

export default function CollaboratorsLoading() {
  return (
    <PageSkeleton>
      <CollaboratorListSkeleton />
    </PageSkeleton>
  );
}
