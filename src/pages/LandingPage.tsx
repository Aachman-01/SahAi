import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Play, Sparkles, Bot, UserCircle, QrCode, Globe,
  Landmark, Megaphone, BarChart3, Star, MapPin, Smartphone, TrendingUp,
  MessageCircle, Download, ShoppingBag, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, Badge } from '@/components/ui/Card';
import { useCountUp } from '@/hooks/useCountUp';

const features = [
  { icon: Bot, title: 'AI Assistant', desc: 'Chat in your language to build your entire digital business in minutes.', color: 'from-primary-500 to-primary-600' },
  { icon: UserCircle, title: 'Business Profile', desc: 'Auto-generated profile with photos, hours, location & category.', color: 'from-secondary-500 to-secondary-600' },
  { icon: QrCode, title: 'QR Payments', desc: 'Professional UPI QR codes with your logo, ready to print & share.', color: 'from-accent-500 to-accent-600' },
  { icon: Globe, title: 'Mini Website', desc: 'A beautiful storefront at yourdomain.com/vendor/your-name.', color: 'from-primary-500 to-secondary-500' },
  { icon: Landmark, title: 'Govt Schemes', desc: 'AI matches you to PM SVANidhi, Mudra, MSME & more with eligibility.', color: 'from-secondary-500 to-accent-500' },
  { icon: Megaphone, title: 'Marketing Kit', desc: 'Instagram posts, festival posters, WhatsApp status — all generated.', color: 'from-accent-500 to-primary-500' },
  { icon: BarChart3, title: 'Analytics', desc: 'Track payments, visitors, QR scans & popular products in real time.', color: 'from-primary-500 to-secondary-600' },
];

const stats = [
  { value: 20, suffix: 'M+', label: 'Street Vendors in India' },
  { value: 50, suffix: 'M+', label: 'Monthly UPI Payments' },
  { value: 95, suffix: '%', label: 'Smartphone Users' },
  { value: 9, suffix: '', label: 'Languages Supported' },
];

const steps = [
  { icon: MessageCircle, title: 'Talk with AI', desc: 'Tell the AI assistant about your business in your own language.' },
  { icon: Sparkles, title: 'AI Builds Your Business', desc: 'Profile, website, QR, products & marketing — all generated.' },
  { icon: Download, title: 'Download Your QR', desc: 'Get a print-ready QR poster and share your website link.' },
  { icon: ShoppingBag, title: 'Start Selling', desc: 'Accept UPI payments, get discovered, and grow with analytics.' },
];

const testimonials = [
  { name: 'Rahul Kumar', role: 'Fruit Vendor, Lucknow', text: 'I got my QR and website in 10 minutes. My sales doubled in 2 months!', rating: 5 },
  { name: 'Sai Prasad', role: 'Tea Stall, Delhi', text: 'The AI spoke Hindi and understood everything. Government scheme help was a bonus.', rating: 5 },
  { name: 'Lakshmi N.', role: 'Florist, Mysuru', text: 'Customers now find me on Google Maps. The marketing posters are beautiful.', rating: 4 },
];

const faqs = [
  { q: 'Is SahAI free for street vendors?', a: 'Yes, the core features — profile, QR, website & scheme matching — are free forever for individual vendors.' },
  { q: 'Do I need a smartphone to use it?', a: 'A basic smartphone with internet is enough. The AI works over WhatsApp-style chat in 9 Indian languages.' },
  { q: 'How does the AI generate my business?', a: 'You chat with the AI in your language. It asks for your name, UPI, location and category, then builds everything automatically.' },
  { q: 'Can I accept UPI payments?', a: 'Yes. We generate a professional QR code with your logo that you can print as a poster or standee.' },
  { q: 'Which government schemes are covered?', a: 'PM SVANidhi, Mudra Loan, MSME Udyam, Stand-Up India, PM Vishwakarma and more — with eligibility checks.' },
];

function Stat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { value: v, ref } = useCountUp(value);
  return (
    <div ref={ref} className="text-center">
      <p className="text-3xl sm:text-4xl font-extrabold gradient-text">{v}{suffix}</p>
      <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">{label}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="relative gradient-hero">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-24 lg:pt-24 lg:pb-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge color="primary" className="mb-5">
                <Sparkles className="h-3 w-3" /> AI-Powered Digitalization
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]">
                Empowering Every <span className="gradient-text">Street Vendor</span> Digitally
              </h1>
              <p className="mt-6 text-lg text-gray-600 dark:text-zinc-300 max-w-xl leading-relaxed">
                AI-powered assistant that creates your business profile, payment QR, website, marketing materials and government scheme recommendations within minutes.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/language"><Button size="lg">Get Started <ArrowRight className="h-4 w-4" /></Button></Link>
                <Button variant="outline" size="lg"><Play className="h-4 w-4" /> Watch Demo</Button>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-1.5"><Star className="h-4 w-4 fill-accent-500 text-accent-500" /> 4.8/5 rating</div>
                <div className="flex items-center gap-1.5"><Smartphone className="h-4 w-4 text-primary-600" /> Works on any phone</div>
                <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-secondary-600" /> Pan-India</div>
              </div>
            </motion.div>

            {/* Hero illustration */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }}
              className="relative hidden lg:block">
              <div className="relative aspect-square max-w-md mx-auto">
                <div className="absolute inset-0 rounded-[2.5rem] gradient-primary opacity-10 blur-3xl" />
                <Card className="relative p-6 animate-float">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center"><Bot className="h-5 w-5 text-white" /></div>
                    <div><p className="text-sm font-semibold">SahAI Assistant</p><p className="text-xs text-gray-500">Online</p></div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-primary-50 dark:bg-primary-900/30 rounded-2xl rounded-tl-sm p-3 text-sm max-w-[80%]">
                      "I sell tea in Lucknow near Hazratganj."
                    </div>
                    <div className="bg-gray-100 dark:bg-zinc-800 rounded-2xl rounded-tr-sm p-3 text-sm max-w-[80%] ml-auto">
                      Great! Let's build your digital business. What's your business name?
                    </div>
                    <div className="flex gap-2">
                      <Badge color="accent">QR Generated</Badge>
                      <Badge color="secondary">Website Live</Badge>
                      <Badge color="primary">3 Schemes Found</Badge>
                    </div>
                  </div>
                </Card>
                <motion.div className="absolute -top-4 -right-4" animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                  <Card className="p-3 flex items-center gap-2 shadow-float">
                    <QrCode className="h-6 w-6 text-primary-600" />
                    <span className="text-xs font-semibold">UPI Ready</span>
                  </Card>
                </motion.div>
                <motion.div className="absolute -bottom-4 -left-4" animate={{ y: [0, 10, 0] }} transition={{ duration: 3.5, repeat: Infinity }}>
                  <Card className="p-3 flex items-center gap-2 shadow-float">
                    <TrendingUp className="h-6 w-6 text-secondary-600" />
                    <span className="text-xs font-semibold">+42% Sales</span>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s) => <Stat key={s.label} {...s} />)}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge color="primary" className="mb-3">Features</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Everything a vendor needs, in one place</h2>
            <p className="mt-4 text-gray-600 dark:text-zinc-300">From your first QR code to a full digital storefront — powered by AI.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <Card hover className="p-6 h-full">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4`}>
                    <f.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-1.5">{f.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">{f.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-20 bg-white dark:bg-zinc-950 border-y border-gray-100 dark:border-zinc-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge color="secondary" className="mb-3">How it Works</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">From chat to checkout in 4 steps</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6 relative">
            {steps.map((s, i) => (
              <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="relative text-center">
                  <div className="mx-auto h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mb-4 shadow-soft">
                    <s.icon className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-xs font-bold text-primary-600 mb-1">STEP {i + 1}</div>
                  <h3 className="font-bold mb-1.5">{s.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">{s.desc}</p>
                  {i < steps.length - 1 && <ChevronDown className="hidden md:block absolute top-6 -right-3 h-5 w-5 text-gray-300 rotate-[-90deg]" />}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge color="accent" className="mb-3">Testimonials</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Loved by vendors across India</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="p-6 h-full">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className={`h-4 w-4 ${j < t.rating ? 'fill-accent-500 text-accent-500' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-zinc-300 mb-4 leading-relaxed">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-white flex items-center justify-center font-bold">{t.name[0]}</div>
                    <div><p className="text-sm font-semibold">{t.name}</p><p className="text-xs text-gray-500">{t.role}</p></div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white dark:bg-zinc-950 border-y border-gray-100 dark:border-zinc-800">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge color="primary" className="mb-3">FAQ</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <details key={i} className="group card p-5 cursor-pointer">
                <summary className="flex items-center justify-between font-semibold list-none">
                  {f.q}
                  <ChevronDown className="h-5 w-5 text-gray-400 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="mt-3 text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl gradient-primary p-10 sm:p-16 text-center text-white shadow-float">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to grow your business?</h2>
              <p className="text-white/90 max-w-xl mx-auto mb-8">Join thousands of vendors going digital with SahAI. It's free, fast, and built for you.</p>
              <Link to="/language"><Button variant="outline" size="lg" className="bg-white text-primary-700 hover:bg-gray-50 border-0">Get Started Free <ArrowRight className="h-4 w-4" /></Button></Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
