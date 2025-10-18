import { eventBus, DomainEvent } from '../eventBus';
import { postSlack } from '../../utils/slack';

// Approval completed -> Slack
eventBus.onEvent('approval.completed', async (evt: DomainEvent<any>) => {
  const d = evt.payload || {};
  const msg = `Customer approval ${d.decision?.toUpperCase()} for project ${d.projectId}` + (d.quoteId ? ` (quote ${d.quoteId})` : '') + (d.orderId ? ` (order ${d.orderId})` : '');
  await postSlack(msg);
});

// Invoice sent -> Slack
eventBus.onEvent('invoice.sent', async (evt: DomainEvent<any>) => {
  const d = evt.payload || {};
  const msg = `Invoice ${d.number || d.id} sent for project ${d.projectId}`;
  await postSlack(msg);
});

// Invoice paid -> Slack
eventBus.onEvent('invoice.paid', async (evt: DomainEvent<any>) => {
  const d = evt.payload || {};
  const msg = `Invoice ${d.number || d.id} PAID for project ${d.projectId}`;
  await postSlack(msg);
});
