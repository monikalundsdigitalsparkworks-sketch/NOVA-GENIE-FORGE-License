import { createClient } from '@supabase/supabase-js';

const LICENSE_RE = /^NOVA-[A-Z0-9]{8}$/;

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ ok: false, reason: 'method_not_allowed' });

  const { license, userId, genieId } = req.body || {};
  if (!license || !userId || !genieId)
    return res.status(400).json({ ok: false, reason: 'missing_fields' });
  if (!LICENSE_RE.test(license))
    return res.status(400).json({ ok: false, reason: 'invalid_format' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  const { data, error } = await supabase
    .from('licenses')
    .select('tier, expires_at')
    .eq('license_id', license)
    .maybeSingle();

  if (error) return res.status(500).json({ ok: false, reason: 'db_error' });
  if (!data) return res.status(404).json({ ok: false, reason: 'not_found' });

  const expired = data.expires_at && new Date(data.expires_at) < new Date();
  if (expired) return res.status(403).json({ ok: false, reason: 'expired' });

  const watermark = data.tier === 'trial' ? '🔒 Trial · NOVA Genie Forge' : '';
  return res.status(200).json({
    ok: true,
    tier: data.tier,
    watermark,
    fingerprint: ${userId}-${genieId}
  });
}
