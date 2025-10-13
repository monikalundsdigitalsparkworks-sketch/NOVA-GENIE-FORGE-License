import fetch from "node-fetch";
import Papa from "papaparse";

export default async function handler(req, res) {
  const url = process.env.VIRAL_INTEL_CSV_URL;
  if (!url) return res.status(500).json({ ok:false, reason:"missing_env" });

  try {
    const csv = await (await fetch(url)).text();
    const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
    // Clean empty rows (Papa often adds one)
    const items = parsed.data.filter(row => Object.values(row).some(v => String(v||"").trim() !== ""));
    return res.status(200).json({ ok: true, count: items.length, items });
  } catch (e) {
    return res.status(500).json({ ok:false, reason:"fetch_failed", error:String(e) });
  }
}
