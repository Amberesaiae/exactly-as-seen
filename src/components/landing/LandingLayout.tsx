import { useState, type ReactNode } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { LandingNav } from './LandingNav';
import { ScrollToTop } from './ScrollToTop';

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
      <span className="h-px w-6 bg-foreground/40" />
      {children}
    </span>
  );
}

export default function LandingLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20">
      <ScrollToTop />
      <LandingNav />

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-foreground/5 py-20 bg-background relative overflow-hidden text-foreground">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 relative z-10">
          <div className="grid gap-16 lg:grid-cols-12 mb-20">
            <div className="lg:col-span-5">
              <Link to="/welcome" className="text-2xl font-black tracking-tighter">
                LampFarms®
              </Link>
              <p className="mt-6 max-w-sm text-lg text-muted-foreground leading-relaxed">
                Precision poultry management for the modern West African farm. Rooted in tradition, powered by data.
              </p>
              <div className="mt-10 flex gap-4">
                <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background hover:bg-foreground/90 transition">
                  Get Started <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-12 text-foreground">
              <FooterCol 
                title="Platform" 
                links={[
                  { label: 'Overview', to: '/platform' },
                  { label: 'Solutions', to: '/solutions' },
                  { label: 'Impact', to: '/impact' },
                  { label: 'Resources', to: '/resources' }
                ]} 
              />
              <FooterCol 
                title="Company" 
                links={[
                  { label: 'About Us', to: '#' },
                  { label: 'Privacy Policy', to: '#' },
                  { label: 'Terms of Service', to: '#' },
                  { label: 'Contact', to: '#' }
                ]} 
              />
              <FooterCol 
                title="Social" 
                links={[
                  { label: 'Twitter/X', to: '#' },
                  { label: 'LinkedIn', to: '#' },
                  { label: 'Instagram', to: '#' }
                ]} 
              />
            </div>
          </div>

          <div className="pt-10 border-t border-foreground/5 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            <div>© {new Date().getFullYear()} LampFarms. All rights reserved.</div>
            <div className="flex gap-8">
              <span>English</span>
              <span>Français</span>
              <span>Twi</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; to: string }[] }) {
  return (
    <div>
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground mb-6">{title}</div>
      <ul className="space-y-4">
        {links.map(l => (
          <li key={l.label}>
            <Link to={l.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
