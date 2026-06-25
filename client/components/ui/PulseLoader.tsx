import { APP_NAME } from "@/lib/brand";

interface PulseLoaderProps {
  message?: string;
  size?: "md" | "lg";
}

const ringSizes = {
  md: "h-16 w-16 border-[3px]",
  lg: "h-20 w-20 border-[3px]",
};

const textSizes = {
  md: "text-xs",
  lg: "text-sm",
};

export function PulseLoader({ message, size = "lg" }: PulseLoaderProps) {
  return (
    <div
      className="flex flex-col items-center gap-4"
      role="status"
      aria-live="polite"
      aria-label={message ?? `Loading ${APP_NAME}`}
    >
      <div
        className={`relative flex items-center justify-center ${size === "lg" ? "h-20 w-20" : "h-16 w-16"}`}
      >
        <div
          className={`absolute inset-0 animate-spin rounded-full border-indigo-200 border-t-indigo-600 ${ringSizes[size]}`}
        />
        <div
          className={`absolute inset-1 animate-spin rounded-full border-indigo-100 border-b-indigo-400 opacity-60 [animation-direction:reverse] [animation-duration:1.4s] ${size === "lg" ? "border-2" : "border-[1.5px]"}`}
        />
        <span
          className={`relative font-bold tracking-tight text-indigo-600 ${textSizes[size]}`}
        >
          {APP_NAME}
        </span>
      </div>
      {message && (
        <p className="text-sm text-slate-500">{message}</p>
      )}
    </div>
  );
}
