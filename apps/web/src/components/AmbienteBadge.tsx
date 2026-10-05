import { FlaskConical, Server, type LucideIcon } from 'lucide-react';
import type { Ambiente } from '@serigy/shared';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Identificação visual do ambiente do endereço, usada em toda a interface:
 * produção = verde com ícone de servidor; desenvolvimento = âmbar com ícone de frasco.
 */
export const AMBIENTE_TONE: Record<
  Ambiente,
  { label: string; icon: LucideIcon; badge: string; banner: string; stripe: string }
> = {
  producao: {
    label: 'Produção',
    icon: Server,
    badge: 'border-emerald-300 bg-emerald-100 text-emerald-800',
    banner: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    stripe: 'border-l-emerald-500',
  },
  desenvolvimento: {
    label: 'Desenvolvimento',
    icon: FlaskConical,
    badge: 'border-amber-300 bg-amber-100 text-amber-900',
    banner: 'border-amber-300 bg-amber-50 text-amber-900',
    stripe: 'border-l-amber-500',
  },
};

export function AmbienteBadge({ ambiente, className }: { ambiente: Ambiente; className?: string }) {
  const tone = AMBIENTE_TONE[ambiente];
  const Icon = tone.icon;
  return (
    <Badge variant="outline" className={cn('gap-1', tone.badge, className)}>
      <Icon className="size-3" />
      {tone.label}
    </Badge>
  );
}
