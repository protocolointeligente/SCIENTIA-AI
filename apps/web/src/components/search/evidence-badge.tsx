import { Badge, type BadgeProps } from '@/components/ui/badge';

export type EvidenceStrength = 'STRONG' | 'MODERATE' | 'WEAK' | 'INSUFFICIENT' | 'CONFLICTING';

type BadgeVariant = NonNullable<BadgeProps['variant']>;

const VARIANT_BY_STRENGTH: Record<EvidenceStrength, BadgeVariant> = {
  STRONG: 'evidenceStrong',
  MODERATE: 'evidenceModerate',
  WEAK: 'evidenceWeak',
  INSUFFICIENT: 'evidenceInsufficient',
  CONFLICTING: 'evidenceConflicting',
};

const LABEL_BY_STRENGTH: Record<EvidenceStrength, string> = {
  STRONG: 'Evidência forte',
  MODERATE: 'Evidência moderada',
  WEAK: 'Evidência fraca',
  INSUFFICIENT: 'Evidência insuficiente',
  CONFLICTING: 'Evidência conflitante',
};

export function EvidenceBadge({ strength }: { strength: EvidenceStrength }) {
  return (
    <Badge variant={VARIANT_BY_STRENGTH[strength]}>{LABEL_BY_STRENGTH[strength]}</Badge>
  );
}
