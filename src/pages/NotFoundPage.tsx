import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4">
      <div className="text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="mx-auto h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mb-6">
          <Zap className="h-8 w-8 text-white" />
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="text-7xl sm:text-9xl font-extrabold gradient-text">404</motion.h1>
        <p className="mt-4 text-xl font-bold">Page not found</p>
        <p className="mt-2 text-gray-500 dark:text-zinc-400 max-w-md mx-auto">The page you're looking for doesn't exist or has been moved.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/"><Button><Home className="h-4 w-4" /> Go Home</Button></Link>
          <Button variant="outline" onClick={() => history.back()}><ArrowLeft className="h-4 w-4" /> Go Back</Button>
        </div>
      </div>
    </div>
  );
}
