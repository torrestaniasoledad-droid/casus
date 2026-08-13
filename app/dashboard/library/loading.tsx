import { Skeleton } from "@/components/ui/Skeleton";

export default function LibraryLoading() {
  return (
    <div className="max-w-4xl">
      <Skeleton className="h-8 w-40 mb-6" />
      <Skeleton className="h-10 w-72 mb-5" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}
