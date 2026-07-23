import { useLanguage } from '@/contexts/LanguageContext';

const choices = [
  { code: 'en', label: 'EN', title: 'English' },
  { code: 'hi', label: 'हिं', title: 'हिन्दी' },
];

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="inline-flex items-center rounded-xl border border-gray-200 bg-white/90 p-1 shadow-soft backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90" role="group" aria-label="Language">
      {choices.map((choice) => (
        <button
          key={choice.code}
          type="button"
          title={choice.title}
          aria-label={`Use ${choice.title}`}
          aria-pressed={lang === choice.code}
          onClick={() => setLang(choice.code)}
          className={`min-w-10 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors ${lang === choice.code ? 'bg-primary-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}
        >
          {choice.label}
        </button>
      ))}
    </div>
  );
}
