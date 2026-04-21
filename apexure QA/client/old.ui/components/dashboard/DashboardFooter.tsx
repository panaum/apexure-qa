import { Mail, Phone } from "lucide-react";

export const DashboardFooter = () => {
  return (
    <footer className="glass-card-static rounded-none border-x-0 border-b-0 mt-16">
      <div className="container mx-auto px-6 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <h4 className="font-display font-bold text-foreground text-base">Contact</h4>
            <div className="space-y-2.5 text-sm text-muted-foreground font-medium">
              <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> +1 (555) 123-4567</p>
              <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> hello@designintegrity.io</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-display font-bold text-foreground text-base">Links</h4>
            <div className="space-y-2.5 text-sm">
              <a href="#" className="block text-primary hover:text-primary/70 transition-colors font-semibold">Terms and Conditions</a>
              <a href="#" className="block text-primary hover:text-primary/70 transition-colors font-semibold">Privacy Policy</a>
            </div>
          </div>

          <div className="flex items-end">
            <p className="text-sm text-muted-foreground font-medium">© 2026 Design Integrity Monitor. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
