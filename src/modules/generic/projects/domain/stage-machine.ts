import type { Project, ProjectStage } from './project.entity';

export const PROJECT_STAGES: ProjectStage[] = ['details', 'ordered', 'arrived', 'in_progress', 'completed'];

export const PROJECT_STAGE_LABELS: Record<ProjectStage, string> = {
  details: 'Uppgifter',
  ordered: 'Beställt',
  arrived: 'Ankommet',
  in_progress: 'Pågår',
  completed: 'Klart',
};

export function nextProjectStage(stage: ProjectStage): ProjectStage | null {
  const index = PROJECT_STAGES.indexOf(stage);
  return index >= 0 && index < PROJECT_STAGES.length - 1 ? PROJECT_STAGES[index + 1] : null;
}

export function validateStageTransition(project: Project, toStage: ProjectStage): string | null {
  const next = nextProjectStage(project.stage);
  if (!next || next !== toStage) return 'Projekt kan bara flyttas ett steg framåt i taget.';

  const purchaseOrders = project.purchaseOrders ?? [];
  const activePurchaseOrders = purchaseOrders.filter((po) => po.status !== 'cancelled');

  if (project.stage === 'details' && toStage === 'ordered') {
    const hasSubmittedPo = activePurchaseOrders.some((po) => po.status === 'submitted' || po.status === 'received');
    if (!hasSubmittedPo) return 'Skapa och skicka minst en inköpsorder innan projektet kan markeras som beställt.';
  }

  if (project.stage === 'ordered' && toStage === 'arrived') {
    if (activePurchaseOrders.length === 0) return 'Projektet saknar inköpsorder.';
    const allReceived = activePurchaseOrders.every((po) =>
      po.status === 'received' &&
      (po.lineItems ?? []).every((item) => item.receivedQuantity >= item.quantity)
    );
    if (!allReceived) return 'Alla aktiva inköpsorder måste vara mottagna innan projektet kan markeras som ankommet.';
  }

  if (project.stage === 'in_progress' && toStage === 'completed') {
    const unresolvedPOs = activePurchaseOrders.filter((po) => po.status !== 'received');
    if (unresolvedPOs.length > 0) {
      return 'Alla aktiva inköpsorder måste vara mottagna innan projektet kan avslutas.';
    }
  }

  return null;
}
