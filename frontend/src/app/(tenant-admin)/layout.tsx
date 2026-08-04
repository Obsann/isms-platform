export default function TenantAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-portal="tenant-admin">
      {children}
    </div>
  );
}
