/**
 * Invoice PDF rendering — Playwright A4 renderer + entity→model mapper.
 *
 * Self-contained inside the invoicing module (no offers import). Mirrors the
 * offers Playwright pattern: a lazy singleton headless Chromium, print media
 * emulation, fonts/images awaited, CSS @page sizing. `generateInvoicePdfBytes`
 * composes the model → HTML → PDF bytes used as the frozen archival snapshot.
 */

import { chromium, type Browser } from 'playwright';
import type { Invoice } from '../domain/invoice.entity';
import { getDiscountFactor, normalizeVatRate } from '../domain/invoice-pricing';
import { buildInvoicePdfHtml } from './invoice-pdf-html';
import type { InvoicePdfLine, InvoicePdfModel } from './invoice-pdf-format';

/** Selling-company fields needed to render the seller block (read in infra). */
export interface InvoicePdfCompany {
  name: string;
  orgNumber?: string | null;
  vatNumber?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  logoUrl?: string | null;
}

let browserPromise: Promise<Browser> | null = null;

function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = chromium.launch({ headless: true })
      .then((browser) => {
        browser.on('disconnected', () => {
          browserPromise = null;
        });
        return browser;
      })
      .catch((error) => {
        browserPromise = null;
        throw error;
      });
  }

  return browserPromise;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function nilToUndefined<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined;
}

/**
 * Maps an invoice entity + selling-company row to the PDF view model. Per-line
 * ex-VAT and VAT are derived with the same arithmetic the totals use, so the
 * document reconciles with the stored `totalExVat`/`totalVat`/`totalIncVat`.
 */
export function buildInvoicePdfModel(invoice: Invoice, company: InvoicePdfCompany): InvoicePdfModel {
  const lines: InvoicePdfLine[] = invoice.lineItems.map((item) => {
    const lineExVat = roundCurrency(
      Math.max(0, item.quantity) * Math.max(0, item.unitPrice) * getDiscountFactor(item.discount),
    );
    const vatRate = normalizeVatRate(item.vatRate);
    return {
      description: item.description,
      quantity: item.quantity,
      unit: nilToUndefined(item.unit),
      unitPrice: item.unitPrice,
      vatRate,
      discount: item.discount || undefined,
      lineExVat,
      lineVat: roundCurrency(lineExVat * vatRate),
    };
  });

  return {
    seller: {
      name: company.name,
      orgNumber: nilToUndefined(company.orgNumber),
      vatNumber: nilToUndefined(company.vatNumber),
      addressLine1: nilToUndefined(company.addressLine1),
      addressLine2: nilToUndefined(company.addressLine2),
      postalCode: nilToUndefined(company.postalCode),
      city: nilToUndefined(company.city),
      country: nilToUndefined(company.country),
      logoUrl: nilToUndefined(company.logoUrl),
    },
    buyer: {
      company: nilToUndefined(invoice.recipientCompany),
      name: nilToUndefined(invoice.recipientName),
      email: nilToUndefined(invoice.recipientEmail),
    },
    invoiceNumber: invoice.invoiceNumber,
    documentType: invoice.documentType,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    paymentReference: nilToUndefined(invoice.paymentReference),
    currency: invoice.currency,
    notes: nilToUndefined(invoice.notes),
    lines,
    totalExVat: invoice.totalExVat,
    totalVat: invoice.totalVat,
    totalIncVat: invoice.totalIncVat,
    // Surface the ROT/RUT deduction only when one applies (a type is set with a
    // non-zero deduction). No deduction → omitted, so the PDF is unchanged.
    rotRut: (invoice.rotRutType && invoice.rotRutDeductionAmount > 0)
      ? {
          type: invoice.rotRutType,
          laborAmount: invoice.rotRutLaborAmount,
          deductionAmount: invoice.rotRutDeductionAmount,
          buyerPersonalNumber: nilToUndefined(invoice.buyerPersonalNumber),
          propertyDesignation: nilToUndefined(invoice.propertyDesignation),
          housingSocietyOrgNumber: nilToUndefined(invoice.housingSocietyOrgNumber),
        }
      : undefined,
  };
}

/** Renders a standalone invoice HTML document to A4 PDF bytes. */
export async function renderInvoicePdf(html: string): Promise<Uint8Array> {
  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: { width: 816, height: 1200 },
    deviceScaleFactor: 1,
  });

  try {
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.emulateMedia({ media: 'print' });
    await page.evaluate(async () => {
      await (document.fonts?.ready ?? Promise.resolve());

      const images = Array.from(document.images);
      await Promise.all(
        images.map((img) => (
          img.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.addEventListener('load', () => resolve(), { once: true });
                img.addEventListener('error', () => resolve(), { once: true });
              })
        )),
      );
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });
    return new Uint8Array(pdf);
  } finally {
    await context.close();
  }
}

/** Composes model → HTML → A4 PDF bytes for one invoice. */
export async function generateInvoicePdfBytes(
  invoice: Invoice,
  company: InvoicePdfCompany,
): Promise<Uint8Array> {
  const model = buildInvoicePdfModel(invoice, company);
  const html = buildInvoicePdfHtml(model);
  return renderInvoicePdf(html);
}
