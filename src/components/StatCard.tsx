import { type ReactNode } from 'react';
import { Card } from './ui/Card';
import { motion } from 'framer-motion';

interface Props {
  title: string;
  value: string | number;
  delta?: string;
  deltaType?: 'up' | 'down';
  icon: ReactNode;
  color?: 'primary' | 'secondary' | 'accent';
}

const colors = {
  primary: 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300',
  secondary: 'bg-secondary-100 text-secondary-600 dark:bg-secondary-900/40 dark:text-secondary-300',
  accent: 'bg-accent-100 text-accent-600 dark:bg-accent-900/40 dark:text-accent-300',
};

export function StatCard({ title, value, delta, deltaType = 'up', icon, color = 'primary' }: Props) {
  return (
    <motion.div whileHover={{ y: -4 }}>
      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">{title}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
            {delta && (
              <p className={`mt-1 text-xs font-semibold ${deltaType === 'up' ? 'text-primary-600' : 'text-red-500'}`}>
                {deltaType === 'up' ? '↑' : '↓'} {delta}
              </p>
            )}
          </div>
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors[color]}`}>{icon}</div>
        </div>
      </Card>
    </motion.div>
  );
}
