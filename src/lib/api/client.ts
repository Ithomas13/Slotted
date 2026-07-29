type ApiErrorBody = {
  error?: unknown;
};

function formatApiError(error: unknown, fallback: string): string {
  if (typeof error === "string" && error.trim().length > 0) return error;
  if (Array.isArray(error) && error.length > 0) {
    return error
      .map((issue) => {
        if (typeof issue === "object" && issue && "message" in issue) {
          return String(issue.message);
        }
        return String(issue);
      })
      .join("; ");
  }
  return fallback;
}

export async function readJson<T>(res: Response, fallbackError: string): Promise<T> {
  if (res.ok) return res.json() as Promise<T>;

  let body: ApiErrorBody | null = null;
  try {
    body = (await res.json()) as ApiErrorBody;
  } catch {
    // Preserve the caller's contextual fallback when the response is empty or not JSON.
  }

  throw new Error(formatApiError(body?.error, fallbackError));
}

export async function assertOk(res: Response, fallbackError: string): Promise<void> {
  if (res.ok) return;
  await readJson<unknown>(res, fallbackError);
}
