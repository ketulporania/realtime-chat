interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-10 w-10 border-[3px]",
};

export function Spinner({ size = "md", label }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-indigo-200 border-t-indigo-600`}
        role="status"
        aria-label={label ?? "Loading"}
      />
      {label && <p className="text-sm text-slate-500">{label}</p>}
    </div>
  );
}
