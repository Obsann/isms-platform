export default function TellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-portal="teller">
      {children}
    </div>
  );
}
