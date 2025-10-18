"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const eventBus_1 = require("../eventBus");
const slack_1 = require("../../utils/slack");
// Approval completed -> Slack
eventBus_1.eventBus.onEvent('approval.completed', async (evt) => {
    const d = evt.payload || {};
    const msg = `Customer approval ${d.decision?.toUpperCase()} for project ${d.projectId}` + (d.quoteId ? ` (quote ${d.quoteId})` : '') + (d.orderId ? ` (order ${d.orderId})` : '');
    await (0, slack_1.postSlack)(msg);
});
// Invoice sent -> Slack
eventBus_1.eventBus.onEvent('invoice.sent', async (evt) => {
    const d = evt.payload || {};
    const msg = `Invoice ${d.number || d.id} sent for project ${d.projectId}`;
    await (0, slack_1.postSlack)(msg);
});
// Invoice paid -> Slack
eventBus_1.eventBus.onEvent('invoice.paid', async (evt) => {
    const d = evt.payload || {};
    const msg = `Invoice ${d.number || d.id} PAID for project ${d.projectId}`;
    await (0, slack_1.postSlack)(msg);
});
