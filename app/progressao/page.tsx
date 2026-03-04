import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProgressaoContent } from "@/components/progressao-content";

export default function ProgressaoPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background noise-overlay">
      <SiteHeader />
      <main className="flex-1">
        <ProgressaoContent />
      </main>
      <SiteFooter />
    </div>
  );
}
