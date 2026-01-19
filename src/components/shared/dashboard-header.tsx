import { SidebarTrigger } from "@/components/ui/sidebar";

type DashboardHeaderProps = {
  title: string;
  children?: React.ReactNode;
};

export function DashboardHeader({ title, children }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full min-w-0 max-w-full">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <SidebarTrigger className="md:hidden shrink-0" />
        <h1 className="text-2xl font-bold font-headline tracking-tight sm:text-3xl truncate min-w-0">
          {title}
        </h1>
      </div>
      {children && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:justify-end shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}
