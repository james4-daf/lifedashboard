import AuthGuard from "@/components/auth-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex h-dvh flex-col overflow-hidden bg-[var(--background)]">
        {children}
      </div>
    </AuthGuard>
  );
}
