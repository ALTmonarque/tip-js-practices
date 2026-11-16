export class ApiError extends Error {
  constructor(message, {
    kind,
    status = null,
    code = null,
    details = null,
    url = null,
    cause,
  } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.details = details;
    this.url = url;
  }
}

// Соединяет абсолютный baseUrl, путь и непустые query-параметры.
// Значения кодируются средствами URL и URLSearchParams, а не вручную.
export function buildUrl(baseUrl, path, query = {}) {
  const base = String(baseUrl).replace(/\/+$/, "");
  const cleanPath = String(path).replace(/^\/+/, "");
  const url = new URL(`${base}/${cleanPath}`);
  for (const [name, value] of Object.entries(query ?? {})) {
    // false и 0 сохраняются; пропускаются только undefined, null и пустая строка.
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.append(name, String(value));
  }
  return url.toString();
}

const ALLOWED_METHODS = new Set(["GET", "POST", "PATCH", "DELETE"]);

function validateBaseUrl(baseUrl) {
  if (typeof baseUrl !== "string") {
    throw new TypeError("baseUrl должен быть строкой с абсолютным адресом.");
  }
  let parsed;
  try {
    parsed = new URL(baseUrl);
  } catch (cause) {
    throw new TypeError("baseUrl должен быть абсолютным URL.", { cause });
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new TypeError("baseUrl должен использовать http или https.");
  }
  if (parsed.search !== "" || parsed.hash !== "") {
    throw new TypeError("baseUrl не должен содержать query или hash.");
  }
  return baseUrl.replace(/\/+$/, "");
}

function isErrorPayload(payload) {
  return payload !== null && typeof payload === "object"
    && payload.error !== null && typeof payload.error === "object";
}

// fetchFn передаётся явно, чтобы модуль можно было проверить без реальной сети.
// requestJson(path, { method, query, body, signal, timeoutMs } = {})
// поддерживает GET, POST, PATCH и DELETE; ответ 204 преобразуется в null.
export function createApiClient({
  baseUrl,
  fetchFn = globalThis.fetch,
  timeoutMs = 3000,
} = {}) {
  const normalizedBase = validateBaseUrl(baseUrl);
  if (typeof fetchFn !== "function") {
    throw new TypeError("fetchFn должен быть функцией.");
  }
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
    throw new TypeError("timeoutMs должен быть положительным целым числом.");
  }

  async function requestJson(path, {
    method = "GET",
    query,
    body,
    signal,
    timeoutMs: ownTimeout,
  } = {}) {
    const httpMethod = String(method).toUpperCase();
    if (!ALLOWED_METHODS.has(httpMethod)) {
      throw new TypeError("Разрешены только методы GET, POST, PATCH и DELETE.");
    }
    if (body !== undefined && httpMethod === "GET") {
      throw new TypeError("У GET-запроса не может быть тела.");
    }
    const limit = ownTimeout ?? timeoutMs;
    if (!Number.isSafeInteger(limit) || limit <= 0) {
      throw new TypeError("timeoutMs должен быть положительным целым числом.");
    }
    const url = buildUrl(normalizedBase, path, query);

    // Сигнал тайм-аута и внешний сигнал отмены объединяются в один.
    const timeoutController = new AbortController();
    const timer = setTimeout(() => {
      timeoutController.abort(new Error(`Превышено время ожидания ${limit} мс`));
    }, limit);
    const combined = signal ? AbortSignal.any([signal, timeoutController.signal]) : timeoutController.signal;

    // Определяет, чем вызван отказ: тайм-аутом, внешней отменой или сетью.
    const classify = (cause) => {
      if (timeoutController.signal.aborted) {
        return new ApiError(`Превышено время ожидания ответа (${limit} мс).`, { kind: "timeout", url, cause });
      }
      if (signal?.aborted) {
        return new ApiError("Запрос отменён вызывающим кодом.", { kind: "aborted", url, cause });
      }
      return new ApiError("Не удалось выполнить запрос: сетевая ошибка.", { kind: "network", url, cause });
    };

    try {
      let response;
      try {
        const headers = { Accept: "application/json" };
        const init = { method: httpMethod, headers, signal: combined };
        if (body !== undefined) {
          headers["Content-Type"] = "application/json"; // только если есть тело
          init.body = JSON.stringify(body);
        }
        response = await fetchFn(url, init);
      } catch (cause) {
        throw classify(cause);
      }

      if (
        response === null || typeof response !== "object"
        || typeof response.status !== "number"
        || typeof response.headers?.get !== "function"
        || typeof response.text !== "function"
      ) {
        throw new ApiError("fetchFn вернул не Response.", { kind: "invalid-response", url });
      }

      let text;
      try {
        text = await response.text();
      } catch (cause) {
        throw classify(cause);
      }
      const contentType = response.headers.get("content-type") ?? "";
      const isJson = /json/i.test(contentType);

      // Сначала HTTP-ошибка: fetch не отклоняется для 404 и 500.
      if (!response.ok) {
        let payload = null;
        if (isJson) {
          try {
            payload = JSON.parse(text);
          } catch {
            payload = null;
          }
        }
        const info = isErrorPayload(payload) ? payload.error : {};
        const message = typeof info.message === "string" && info.message.trim() !== ""
          ? info.message
          : `HTTP-ошибка ${response.status}.`;
        throw new ApiError(message, {
          kind: "http",
          status: response.status,
          code: typeof info.code === "string" ? info.code : null,
          details: info.details ?? null,
          url,
        });
      }

      if (response.status === 204) return null;

      if (!isJson) {
        throw new ApiError(`Ожидался JSON, получен Content-Type: ${contentType || "не указан"}.`, {
          kind: "invalid-response",
          status: response.status,
          url,
        });
      }
      try {
        return JSON.parse(text);
      } catch (cause) {
        throw new ApiError("Тело ответа не является корректным JSON.", {
          kind: "invalid-response",
          status: response.status,
          url,
          cause,
        });
      }
    } finally {
      clearTimeout(timer);
    }
  }

  return { requestJson };
}
