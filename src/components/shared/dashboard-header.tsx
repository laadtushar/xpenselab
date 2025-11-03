import { SidebarTrigger } from "@/components/ui/sidebar";

type DashboardHeaderProps = {
  title: string;
  children?: React.ReactNode;
};

export function DashboardHeader({ title, children }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <h1 className="text-2xl font-bold font-headline tracking-tight sm:text-3xl">
          {title}
        </h1>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:justify-end">
        {children}
      </div>
    </div>
  );
}
