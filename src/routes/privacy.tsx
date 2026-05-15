import { createFileRoute, Link } from "@tanstack/react-router";
import { ScreenShell } from "@/components/ScreenShell";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy & Safety — KinGuard" },
      { name: "description", content: "How KinGuard protects your data and what we never collect." },
    ],
  }),
});

function PrivacyPage() {
  return (
    <ScreenShell>
      <header className="px-5 pt-6 pb-3">
        <h1>🔒 Privacy &amp; Safety</h1>
      </header>

      {/* SSN Banner */}
      <section className="px-5">
        <div className="rounded-2xl p-4 text-center" style={{ background: "#E74C3C", color: "#fff", fontSize: 15 }}>
          <p className="font-extrabold mb-1" style={{ fontSize: 17 }}>🚨 KinGuard will NEVER ask for your Social Security Number</p>
          <p>We do not collect it, store it, or transmit it — ever. If you see any field asking for your Social Security Number you are NOT on KinGuard. Leave that page immediately and report it to us at <span className="underline">safety@getkinguard.com</span>.</p>
        </div>
      </section>

      <Section title="What We Collect">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          <div className="rounded-2xl p-4" style={{ background: "color-mix(in oklab, #2ECC71 18%, #fff)" }}>
            <p className="font-extrabold mb-2" style={{ color: "#1f7a45" }}>What We DO Collect</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Full name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Encrypted password</li>
              <li>Role (Senior or Guardian)</li>
              <li>Messages submitted for scam analysis</li>
              <li>Scam alert history</li>
              <li>SSN Shield checklist progress (no SSN)</li>
              <li>Quiz scores and badge progress</li>
              <li>Guardian relationships</li>
            </ul>
          </div>
          <div className="rounded-2xl p-4" style={{ background: "color-mix(in oklab, #E74C3C 14%, #fff)" }}>
            <p className="font-extrabold mb-2" style={{ color: "#a02c20" }}>What We NEVER Collect</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Social Security Number</li>
              <li>Bank account numbers</li>
              <li>Credit card information</li>
              <li>Medicare or Medicaid number</li>
              <li>Date of birth</li>
              <li>Home address</li>
              <li>Government ID numbers</li>
              <li>Location or GPS data</li>
              <li>Contacts or call history</li>
              <li>Financial account information</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section title="How We Use Your Information" bg="#ACD0DC">
        <p>We use your data only to:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Analyze messages for scam threats</li>
          <li>Connect you with your guardians</li>
          <li>Send real-time alerts to guardians</li>
          <li>Track quiz and badge progress</li>
          <li>Improve the app anonymously</li>
        </ul>
        <p className="mt-2 font-bold">We do not sell, share, or use your data for advertising. Ever.</p>
      </Section>

      <Section title="How Data Is Stored" bg="#F6EFC1">
        <ul className="list-disc pl-5 space-y-1">
          <li>Passwords encrypted, never plain text</li>
          <li>All data transmitted over HTTPS</li>
          <li>Your data is locked to your account only — no other user can see it</li>
          <li>Guardians see only what you permit</li>
          <li>Submitted messages not shared externally</li>
        </ul>
      </Section>

      <Section title="Guardian System &amp; Trust" bg="#DFC18F">
        <ul className="list-disc pl-5 space-y-1">
          <li>Maximum 5 guardians per senior</li>
          <li>Only the senior can invite guardians</li>
          <li>Senior can remove any guardian anytime</li>
          <li>Guardians cannot change senior settings</li>
          <li>Each alert shows scam type and score only</li>
        </ul>
      </Section>

      <Section title="AI Analysis" bg="#ACD0DC">
        <ul className="list-disc pl-5 space-y-1">
          <li>Messages analyzed without personal info</li>
          <li>Text content only — no attachments</li>
          <li>Anthropic does not train on submissions</li>
          <li>Never include passwords or SSNs in submitted messages</li>
        </ul>
      </Section>

      <Section title="Your Rights" bg="#F6EFC1">
        <ul className="list-disc pl-5 space-y-1">
          <li>Access your data anytime</li>
          <li>Correct name, phone, email in settings</li>
          <li>Delete your account from your Profile screen</li>
          <li>Remove any guardian anytime</li>
          <li>Opt out of non-essential communications</li>
        </ul>
        <p className="mt-2">Contact: <span className="font-bold">privacy@getkinguard.com</span></p>
      </Section>

      <Section title="Children" bg="#F5E6E5">
        <p>KinGuard is for adults 18 and older only. Contact <span className="font-bold">safety@getkinguard.com</span> to report underage accounts.</p>
      </Section>

      <Section title="Contact" bg="#B27F7C" color="#fff">
        <p>privacy@getkinguard.com</p>
        <p>safety@getkinguard.com</p>
        <p className="mt-2 font-bold">empowerment4ai | empowerment4life LLC</p>
        <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.8)" }}>Last updated: May 2026</p>
      </Section>

      <div className="px-5 mt-6 mb-4">
        <Link to="/profile" className="btn-base btn-outline w-full">← Back to profile</Link>
      </div>
    </ScreenShell>
  );
}

function Section({ title, children, bg, color }: { title: string; children: React.ReactNode; bg?: string; color?: string }) {
  return (
    <section className="px-5 mt-5">
      <h2 className="mb-2">{title}</h2>
      <div className="card-soft" style={{ background: bg, color: color }}>{children}</div>
    </section>
  );
}