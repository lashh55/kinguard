import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { GuardianDisclaimer } from "@/components/GuardianDisclaimer";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

type Req = { link_id: string; full_name: string; relationship_label: string | null; created_at: string };

/** Senior-side: approve or decline people who entered this senior's invite code. */
export function GuardianRequests({ onChange }: { onChange?: () => void }) {
  const { lang } = useI18n();
  const es = lang === "es";
  const [reqs, setReqs] = useState<Req[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () =>
    supabase.rpc("get_pending_guardian_requests").then(({ data }) => setReqs((data as Req[]) ?? []));

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const respond = async (r: Req, approve: boolean) => {
    setBusy(r.link_id);
    const { error } = await supabase.rpc("respond_guardian_request", { _link_id: r.link_id, _approve: approve });
    setBusy(null);
    if (error) {
      toast.error(error.message.includes("KINGUARD_SENIOR_GUARDIAN_LIMIT")
        ? (es ? "Usted ha alcanzado el máximo de 3 guardianes. Quite uno antes de agregar otro." : "You've reached the maximum of 3 guardians. Remove one before adding another.")
        : error.message);
      return;
    }
    setReqs((p) => p.filter((x) => x.link_id !== r.link_id));
    onChange?.();
  };

  if (!reqs.length) return null;
  return (
    <section className="px-5 mb-3 space-y-3">
      {reqs.map((r) => {
        const name = r.full_name;
        return (
          <div key={r.link_id} className="card-soft" style={{ border: "3px solid var(--color-rose)" }}>
            <p className="font-bold text-lg">
              {es
                ? `${name} quiere ser su guardián. ¿Conoce y confía en esta persona?`
                : `${name} wants to be your guardian. Do you know and trust this person?`}
            </p>
            {r.relationship_label && (
              <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>({r.relationship_label})</p>
            )}
            <div className="flex gap-2 mt-3">
              <button className="btn-base btn-primary flex-1" disabled={busy === r.link_id} onClick={() => respond(r, true)}>
                {es ? "Aprobar" : "Approve"}
              </button>
              <button className="btn-base btn-outline flex-1" disabled={busy === r.link_id} onClick={() => respond(r, false)}>
                {es ? "Rechazar" : "Decline"}
              </button>
            </div>
          </div>
        );
      })}
    </section>
  );
}

type Notice = { id: string; new_guardian_name: string; senior_name: string; created_at: string; notice_kind: string };

function useGuardianChangeNotices(seniorOnly: boolean) {
  const [items, setItems] = useState<Notice[]>([]);
  useEffect(() => {
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | undefined;
    const load = async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid || !active) return;
      let query = supabase.from("guardian_notices").select("id,new_guardian_name,senior_name,created_at,notice_kind")
        .eq("guardian_id", uid).is("read_at", null).order("created_at", { ascending: false });
      if (seniorOnly) query = query.eq("senior_id", uid).eq("notice_kind", "added");
      const { data, error } = await query;
      if (active && !error) setItems((data as Notice[]) ?? []);
      if (active && !channel) {
        channel = supabase.channel(`guardian-changes-${uid}-${seniorOnly}`)
          .on("postgres_changes", { event: "*", schema: "public", table: "guardian_notices", filter: `guardian_id=eq.${uid}` }, () => { void load(); })
          .subscribe((status) => { if (status === "SUBSCRIBED") void load(); });
      }
    };
    void load();
    const interval = setInterval(() => { void load(); }, 15000);
    const onFocus = () => { void load(); };
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [seniorOnly]);
  return { items, setItems };
}

/** Senior-side: "X is now your guardian. Don't know this person? Remove them." */
export function SeniorGuardianNotice() {
  const { lang } = useI18n();
  const es = lang === "es";
  const { items, setItems } = useGuardianChangeNotices(true);
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const dismiss = async (id: string) => {
    if (!accepted[id] || saving) return;
    setSaving(id);
    const { error } = await supabase.from("guardian_notices").update({ read_at: new Date().toISOString() }).eq("id", id);
    setSaving(null);
    if (error) { toast.error(error.message); return; }
    setItems((p) => p.filter((x) => x.id !== id));
  };
  if (!items.length) return null;
  return (
    <section className="px-5 mb-3 space-y-2" aria-live="polite">
      {items.map((n) => (
        <div key={n.id} className="card-soft border-rose border-2">
          <p className="font-bold">
            🔔 {es
              ? `${n.new_guardian_name} ahora es su guardián. ¿No conoce a esta persona? Quítela.`
              : `${n.new_guardian_name} is now your guardian. Don't know this person? Remove them.`}
          </p>
          <div className="mt-3"><GuardianDisclaimer /></div>
          <label htmlFor={`guardian-disclaimer-${n.id}`} className="flex items-start gap-3 mt-4 cursor-pointer leading-relaxed">
            <Checkbox
              id={`guardian-disclaimer-${n.id}`}
              required
              className="h-6 w-6 mt-1"
              checked={accepted[n.id] === true}
              onCheckedChange={(checked) => setAccepted((prev) => ({ ...prev, [n.id]: checked === true }))}
            />
            <span>{es ? "Entiendo. Yo elegí a este guardián." : "I understand. I chose this guardian myself."}</span>
          </label>
          <div className="flex flex-wrap gap-3 mt-4 items-center">
            <Button asChild variant="outline" className="h-auto min-h-11 whitespace-normal">
              <a href="/profile">
              {es ? "Ver mis guardianes" : "View my guardians"}
              </a>
            </Button>
            <Button disabled={!accepted[n.id] || saving !== null} onClick={() => dismiss(n.id)}>{es ? "Entendido" : "OK"}</Button>
          </div>
        </div>
      ))}
    </section>
  );
}

/** Guardian-side: "X was added as a guardian for Y" notices. */
export function GuardianNotices() {
  const { lang } = useI18n();
  const es = lang === "es";
  const { items, setItems } = useGuardianChangeNotices(false);
  const [saving, setSaving] = useState<string | null>(null);
  const dismiss = async (id: string) => {
    if (saving) return;
    setSaving(id);
    const { error } = await supabase.from("guardian_notices").update({ read_at: new Date().toISOString() }).eq("id", id);
    setSaving(null);
    if (error) { toast.error(error.message); return; }
    setItems((p) => p.filter((x) => x.id !== id));
  };
  if (!items.length) return null;
  return (
    <section className="px-5 mb-3 space-y-2" aria-live="polite">
      {items.map((n) => (
        <div key={n.id} className="card-soft flex items-center gap-3">
          <p className="flex-1 font-bold">
            {n.notice_kind === "money_check"
              ? (es ? `${n.senior_name.replace(/\.$/, "")} quiere consultar con usted antes de enviar dinero. Por favor llámele.` : `${n.senior_name} wants to check with you before sending money. Please call them.`)
              : n.notice_kind === "removed"
              ? (es ? `Se quitó a un guardián de la cuenta de ${n.senior_name}${n.senior_name.endsWith(".") ? "" : "."}` : `A guardian was removed from ${n.senior_name}'s account.`)
              : (es ? `${n.new_guardian_name} fue agregado como guardián de ${n.senior_name}${n.senior_name.endsWith(".") ? "" : "."}` : `${n.new_guardian_name} was added as a guardian for ${n.senior_name}${n.senior_name.endsWith(".") ? "" : "."}`)}
          </p>
          <Button variant="link" disabled={saving !== null} onClick={() => dismiss(n.id)}>{es ? "Entendido" : "OK"}</Button>
        </div>
      ))}
    </section>
  );
}
