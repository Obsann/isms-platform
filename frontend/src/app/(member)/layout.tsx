export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-portal="member">
      {children}
    </div>
  );
}
