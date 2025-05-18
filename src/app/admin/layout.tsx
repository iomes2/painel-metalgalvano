import type React from 'react';

// This layout is for the /admin route segment.
// As the admin functionality has been cancelled, this layout will simply render its children
// or can be made to render null if no admin pages are expected to be active.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
