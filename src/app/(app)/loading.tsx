import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading workspace">
      <div>
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-3 h-8 w-2/3 max-w-lg" />
        <Skeleton className="mt-2 h-3 w-full max-w-2xl" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-40" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
        </div>
      </div>
    </div>
  );
}
