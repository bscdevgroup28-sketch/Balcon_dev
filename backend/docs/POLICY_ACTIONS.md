Policy Action Catalog
=====================

This document lists canonical policy action identifiers and the intended roles permitted (subject to rule evaluation).

General Principles:
- Actions are verbs with domain prefixes (e.g., `order.create`, `project.update`).
- Allow rules recorded via `policy.allowed:<action>` audit events; denies via `policy.denied:<action>`.
- Metrics counters: `security_policyAllow` and `security_policyDeny` increase on decisions.

Actions (current):

Project:
- project.read – project_manager+, or owner; may extend with ownership.
- project.create – project_manager, office_manager, owner.
- project.update – project_manager, office_manager, owner.
- project.delete – owner only.

Order:
- order.create / order.update – office_manager, owner, (admin if added) and some rules include project_manager in auth engine variant.
- order.delete – owner (and admin variant in legacy rule) – consolidate to owner+office_manager? (Review).

Quote:
- quote.create / quote.update – office_manager, owner, project_manager.
- quote.respond – customer (own), office_manager, owner.

Inventory:
- inventory.transaction.create – shop_manager, office_manager, owner.

User Management:
- user.list / user.create / user.delete – owner.

Feature Flags:
- feature.flag.list / feature.flag.upsert – owner, office_manager.

Files / Uploads:
- file.upload – (TBD) Currently any authenticated user passing middleware – policy rule pending.
- file.list – TBD (likely owner or project member) – rule not yet added.
- file.read – TBD (public files or authorized project membership) – rule not yet added.
- file.delete – owner / project manager TBD – rule not yet added.

Notifications:
- notification.create – owner or office_manager (rule pending) – currently enforced via policy middleware without rule (will deny by default until rule added).
- notification.broadcast – owner or office_manager (rule pending).

Next Steps:
1. Add explicit rules for file.* and notification.*.
2. Implement resource ownership resolution for project/file association.
3. Expand tests to cover newly mapped actions.
4. Remove legacy auth/policyEngine once all imports are swapped.

NOTE: Update this catalog whenever a new action is introduced.
