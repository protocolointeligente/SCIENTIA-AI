import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'text-foreground',
        evidenceStrong: 'border-transparent bg-evidence-strong/15 text-evidence-strong',
        evidenceModerate: 'border-transparent bg-evidence-moderate/15 text-evidence-moderate',
        evidenceWeak: 'border-transparent bg-evidence-weak/15 text-evidence-weak',
        evidenceInsufficient: 'border-transparent bg-evidence-insufficient/15 text-evidence-insufficient',
        evidenceConflicting: 'border-transparent bg-evidence-conflicting/15 text-evidence-conflicting',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
