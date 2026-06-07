import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonIndicadores({ colunas = 4 }: { colunas?: number }) {
  return (
    <Card>
      <CardContent className={`grid gap-4 p-4 grid-cols-2 sm:grid-cols-${colunas}`}>
        {Array.from({ length: colunas }).map((_, i) => (
          <div key={i} className="grid gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function SkeletonSection({ linhas = 3 }: { linhas?: number }) {
  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <div className="grid gap-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        {Array.from({ length: linhas }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border p-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="flex-1 grid gap-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function SkeletonLista({ itens = 5 }: { itens?: number }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: itens }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border bg-background/80 p-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1 grid gap-1.5">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonPagina() {
  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-48" />
      </div>
      <SkeletonIndicadores />
      <SkeletonSection />
      <SkeletonSection linhas={4} />
    </div>
  );
}
