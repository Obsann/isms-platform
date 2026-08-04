export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-portal="super-admin">
      {children}
    </div>
  );
}
