import { badgeVariants } from '@shared/ui/badge';
import { buttonVariants } from '@shared/ui/button';
import { panelVariants } from '@shared/ui/panel';

describe('Quiet ERP primitive variants', () => {
  it('uses ui semantic tokens for buttons', () => {
    expect(buttonVariants({ variant: 'default' })).toContain('--ui-accent');
    expect(buttonVariants({ variant: 'destructive' })).toContain('--ui-danger-fill');
    expect(buttonVariants({ variant: 'secondary' })).toContain('--ui-surface-subtle');
  });

  it('uses ui semantic tokens for badges', () => {
    expect(badgeVariants({ variant: 'success' })).toContain('--ui-success-bg');
    expect(badgeVariants({ variant: 'warning' })).toContain('--ui-warning-bg');
    expect(badgeVariants({ variant: 'danger' })).toContain('--ui-danger-bg');
    expect(badgeVariants({ variant: 'info' })).toContain('--ui-info-bg');
  });

  it('uses ui semantic tokens for panels', () => {
    expect(panelVariants({ variant: 'base' })).toContain('--ui-surface');
    expect(panelVariants({ variant: 'selected' })).toContain('--ui-surface-selected');
    expect(panelVariants({ variant: 'raised' })).toContain('--ui-shadow-raised');
  });
});

