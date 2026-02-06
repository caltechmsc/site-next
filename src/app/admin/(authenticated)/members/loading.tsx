import { PageSkeleton, MemberListSkeleton } from "@/components/admin/shared";

export default function MembersLoading() {
  return (
    <PageSkeleton>
      <MemberListSkeleton />
    </PageSkeleton>
  );
}
