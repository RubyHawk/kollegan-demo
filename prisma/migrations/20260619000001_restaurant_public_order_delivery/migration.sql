-- Public online ordering: pickup + delivery support.
-- Additive and reversible. Two new nullable columns on rst_orders; no data rewrite, no drops.
-- fulfillmentType stays a free-text column ("delivery" is added at the application validation
-- layer), and `source` already supports the "public" value, so no enum/type migration is needed.
-- Rollback (if ever required): remove the two columns added below; see the rollback note recorded
-- in docs/security/AUDIT_EVIDENCE_INDEX.md.

ALTER TABLE "rst_orders" ADD COLUMN "customerPhone" TEXT;
ALTER TABLE "rst_orders" ADD COLUMN "deliveryAddress" TEXT;
