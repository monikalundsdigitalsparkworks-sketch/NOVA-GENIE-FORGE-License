import { createClient } from '@supabase/supabase-js';

const LICENSE_RE = /^NOVA-[A-Z0-9]{8}$/; // NOVA-XXXXXXXX

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { license, userId = 'anon', genieId = 'nova-squad' } = req.body || {};
  if (!license || !LICENSE_RE.test(license))
    return res.status(400).json({ ok: false, reason: 'invalid_format' });

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY! // <-- service role key
  );

  const { data, error } = await supabase
    .from('licenses')
    .select('*')
    .eq('license_id', license)
    .single();

  if (error || !data) return res.status(404).json({ ok: false, reason: 'not_found' });
  if (data.status !== 'active') return res.status(403).json({ ok: false, reason: data.status });

  const expired = data.expires_at && new Date(data.expires_at) < new Date();
  if (expired) return res.status(403).json({ ok: false, reason: 'expired' });

  const fp = Seat:${String(userId).slice(-4)}•${String(data.fingerprint_salt).slice(0,4)};
  const watermark = data.tier === 'trial' ? 'Trial • NOVA Genie Forge™' : '';

  return res.status(200).json({ ok: true, tier: data.tier, watermark, fingerprint: fp, genieId });
}
