import type {
  PublicOffer,
  PublicOfferDeclineResult,
  PublicOfferSignResult,
  PublicOfferViewedResult,
} from '../_types/public-offer.types';

type ApiEnvelope<T> = {
  data: T;
};

type ProblemDetail = {
  detail?: string;
};

export class PublicOfferApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly detail?: string,
  ) {
    super(message);
    this.name = 'PublicOfferApiError';
  }
}

async function readProblemDetail(response: Response): Promise<string | undefined> {
  const body = await response.json().catch(() => ({})) as ProblemDetail;
  return typeof body.detail === 'string' ? body.detail : undefined;
}

async function readData<T>(response: Response): Promise<T> {
  const body = await response.json() as ApiEnvelope<T>;
  return body.data;
}

function publicOfferPath(token: string, suffix = ''): string {
  return `/api/offers/public/${token}${suffix}`;
}

function userFacingDetail(detail: string | undefined, fallback: string): string {
  return detail && detail.length < 120 ? detail : fallback;
}

export async function fetchPublicOffer(token: string): Promise<PublicOffer> {
  const response = await fetch(publicOfferPath(token));
  if (response.status === 404 || response.status === 410) {
    throw new PublicOfferApiError(response.status, 'expired');
  }
  if (!response.ok) {
    throw new PublicOfferApiError(response.status, `Fel ${response.status}`);
  }
  return readData<PublicOffer>(response);
}

export async function markPublicOfferViewed(
  token: string,
  signal?: AbortSignal,
): Promise<PublicOfferViewedResult> {
  const response = await fetch(publicOfferPath(token, '/view'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
  });
  if (!response.ok) {
    throw new PublicOfferApiError(response.status, `Fel ${response.status}`);
  }
  return readData<PublicOfferViewedResult>(response);
}

export async function signPublicOffer(
  token: string,
  input: { signatureImage: string; signerName: string },
): Promise<PublicOfferSignResult> {
  const response = await fetch(publicOfferPath(token, '/sign'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const detail = await readProblemDetail(response);
    throw new PublicOfferApiError(
      response.status,
      userFacingDetail(detail, 'Signeringen misslyckades. Försök igen.'),
      detail,
    );
  }

  return readData<PublicOfferSignResult>(response);
}

export async function declinePublicOffer(
  token: string,
  input: { comment?: string },
): Promise<PublicOfferDeclineResult> {
  const response = await fetch(publicOfferPath(token, '/decline'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const detail = await readProblemDetail(response);
    throw new PublicOfferApiError(
      response.status,
      userFacingDetail(detail, 'Avvisningen misslyckades. Försök igen.'),
      detail,
    );
  }

  return readData<PublicOfferDeclineResult>(response);
}

export async function downloadPublicOfferPdfBlob(token: string): Promise<Blob> {
  const response = await fetch(publicOfferPath(token, '/pdf'));
  if (!response.ok) {
    throw new PublicOfferApiError(response.status, 'download_failed');
  }
  return response.blob();
}
