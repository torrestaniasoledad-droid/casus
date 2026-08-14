import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "CASUS <soporte@balancedigital.store>";

/**
 * Envía el correo de bienvenida cuando un usuario se registra en CASUS.
 */
export async function sendWelcomeEmail(to: string, name: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "¡Bienvenido/a a CASUS! 🎉",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>¡Hola ${name}!</h2>
          <p>Gracias por registrarte en <strong>CASUS</strong>.</p>
          <p>Ya podés empezar a convertir tus experiencias clínicas en contenido
          para redes sociales, de forma segura y sin exponer datos de pacientes.</p>
          <p>Cualquier duda, escribinos a soporte@balancedigital.store.</p>
          <p>¡Éxitos!<br/>El equipo de CASUS</p>
        </div>
      `,
    });

    if (error) {
      console.error("Error enviando email de bienvenida:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Error inesperado enviando email de bienvenida:", err);
    return { success: false, error: err };
  }
}

/**
 * Envía el correo de confirmación cuando un usuario paga/se suscribe a un plan.
 */
export async function sendPaymentConfirmationEmail(
  to: string,
  name: string,
  plan: "Pro" | "Premium"
) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Confirmación de suscripción al plan ${plan} — CASUS`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>¡Hola ${name}!</h2>
          <p>Confirmamos que tu suscripción al plan <strong>${plan}</strong> de
          CASUS quedó activada correctamente.</p>
          <p>Ya podés disfrutar de todas las funciones incluidas en tu plan.</p>
          <p>Si tenés alguna consulta sobre tu suscripción, escribinos a
          soporte@balancedigital.store.</p>
          <p>¡Gracias por confiar en CASUS!<br/>El equipo de CASUS</p>
        </div>
      `,
    });

    if (error) {
      console.error("Error enviando email de confirmación de pago:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Error inesperado enviando email de confirmación de pago:", err);
    return { success: false, error: err };
  }
}
