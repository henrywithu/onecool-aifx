import { cn } from "@/lib/utils";

type HeaderProps = React.HTMLAttributes<HTMLDivElement>;

export function Header({ className, children, ...props }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm",
        className
      )}
      {...props}
    >
      {children}
    </header>
  );
}
