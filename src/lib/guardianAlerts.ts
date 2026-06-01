import { toast } from "sonner";

type ScamAlertInput = {
  seniorName: string;
  scamType: string;
  score: number;
  channel: string;
};

const channelLabel = (c: string) =>
  c === "email" ? "Email" :
  c === "sms" ? "Text" :
  c === "call" ? "Call" :
  c === "ssn_request" ? "SSN Request" : "Message";

/** Show formatted scam alert (mirrors what the guardian would see). */
export function notifyGuardianScam(a: ScamAlertInput) {
  const msg =
    `🚨 KinGuard Alert\n` +
    `${a.seniorName} flagged a suspicious message.\n\n` +
    `Type: ${a.scamType}\n` +
    `Risk Score: ${a.score}/100\n` +
    `Channel: ${channelLabel(a.channel)}\n\n` +
    `Tap to view full details.`;
  toast(msg, { duration: 4500, style: { whiteSpace: "pre-line" } });
}

export function notifyGuardianSOS(seniorName: string) {
  const msg =
    `🆘 SOS Alert\n` +
    `${seniorName} has pressed the emergency help button and needs assistance.\n` +
    `Reach out to them right away.`;
  toast(msg, { duration: 5000, style: { whiteSpace: "pre-line" } });
}
