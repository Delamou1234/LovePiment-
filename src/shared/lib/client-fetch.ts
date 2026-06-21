/** 404 HTML = route API pas encore compilée (HMR dev). */
export function isApiRouteMissing(res: Response): boolean {
  if (res.status !== 404) return false;
  const contentType = res.headers.get('content-type') ?? '';
  return contentType.includes('text/html');
}

/** Fetch avec retry court si la route Next n'est pas encore prête (dev / HMR). */
export async function fetchApi(
  input: RequestInfo | URL,
  init?: RequestInit,
  retries = 2,
): Promise<Response> {
  let response: Response | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    response = await fetch(input, init);
    if (!isApiRouteMissing(response)) return response;
    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }

  return response!;
}
