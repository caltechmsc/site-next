import { Header, Footer } from "@/components/layout";

// ============================================================================
// Public Pages Layout
// ============================================================================

interface PublicLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout wrapper for all public-facing pages.
 * Includes the site header and footer.
 */
export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
