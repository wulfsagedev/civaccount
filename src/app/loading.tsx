export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground/20 mx-auto mb-4" />
        <p className="text-muted-foreground type-body-sm">Loading...</p>
      </div>
    </div>
  );
}
