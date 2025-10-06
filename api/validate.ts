import { createClient } from "@supabase/supabase-js";

// NOVA-XXXXXXXX (A–Z 0–9)
const LICENSE_RE = /^NOVA-[A-Z0-9]{8}$/;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, reason: "method_not_allowed" });
  }
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { license, userId, genieId } = body;

    if (!license || !LICENSE_RE.test(license)) {
      return res.status(400).json({ ok: false, reason: "invalid_format" });
    }
    if (!userId || !genieId) {
      return res.status(400).json({ ok: false, reason: "missing_fields" });
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

    const { data: lic, error } = await supabase
      .from("licenses")
      .select("*")
      .eq("license_id", license)
      .single();

    if (error || !lic) return res.status(404).json({ ok: false, reason: "not_found" });
    if (lic.status !== "active") return res.status(403).json({ ok: false, reason: lic.status });

    const expired = lic.expires_at && new Date(lic.expires_at) < new Date();
    if (expired) return res.status(403).json({ ok: false, reason: "expired" });

    // Optional scope check (uncomment if you created the join table):
    // const { data: scope } = await supabase
    //   .from("license_genies")
    //   .select("genie_id")
    //   .eq("license_id", license)
    //   .eq("genie_id", genieId)
    //   .maybeSingle();
    // if (!scope) return res.status(403).json({ ok: false, reason: "not_authorized_for_genie" });

    const watermark = lic.tier === "trial" ? "Trial • NOVA Genie Forge™" : "";
    const fingerprint =
      Seat:${String(userId).slice(-4)}•${String(lic.fingerprint_salt || "").slice(0, 4)};

    return res.status(200).json({ ok: true, tier: lic.tier, watermark, fingerprint });
  } catch (e) {
    return res.status(500).json({ ok: false, reason: "server_error", detail: String(e.message || e) });
  }
}
