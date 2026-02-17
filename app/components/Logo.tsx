import Link from "next/link";

function BarChartIcon({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg bg-primary-light text-primary ${className}`}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-[60%] w-[60%]"
      >
        <path
          d="M7 14v4M11 10v8M15 6v12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

type LogoProps = {
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
};

export function Logo({
  showText = true,
  size = "md",
  href,
  className = "",
}: LogoProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  };
  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  const content = (
    <>
      <BarChartIcon
        className={`${sizeClasses[size]} shrink-0 text-primary`}
        aria-hidden
      />
      {showText && (
        <span
          className={`font-bold tracking-tight text-zinc-900 dark:text-zinc-50 ${textSizes[size]} ${!href ? "" : "ml-2"}`}
        >
          Spending Tracker
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`flex items-center ${className}`}
        aria-label="Spending Tracker home"
      >
        {content}
      </Link>
    );
  }

  return <div className={`flex items-center ${className}`}>{content}</div>;
}
