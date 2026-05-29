import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navLinks = [
  { name: 'Platform',  to: '/platform'  },
  { name: 'Solutions', to: '/solutions' },
  { name: 'Resources', to: '/resources' },
  { name: 'Impact',    to: '/impact'    },
];

export function LandingNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 z-50 w-full transition-all duration-500 ${
      isScrolled ? 'bg-background/80 backdrop-blur-xl border-b border-foreground/5 py-3' : 'bg-background/50 backdrop-blur-sm py-6'
    }`}>
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10 flex items-center justify-between">
        {/* Left: Wordmark */}
        <Link to="/welcome" className="text-2xl font-black tracking-tighter text-foreground hover:opacity-80 transition-opacity">
          LampFarms®
        </Link>

        {/* Center: Desktop Nav — Pill style NavLinks */}
        <div className="hidden md:flex items-center gap-1 bg-secondary/30 p-1 rounded-full border border-foreground/5 backdrop-blur-md">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.to}
              className={({ isActive }) => 
                `px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all rounded-full ${
                  isActive 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/login" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors">
            Sign in
          </Link>
          <Button asChild className="rounded-full px-8 py-6 h-auto bg-foreground text-background hover:bg-foreground/90 font-bold uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-foreground/10 transition-transform active:scale-95">
            <Link to="/register">Get started</Link>
          </Button>
        </div>

        {/* Mobile: Hamburger */}
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[400px] bg-background/95 backdrop-blur-2xl border-l border-foreground/5">
              <div className="flex flex-col gap-8 mt-12 px-4">
                <Link to="/welcome" className="text-3xl font-black tracking-tighter mb-4" onClick={() => setIsOpen(false)}>
                  LampFarms®
                </Link>
                <div className="flex flex-col gap-6">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      to={link.to}
                      onClick={() => setIsOpen(false)}
                      className="text-4xl font-black tracking-tight text-foreground/40 hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
                <div className="mt-12 flex flex-col gap-4">
                  <Link to="/login" className="text-xl font-bold text-muted-foreground px-2" onClick={() => setIsOpen(false)}>
                    Sign in
                  </Link>
                  <Button asChild className="rounded-2xl w-full py-8 text-xl font-black bg-foreground text-background">
                    <Link to="/register" onClick={() => setIsOpen(false)}>
                      Get started
                    </Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
