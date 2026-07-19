import { Link } from 'react-router-dom';
import { Zap, Github, Twitter, Linkedin, Mail } from 'lucide-react';

export function Footer() {
  const cols = [
    { title: 'Product', links: ['Features', 'Pricing', 'Demo', 'QR Generator'] },
    { title: 'Resources', links: ['Documentation', 'API', 'Community', 'Blog'] },
    { title: 'Company', links: ['About', 'Careers', 'Contact', 'Partners'] },
    { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Cookies'] },
  ];
  return (
    <footer className="border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold">SahAI</span>
            </Link>
            <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-xs">
              Empowering every street vendor in India with AI-powered digital tools.
            </p>
            <div className="flex gap-3 mt-4">
              {[Twitter, Github, Linkedin, Mail].map((Icon, i) => (
                <a key={i} href="#" className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 hover:text-primary-600">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-sm font-semibold mb-3">{c.title}</h4>
              <ul className="space-y-2">
                {c.links.map((l) => (
                  <li key={l}><a href="#" className="text-sm text-gray-500 dark:text-zinc-400 hover:text-primary-600">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 pt-6 border-t border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row justify-between gap-4">
          <p className="text-xs text-gray-500">© 2025 SahAI. Built for Indian street vendors. Final Year B.Tech Project.</p>
          <p className="text-xs text-gray-500">Made with care in India 🇮🇳</p>
        </div>
      </div>
    </footer>
  );
}
