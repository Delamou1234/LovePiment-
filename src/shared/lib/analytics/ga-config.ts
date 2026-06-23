const PLACEHOLDER = new Set(['', 'changeme', 'xxx', 'g-xxxxxxxxxx', '[ga4_property_id]']);

function clean(value: string | undefined): string | undefined {
  const v = value?.trim();
  if (!v || PLACEHOLDER.has(v.toLowerCase())) return undefined;
  return v;
}

export function getGaMeasurementId(): string | null {
  return clean(process.env.NEXT_PUBLIC_GA_ID) ?? null;
}

export type Ga4ApiConfig = {
  propertyId: string;
  clientEmail: string;
  privateKey: string;
};

export function getGa4ApiConfig(): Ga4ApiConfig | null {
  const propertyId = clean(process.env.GA4_PROPERTY_ID)?.replace(/^properties\//, '');
  const clientEmail = clean(process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL);
  let privateKey = clean(process.env.GOOGLE_ANALYTICS_PRIVATE_KEY);
  if (!propertyId || !clientEmail || !privateKey) return null;

  privateKey = privateKey.replace(/\\n/g, '\n');
  return { propertyId, clientEmail, privateKey };
}

export function isGa4TagConfigured(): boolean {
  return getGaMeasurementId() !== null;
}

export function isGa4ApiConfigured(): boolean {
  return getGa4ApiConfig() !== null;
}

export type Ga4SetupStatus = {
  tag: boolean;
  api: boolean;
  measurementId: string | null;
  propertyId: string | null;
  missing: string[];
};

export function getGa4SetupStatus(): Ga4SetupStatus {
  const measurementId = getGaMeasurementId();
  const api = getGa4ApiConfig();
  const missing: string[] = [];

  if (!measurementId) missing.push('NEXT_PUBLIC_GA_ID');
  if (!clean(process.env.GA4_PROPERTY_ID)) missing.push('GA4_PROPERTY_ID');
  if (!clean(process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL)) {
    missing.push('GOOGLE_ANALYTICS_CLIENT_EMAIL');
  }
  if (!clean(process.env.GOOGLE_ANALYTICS_PRIVATE_KEY)) {
    missing.push('GOOGLE_ANALYTICS_PRIVATE_KEY');
  }

  return {
    tag: measurementId !== null,
    api: api !== null,
    measurementId,
    propertyId: api?.propertyId ?? clean(process.env.GA4_PROPERTY_ID) ?? null,
    missing,
  };
}
