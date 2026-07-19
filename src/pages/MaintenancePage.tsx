import { motion } from 'framer-motion';
import { Wrench, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Card';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}
          className="mx-auto h-20 w-20 rounded-2xl gradient-primary flex items-center justify-center mb-6">
          <Wrench className="h-10 w-10 text-white" />
        </motion.div>
        <Badge color="accent" className="mb-3">Under Maintenance</Badge>
        <h1 className="text-3xl font-bold">We'll be back soon</h1>
        <p className="mt-3 text-gray-600 dark:text-zinc-400">SahAI is getting an upgrade to serve you better. Please check back in a little while.</p>
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500">
          <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center"><Zap className="h-4 w-4 text-white" /></div>
          <span className="font-semibold">SahAI</span>
        </div>
      </div>
    </div>
  );
}
