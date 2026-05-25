import CalendarMonth from "@/components/calendar-month";
import ProjectsSidebar from "@/components/projects-sidebar";

export default function CalendarPage() {
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="hidden w-64 shrink-0 md:block">
        <ProjectsSidebar />
      </div>
      <main className="panel-content mx-auto w-full max-w-3xl flex-1 overflow-y-auto">
        <p className="panel-breadcrumb">Calendar</p>
        <h1 className="panel-title">Calendar</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          See what is due and jump straight into the project that owns it.
        </p>
        <div className="mt-8">
          <CalendarMonth />
        </div>
      </main>
    </div>
  );
}
