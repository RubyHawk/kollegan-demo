/**
 * DocuSign Embedded Signing — eSignature REST API v2.1
 *
 * Uses JWT Grant authentication (server-to-server, no user login needed).
 *
 * Required env vars:
 *   DOCUSIGN_INTEGRATION_KEY   — OAuth integration key (client ID)
 *   DOCUSIGN_USER_ID           — API user GUID (impersonated user)
 *   DOCUSIGN_ACCOUNT_ID        — Account GUID
 *   DOCUSIGN_PRIVATE_KEY       — RSA private key, PEM, base64-encoded
 *   DOCUSIGN_BASE_URL          — https://demo.docusign.net (sandbox)
 *                                or https://na4.docusign.net (production)
 *   DOCUSIGN_OAUTH_BASE_URL    — https://account-d.docusign.com (sandbox)
 *                                or https://account.docusign.com (production)
 *
 * Flow:
 *   1. createSigningSession(offer, returnUrl) → { signingUrl, envelopeId }
 *      - Mints a JWT, exchanges it for an access token
 *      - Creates a DocuSign envelope with the offer HTML document
 *      - Creates an embedded recipient view → returns the DocuSign signing URL
 *      - Redirect the recipient to signingUrl
 *
 *   2. handleReturn(token, event, envelopeId) — called by the return route
 *      - event = 'signing_complete' | 'cancel' | 'decline' | 'exception'
 *      - On signing_complete: marks offer accepted
 *      - On decline: marks offer declined
 */

import * as crypto from 'crypto';
import { logger } from '@platform/logging/logger';

const TAG = 'DocuSignService';

// ─── Config ───────────────────────────────────────────────────────────────────

export interface DocuSignConfig {
  integrationKey: string;
  userId:         string;
  accountId:      string;
  privateKeyPem:  string; // raw PEM (decoded from base64 env var)
  baseUrl:        string; // https://demo.docusign.net or https://na4.docusign.net
  oauthBaseUrl:   string; // https://account-d.docusign.com or https://account.docusign.com
}

export function isDocuSignConfigured(): boolean {
  return !!(
    process.env.DOCUSIGN_INTEGRATION_KEY &&
    process.env.DOCUSIGN_USER_ID &&
    process.env.DOCUSIGN_ACCOUNT_ID &&
    process.env.DOCUSIGN_PRIVATE_KEY &&
    process.env.DOCUSIGN_BASE_URL
  );
}

function getConfig(): DocuSignConfig {
  const key = process.env.DOCUSIGN_PRIVATE_KEY;
  if (!key) throw new Error('DOCUSIGN_PRIVATE_KEY is not set');
  // Decode from base64 if not a raw PEM
  let pem = key.includes('-----BEGIN') ? key : Buffer.from(key, 'base64').toString('utf-8');
  // Normalize literal \n sequences → real newlines (common when storing PEM in .env)
  pem = pem.replace(/\\n/g, '\n');
  return {
    integrationKey: process.env.DOCUSIGN_INTEGRATION_KEY!,
    userId:         process.env.DOCUSIGN_USER_ID!,
    accountId:      process.env.DOCUSIGN_ACCOUNT_ID!,
    privateKeyPem:  pem,
    baseUrl:        process.env.DOCUSIGN_BASE_URL ?? 'https://demo.docusign.net',
    oauthBaseUrl:   process.env.DOCUSIGN_OAUTH_BASE_URL ?? 'https://account-d.docusign.com',
  };
}

// ─── JWT Grant ────────────────────────────────────────────────────────────────

function buildJwt(cfg: DocuSignConfig): string {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss:   cfg.integrationKey,
    sub:   cfg.userId,
    aud:   new URL(cfg.oauthBaseUrl).hostname,
    iat:   now,
    exp:   now + 3600,
    scope: 'signature impersonation',
  })).toString('base64url');

  const privateKey = crypto.createPrivateKey(cfg.privateKeyPem);
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(privateKey, 'base64url');

  return `${header}.${payload}.${sig}`;
}

async function getAccessToken(cfg: DocuSignConfig): Promise<string> {
  const jwt = buildJwt(cfg);
  const res = await fetch(`${cfg.oauthBaseUrl}/oauth/token`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`DocuSign token error ${res.status}: ${body}`);
  }
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

// ─── Envelope creation ────────────────────────────────────────────────────────

export interface SigningSession {
  signingUrl: string;
  envelopeId: string;
}

/**
 * Creates a DocuSign embedded signing session for the offer.
 *
 * @param offer          - The offer with generatedDocument HTML
 * @param recipientName  - Display name for DocuSign
 * @param recipientEmail - Email to associate with the DocuSign envelope
 * @param returnUrl      - URL DocuSign redirects to after signing (include ?token=xxx)
 */
export async function createSigningSession(
  offerId:        string,
  offerTitle:     string,
  documentHtml:   string,
  recipientName:  string,
  recipientEmail: string,
  returnUrl:      string,
): Promise<SigningSession> {
  const cfg   = getConfig();
  const token = await getAccessToken(cfg);
  const api   = `${cfg.baseUrl}/restapi/v2.1/accounts/${cfg.accountId}`;

  // DocuSign expects base64-encoded document content
  const docBase64 = Buffer.from(documentHtml).toString('base64');

  // 1. Create envelope
  const envelopeBody = {
    emailSubject: `Offert: ${offerTitle}`,
    documents: [{
      documentBase64: docBase64,
      name:           `${offerTitle}.html`,
      fileExtension:  'html',
      documentId:     '1',
    }],
    recipients: {
      signers: [{
        email:         recipientEmail,
        name:          recipientName,
        recipientId:   '1',
        clientUserId:  offerId, // required for embedded signing
        tabs: {
          signHereTabs: [{
            anchorString:        '{{signature}}',
            anchorUnits:         'pixels',
            anchorXOffset:       '0',
            anchorYOffset:       '0',
            anchorIgnoreIfNotPresent: true,
            // Fallback: place at bottom of page if no anchor found
            pageNumber:          '1',
            xPosition:           '100',
            yPosition:           '700',
          }],
        },
      }],
    },
    status: 'sent',
  };

  const envRes = await fetch(`${api}/envelopes`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(envelopeBody),
  });
  if (!envRes.ok) {
    const body = await envRes.text();
    throw new Error(`DocuSign envelope error ${envRes.status}: ${body}`);
  }
  const envData = await envRes.json() as { envelopeId: string };
  const envelopeId = envData.envelopeId;

  // 2. Create recipient view (embedded signing URL)
  const viewBody = {
    returnUrl,
    authenticationMethod: 'none',
    email:        recipientEmail,
    userName:     recipientName,
    recipientId:  '1',
    clientUserId: offerId,
  };

  const viewRes = await fetch(`${api}/envelopes/${envelopeId}/views/recipient`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(viewBody),
  });
  if (!viewRes.ok) {
    const body = await viewRes.text();
    throw new Error(`DocuSign view error ${viewRes.status}: ${body}`);
  }
  const viewData = await viewRes.json() as { url: string };

  logger.info(TAG, `DocuSign envelope created: ${envelopeId}`, { offerId });
  return { signingUrl: viewData.url, envelopeId };
}

// ─── Return event mapping ─────────────────────────────────────────────────────

/**
 * Maps DocuSign return event query parameter to an offer action.
 * Call this in the return route handler.
 */
export type DocuSignReturnEvent =
  | 'signing_complete'
  | 'cancel'
  | 'decline'
  | 'exception'
  | 'fax_pending'
  | 'id_check_failed'
  | 'session_timeout'
  | 'ttl_expired'
  | 'viewing_complete';

export function resolveReturnAction(event: string): 'accept' | 'decline' | 'cancel' {
  if (event === 'signing_complete') return 'accept';
  if (event === 'decline')         return 'decline';
  return 'cancel';
}
