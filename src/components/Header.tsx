'use client';

import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useCouncil } from '@/context/CouncilContext';
import FeatureRequestDialog from '@/components/FeatureRequestDialog';

export default function Header() {
  const { setSelectedCouncil } = useCouncil();

  const handleLogoClick = () => {
    setSelectedCouncil(null);
  };

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-3 py-3 sm:px-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <Link href="/" onClick={handleLogoClick} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">CA</span>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold leading-tight">CivAccount</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">UK Council Budget Dashboard</p>
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="/updates">
              <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted">
                v1.2
              </Badge>
            </Link>
            <FeatureRequestDialog />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
