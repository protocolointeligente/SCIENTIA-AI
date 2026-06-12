import { Badge } from '@/components/ui/badge';

export type EvidenceStrength = 'STRONG' | 'MODERATE' | 'WEAK' | 'INSUFFICIENT' | 'CONFLICTING';

const VARIANT_BY_STRENGTH: Record<EvidenceStrength, string> = {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Badge variant={VARIANT_BY_STRENGTH[strength] as any}>{LABEL_BY_STRENGTH[strength]}</Badge>
  );
}
