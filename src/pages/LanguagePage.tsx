import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { LANGUAGES } from '@/data/languages';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function LanguagePage() {
  const { setLang } = useLanguage();
  const nav = useNavigate();

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Choose your language</h1>
          <p className="mt-3 text-gray-600 dark:text-zinc-300">Apni bhasha chuniye · உங்கள் மொழியைத் தேர்ந்தெடுக்கவும் · अपनी भाषा चुनिए</p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {LANGUAGES.map((l, i) => (
            <motion.button key={l.code} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => { setLang(l.code); nav('/login'); }}
              className="group">
              <Card hover className="p-6 text-center h-full">
                <div className="text-4xl mb-3">{l.flag}</div>
                <p className="font-bold text-lg">{l.native}</p>
                <p className="text-xs text-gray-500 mt-1">{l.name}</p>
                <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Check className="h-3 w-3" /> Select
                </div>
              </Card>
            </motion.button>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button variant="ghost" onClick={() => nav('/login')}>Continue in English</Button>
        </div>
      </div>
    </div>
  );
}
