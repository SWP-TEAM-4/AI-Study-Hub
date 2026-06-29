export function ButtonSpinner({ className = "" }: { className?: string }) {
  return (
    <div className={`size-4 border-2 border-current border-t-transparent rounded-full animate-spin ${className}`} />
  );
}
