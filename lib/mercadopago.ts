const MP_API = "https://api.mercadopago.com";

/**
 * Llamada genérica a la API de Mercado Pago. Se usa fetch directo en vez de
 * la librería oficial de Mercado Pago para no sumar una dependencia más al
 * proyecto — la API de Suscripciones (preapproval) es simple y no la
 * necesita.
 */
export async function mpFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Falta configurar MERCADOPAGO_ACCESS_TOKEN.");
  }

  return fetch(`${MP_API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
}

export function assertMercadoPagoEnv() {
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN no está configurado.");
  }
}
