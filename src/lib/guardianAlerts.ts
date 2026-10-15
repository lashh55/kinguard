import { toast } from "sonner";

type ScamAlertInput = {
  seniorName: string;
  scamType: string;
  score: number;
  channel: string;
};

const channelLabel = (c: string, es: boolean) =>
  c === "email" ? (es ? "Correo electrónico" : "Email") :
  c === "sms" ? (es ? "Mensaje de texto" : "Text") :
  c === "call" ? (es ? "Llamada" : "Call") :
  c === "ssn_request" ? (es ? "Solicitud de número de seguro social" : "SSN Request") : (es ? "Mensaje" : "Message");

/** Show formatted scam alert (mirrors what the guardian would see). */
export function notifyGuardianScam(a: ScamAlertInput, lang: "en" | "es" = "en") {
  const es = lang === "es";
  const msg = es
    ? `🚨 Alerta de KinGuard\n` +
      `${a.seniorName} marcó un mensaje sospechoso.\n\n` +
      `Tipo: ${a.scamType}\n` +
      `Nivel de riesgo: ${a.score}/100\n` +
      `Canal: ${channelLabel(a.channel, es)}\n\n` +
      `Toque para ver todos los detalles.`
    : `🚨 KinGuard Alert\n` +
      `${a.seniorName} flagged a suspicious message.\n\n` +
      `Type: ${a.scamType}\n` +
      `Risk Score: ${a.score}/100\n` +
      `Channel: ${channelLabel(a.channel, es)}\n\n` +
      `Tap to view full details.`;
  toast(msg, { duration: 4500, style: { whiteSpace: "pre-line" } });
}

export function notifyGuardianSOS(seniorName: string, lang: "en" | "es" = "en") {
  const msg = lang === "es"
    ? `${seniorName} pidió ayuda — por favor comuníquese con esta persona ahora.`
    : `${seniorName} asked for help — please contact them now.`;
  toast(msg, { duration: 5000, style: { whiteSpace: "pre-line" } });
}
