type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: BodyInit | Record<string, unknown>;
  token?: string;
  headers?: HeadersInit;
};

type ErrorBody = {
  message?: string | string[];
  error?: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: ErrorBody,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const DEFAULT_API_BASE_URL = "http://localhost:3000";

function getApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
    DEFAULT_API_BASE_URL
  );
}

function buildHeaders(body: RequestOptions["body"], options: RequestOptions) {
  const headers = new Headers(options.headers);

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  if (body && !(body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

async function parseError(response: Response) {
  let details: ErrorBody | undefined;

  try {
    details = (await response.json()) as ErrorBody;
  } catch {
    details = undefined;
  }

  const message = Array.isArray(details?.message)
    ? details.message.join(", ")
    : details?.message ?? details?.error ?? "Request failed.";

  throw new ApiError(message, response.status, details);
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const body =
    options.body &&
    !(options.body instanceof FormData) &&
    typeof options.body === "object"
      ? JSON.stringify(options.body)
      : options.body;

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: options.method ?? "GET",
    body,
    headers: buildHeaders(options.body, options),
    cache: "no-store",
  });

  if (!response.ok) {
    await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
