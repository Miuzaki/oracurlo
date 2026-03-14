import { AdminAuthProvider } from "@/contexts/admin-auth-context";

export const metadata = {
  title: "Admin - Oraculo Aviator",
  description: "Painel administrativo do Oraculo Aviator",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      {children}
    </AdminAuthProvider>
  );
}
