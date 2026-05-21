import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Lang = "en" | "es";

const DICT: Record<string, string> = {
  // Onboarding / Welcome
  "Protecting the people you love": "Protegiendo a las personas que amas",
  "I want to be protected": "Quiero estar protegido/a",
  "🛡️ I want to be protected": "🛡️ Quiero estar protegido/a",
  "I want to protect someone": "Quiero proteger a alguien",
  "💙 I want to protect someone": "💙 Quiero proteger a alguien",
  "Already have an account?": "¿Ya tienes una cuenta?",
  "Sign in": "Iniciar sesión",
  "Sign In": "Iniciar sesión",
  "Sign Out": "Cerrar sesión",
  "Create account": "Crear cuenta",
  "Create My Account": "Crear mi cuenta",
  "Full name": "Nombre completo",
  "Email address": "Correo electrónico",
  "Password": "Contraseña",
  "Forgot password?": "¿Olvidaste tu contraseña?",
  "← Back": "← Atrás",
  "Back": "Atrás",
  "Please wait…": "Por favor espera…",
  "Sending…": "Enviando…",
  "Connecting…": "Conectando…",
  "Connect and Protect": "Conectar y Proteger",
  "Phone Number — so your guardian can reach you": "Número de teléfono — para que tu guardián pueda contactarte",
  "Phone Number — so we can alert you by call or text": "Número de teléfono — para alertarte por llamada o texto",
  "Phone number is required": "El número de teléfono es obligatorio",
  "Please enter a valid 10-digit phone number": "Por favor ingresa un número de teléfono válido de 10 dígitos",
  "Text size": "Tamaño del texto",
  "Large": "Grande",
  "Extra Large": "Extra Grande",
  "Relationship to senior (e.g. Daughter, Son, Friend)": "Relación con la persona mayor (ej. Hija, Hijo, Amiga)",
  "Invite code": "Código de invitación",
  "Ask the person you want to protect for their invite code. They must create their account first.": "Pídele a la persona que quieres proteger su código de invitación. Debe crear su cuenta primero.",
  "Something went wrong": "Algo salió mal",
  "Could not send reset email": "No se pudo enviar el correo de restablecimiento",
  "Check your email for a link to reset your password.": "Revisa tu correo para ver el enlace para restablecer tu contraseña.",
  "Enter your email above first, then click Forgot password.": "Ingresa tu correo arriba primero, luego haz clic en ¿Olvidaste tu contraseña?",
  "You will need an invite code from the person you want to protect. Ask them to create their account first — they will receive a code to share with you.": "Necesitarás un código de invitación de la persona que quieres proteger. Pídele que cree su cuenta primero — recibirá un código para compartir contigo.",
  "You're protected! 🎉": "¡Estás protegido/a! 🎉",
  "Share this code with your family member so they can protect you:": "Comparte este código con tu familiar para que pueda protegerte:",
  "Multiple family members can use this same code.": "Varios familiares pueden usar este mismo código.",
  "Continue to my dashboard": "Continuar a mi panel",
  "Connected! 💙": "¡Conectado! 💙",
  "You're now protecting your loved one. You'll see their alerts in your dashboard.": "Ahora estás protegiendo a tu ser querido. Verás sus alertas en tu panel.",
  "Go to dashboard": "Ir al panel",
  "Loading…": "Cargando…",

  // Navigation
  "Home": "Inicio",
  "Check": "Verificar",
  "Learn": "Aprender",
  "Profile": "Perfil",

  // Dashboard
  "You're protected today": "Estás protegido/a hoy",
  "Action needed": "Acción necesaria",
  "Blocked": "Bloqueado",
  "Checked": "Verificado",
  "Knowledge Tree": "Árbol del Conocimiento",
  "Knowledge Tree 🌳": "Árbol del Conocimiento 🌳",
  "Recent alerts": "Alertas Recientes",
  "Recent Alerts": "Alertas Recientes",
  "✅ No alerts yet. You're all clear!": "✅ Sin alertas. ¡Todo está bien!",
  "No alerts yet. You're all clear!": "Sin alertas. ¡Todo está bien!",
  "🔍 Check a Suspicious Message": "🔍 Verificar un Mensaje Sospechoso",
  "🛡️ Protect My SSN": "🛡️ Proteger mi Número de Seguro Social",
  "🆘 I Need Help": "🆘 Necesito Ayuda",
  "Check a Suspicious Message": "Verificar un Mensaje Sospechoso",
  "Protect My SSN": "Proteger mi Número de Seguro Social",
  "I Need Help": "Necesito Ayuda",
  "Start a new streak this week! You've got this 💪": "¡Comienza una nueva racha esta semana! ¡Tú puedes! 💪",
  "🧠 This Week's Question": "🧠 Pregunta de esta semana",
  "See All Questions": "Ver todas las preguntas",
  "💡 Today's scam tip": "💡 Consejo del día sobre estafas",
  "You are protecting": "Estás protegiendo a",
  "No one linked yet": "Aún no hay nadie vinculado",
  "Ask your loved one for their 6-letter invite code, then sign in again to link.": "Pide a tu ser querido su código de invitación de 6 letras, luego inicia sesión de nuevo para vincular.",
  "loved one": "ser querido",
  "loved ones": "seres queridos",
  "All clear": "Todo en orden",
  "flagged": "marcadas",
  "Manage my profile": "Administrar mi perfil",
  "✅ No alerts across your loved ones.": "✅ Sin alertas en tus seres queridos.",
  "Last alert:": "Última alerta:",
  "Suspicious message": "Mensaje sospechoso",
  "just now": "ahora mismo",
  "Family": "Familia",

  // Check page
  "Check a Suspicious Message_title": "Verificar un Mensaje Sospechoso",
  "Paste any suspicious email, text, or describe a phone call. We'll tell you if it's a scam.": "Pega cualquier correo o texto sospechoso, o describe una llamada. Te diremos si es una estafa.",
  "Paste or type the suspicious message here...": "Pega o escribe el mensaje sospechoso aquí...",
  "What type is this?": "¿Qué tipo es este?",
  "--- Select a type ---": "--- Selecciona un tipo ---",
  "Email": "Correo electrónico",
  "Text Message": "Mensaje de texto",
  "Phone Call": "Llamada telefónica",
  "Not Sure": "No estoy seguro/a",
  "Please select what type of message this is before checking": "Por favor selecciona qué tipo de mensaje es antes de verificar",
  "KinGuard is analyzing this for you…": "KinGuard está analizando esto para ti…",
  "🔍 Check This Now": "🔍 Verificar ahora",
  "Could not analyze. Please try again.": "No se pudo analizar. Por favor inténtalo de nuevo.",
  "🚨 SSN ALERT": "🚨 ALERTA DE NÚMERO DE SEGURO SOCIAL",
  "This message is asking for your Social Security Number. Do NOT share it until you use our SSN Shield checker.": "Este mensaje está pidiendo tu Número de Seguro Social. NO lo compartas hasta usar nuestro verificador SSN Shield.",
  "→ Check This in SSN Shield": "→ Verificar esto en SSN Shield",
  "Looks Safe ✅": "Parece Seguro ✅",
  "Use Caution ⚠️": "Ten Precaución ⚠️",
  "Likely Scam 🚨": "Probablemente Estafa 🚨",
  "Red flags we found:": "Señales de alerta que encontramos:",
  "What to do:": "Qué hacer:",
  "Alert My Guardian": "Alertar a mi Guardián",
  "Mark as Safe": "Marcar como Seguro",
  "Block This Sender": "Bloquear a este remitente",
  "✅ Your guardian has been notified": "✅ Tu guardián ha sido notificado",
  "✅ Marked as safe": "✅ Marcado como seguro",
  "✅ Sender blocked": "✅ Remitente bloqueado",
  "← Back to dashboard": "← Volver al panel",

  // SSN Shield
  "🛡️ SSN Shield": "🛡️ Escudo SSN",
  "You have the power to protect yourself. We'll show you how.": "Tienes el poder de protegerte. Te mostraremos cómo.",
  "Should I Share My SSN?": "¿Debo compartir mi SSN?",
  "Answer two quick questions and we'll tell you if it's safe.": "Responde dos preguntas rápidas y te diremos si es seguro.",
  "Who is asking for your SSN?": "¿Quién pide tu SSN?",
  "My Employer or HR": "Mi empleador o Recursos Humanos",
  "My Bank or Credit Union": "Mi banco o cooperativa de crédito",
  "The IRS or Social Security Office": "El IRS o la Oficina del Seguro Social",
  "A Website I Found Online": "Un sitio web que encontré en línea",
  "Someone Who Called Me": "Alguien que me llamó",
  "An Email or Text Message": "Un correo o mensaje de texto",
  "I'm Not Sure": "No estoy seguro/a",
  "You selected:": "Seleccionaste:",
  "Did YOU contact them first, or did they contact you?": "¿TÚ los contactaste primero, o ellos te contactaron?",
  "✅ I contacted them first": "✅ Yo los contacté primero",
  "⚠️ They contacted me": "⚠️ Ellos me contactaron",
  "I contacted them first": "Yo los contacté primero",
  "They contacted me": "Ellos me contactaron",
  "← Start over": "← Comenzar de nuevo",
  "I'm Safe, Thanks": "Estoy seguro/a, gracias",
  "Check another": "Verificar otro",
  "✅ SAFE": "✅ SEGURO",
  "⚠️ CAUTION": "⚠️ PRECAUCIÓN",
  "🚨 STOP": "🚨 ALTO",
  "🚨 DANGER": "🚨 PELIGRO",
  "🚨 KinGuard will NEVER ask for your Social Security Number.": "🚨 KinGuard NUNCA pedirá tu Número de Seguro Social.",
  "ssn_warning": "🚨 KinGuard NUNCA te pedirá tu Número de Seguro Social. No lo recopilamos, almacenamos ni transmitimos — jamás. Si ves un campo pidiendo tu Número de Seguro Social, NO estás en KinGuard. Sal de esa página de inmediato y repórtanos en safety@getkinguard.com.",
  "📌 IRS Identity Protection PIN": "📌 PIN de Protección de Identidad del IRS",
  "A free 6-digit PIN from the IRS that blocks scammers from filing a tax return in your name.": "Un PIN gratuito de 6 dígitos del IRS que evita que los estafadores presenten una declaración de impuestos a tu nombre.",
  "💡 Why this matters": "💡 Por qué esto importa",
  "Tax-return identity theft costs seniors billions every year. The IP PIN is the single best protection — and it's free.": "El robo de identidad en declaraciones de impuestos cuesta miles de millones cada año a las personas mayores. El PIN IP es la mejor protección — y es gratis.",
  "→ Open IRS.gov/IPPIN": "→ Abrir IRS.gov/IPPIN",
  "🎉 All steps complete! Your IRS PIN is set up. You're protected!": "🎉 ¡Todos los pasos completos! Tu PIN del IRS está configurado. ¡Estás protegido/a!",
  "🧊 Freeze Your Credit": "🧊 Congela tu Crédito",
  "A credit freeze stops anyone from opening new accounts in your name. It's free, and you can unfreeze it anytime.": "Un congelamiento de crédito impide que alguien abra cuentas nuevas a tu nombre. Es gratis y puedes descongelarlo cuando quieras.",
  "💡 You must freeze at all 3 bureaus": "💡 Debes congelar en las 3 agencias",
  "Equifax, Experian, and TransUnion all keep separate files. Freeze each one.": "Equifax, Experian y TransUnion guardan archivos separados. Congela cada uno.",
  "→ Freeze on": "→ Congelar en",
  "✅ Frozen — Done!": "✅ Congelado — ¡Listo!",
  "I froze it ✓": "Lo congelé ✓",
  "✓ Done": "✓ Listo",
  "🛡️ Excellent!": "🛡️ ¡Excelente!",
  "All three credit bureaus are frozen. Your credit is now protected even if someone has your Social Security Number.": "Las tres agencias de crédito están congeladas. Tu crédito ahora está protegido incluso si alguien tiene tu Número de Seguro Social.",
  "🔒 KinGuard never requires, stores, or transmits your Social Security Number. We only help you protect it.": "🔒 KinGuard nunca requiere, almacena ni transmite tu Número de Seguro Social. Solo te ayudamos a protegerlo.",
  "✅ Step marked complete": "✅ Paso marcado como completo",
  "🛡️ You earned the SSN Hero badge!": "🛡️ ¡Ganaste la insignia de Héroe SSN!",
  "Go to IRS.gov/IPPIN": "Ir a IRS.gov/IPPIN",
  "Create or sign in to your IRS Online Account": "Crea o inicia sesión en tu cuenta en línea del IRS",
  "Verify your identity with ID.me (photo ID required)": "Verifica tu identidad con ID.me (se requiere identificación con foto)",
  "Receive your 6-digit IP PIN": "Recibe tu PIN IP de 6 dígitos",
  "Write it down and store it somewhere safe": "Escríbelo y guárdalo en un lugar seguro",
  "Use it on your next tax return": "Úsalo en tu próxima declaración de impuestos",

  // Learn
  "🎓 Learn": "🎓 Aprender",
  "KinGuard Lessons": "Lecciones de KinGuard",
  "Know Your Scams": "Conoce las Estafas",
  "Tap any card to learn more": "Toca cualquier tarjeta para aprender más",
  "Watch & Learn 🎥": "Mira y Aprende 🎥",
  "Real scam situations explained in plain language — coming soon": "Situaciones reales de estafas explicadas en lenguaje sencillo — próximamente",
  "Coming Soon": "Próximamente",
  "This video is coming soon! Check back for updates.": "¡Este video viene pronto! Vuelve para ver actualizaciones.",
  "This Week's Challenge 🧠": "Reto de esta semana 🧠",
  "Loading questions…": "Cargando preguntas…",
  "Test what you know. Questions change every two weeks.": "Pon a prueba lo que sabes. Las preguntas cambian cada dos semanas.",
  "Question": "Pregunta",
  "of": "de",
  "✅ Correct!": "✅ ¡Correcto!",
  "❌ Not quite.": "❌ No exactamente.",
  "Next Question →": "Siguiente pregunta →",
  "🎉 You finished this week's challenge!": "🎉 ¡Terminaste el reto de esta semana!",
  "What it looks like:": "Cómo se ve:",
  "Red flags:": "Señales de alerta:",
  "→ Go to SSN Shield": "→ Ir al Escudo SSN",
  "IRS / Government Scams": "Estafas del IRS / Gobierno",
  "Tech Support Scams": "Estafas de soporte técnico",
  "Grandparent Scams": "Estafas del abuelito",
  "Medicare / Health Scams": "Estafas de Medicare / Salud",
  "Romance Scams": "Estafas románticas",
  "SSN Theft Scams": "Estafas de robo de SSN",

  // Profile
  "👤 Profile": "👤 Perfil",
  "Name:": "Nombre:",
  "Role:": "Rol:",
  "Phone:": "Teléfono:",
  "Protected Senior": "Persona Mayor Protegida",
  "Guardian": "Guardián",
  "Your invite code:": "Tu código de invitación:",
  "Share this with up to 5 family members. Each can link to you with this same code.": "Comparte esto con hasta 5 familiares. Cada uno puede vincularse contigo con este mismo código.",
  "My Badges 🏅": "Mis Insignias 🏅",
  "My Guardians:": "Mis Guardianes:",
  "slot available": "espacio disponible",
  "slots available": "espacios disponibles",
  "No one is linked yet. Share your invite code above.": "Aún nadie está vinculado. Comparte tu código de invitación arriba.",
  "Linked:": "Vinculado:",
  "Last viewed your alerts:": "Vio tus alertas por última vez:",
  "Total alerts reviewed:": "Total de alertas revisadas:",
  "Active": "Activo",
  "Inactive": "Inactivo",
  "Never checked": "Nunca revisó",
  "Never checked alerts": "Nunca revisó alertas",
  "Never": "Nunca",
  "Phone not provided": "Teléfono no proporcionado",
  "🗑️ Remove Guardian": "🗑️ Eliminar Guardián",
  "You've reached the maximum of 5 guardians. Remove one before adding another.": "Has alcanzado el máximo de 5 guardianes. Elimina uno antes de agregar otro.",
  "Could not remove. Try again.": "No se pudo eliminar. Inténtalo de nuevo.",
  "✅ Guardian removed": "✅ Guardián eliminado",
  "Guardian Activity": "Actividad del Guardián",
  "No guardian activity yet. When your guardians open the app or view your alerts, you'll see it here.": "Aún no hay actividad. Cuando tus guardianes abran la app o vean tus alertas, lo verás aquí.",
  "has never viewed your alerts": "nunca ha visto tus alertas",
  "opened the app": "abrió la app",
  "viewed your": "vio tu",
  "acknowledged your": "reconoció tu",
  "called you about your": "te llamó por tu",
  "blocked the sender of your": "bloqueó al remitente de tu",
  "alert": "alerta",
  "🔒 Privacy & Safety": "🔒 Privacidad y Seguridad",
  "🗑️ Delete My Account": "🗑️ Eliminar mi cuenta",
  "Are you sure?": "¿Estás seguro/a?",
  "This will permanently delete your account and all your data. This cannot be undone.": "Esto eliminará permanentemente tu cuenta y todos tus datos. Esto no se puede deshacer.",
  "Yes, Delete My Account": "Sí, eliminar mi cuenta",
  "Deleting…": "Eliminando…",
  "Cancel": "Cancelar",
  "Your account has been deleted.": "Tu cuenta ha sido eliminada.",
  "Could not delete account. Try again.": "No se pudo eliminar la cuenta. Inténtalo de nuevo.",

  // ScoreCard / Badges
  "Current badge": "Insignia actual",
  "Just getting started": "Apenas comenzando",
  "Correct": "Correctas",
  "Streak": "Racha",
  "Accuracy": "Precisión",
  "Best streak:": "Mejor racha:",
  "weeks": "semanas",
  "Close": "Cerrar",
  "✅ Earned!": "✅ ¡Obtenida!",
  "🔒 Not yet earned": "🔒 Aún no obtenida",

  // Guardian alerts
  "🚨 KinGuard Alert": "🚨 Alerta de KinGuard",
  "flagged a suspicious message.": "marcó un mensaje sospechoso.",
  "Type:": "Tipo:",
  "Risk Score:": "Puntuación de riesgo:",
  "Channel:": "Canal:",
  "Tap to view full details.": "Toca para ver los detalles completos.",
  "🆘 SOS Alert": "🆘 Alerta SOS",
  "has pressed the emergency help button and needs assistance.": "ha presionado el botón de ayuda de emergencia y necesita asistencia.",
  "Tap to call them immediately.": "Toca para llamar de inmediato.",
  "Text": "Texto",
  "Call": "Llamada",
  "SSN Request": "Solicitud de SSN",
  "Message": "Mensaje",
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (s: string) => string };
const I18nCtx = createContext<Ctx>({ lang: "en", setLang: () => {}, t: (s) => s });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("kg_lang") as Lang | null;
      if (stored === "en" || stored === "es") setLangState(stored);
    } catch {}
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("kg_lang", l); } catch {}
  };

  const t = (s: string) => (lang === "es" ? DICT[s] ?? s : s);

  return <I18nCtx.Provider value={{ lang, setLang, t }}>{children}</I18nCtx.Provider>;
}

export const useI18n = () => useContext(I18nCtx);

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useI18n();
  return (
    <div className={`inline-flex rounded-full overflow-hidden border-2 ${className}`} style={{ borderColor: "var(--color-rose)" }}>
      <button
        type="button"
        onClick={() => setLang("en")}
        className="px-3 py-1 text-sm font-bold"
        style={{ background: lang === "en" ? "var(--color-rose)" : "transparent", color: lang === "en" ? "#fff" : "var(--color-rose)" }}
        aria-pressed={lang === "en"}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("es")}
        className="px-3 py-1 text-sm font-bold"
        style={{ background: lang === "es" ? "var(--color-rose)" : "transparent", color: lang === "es" ? "#fff" : "var(--color-rose)" }}
        aria-pressed={lang === "es"}
      >
        ES
      </button>
    </div>
  );
}
