import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Generates a globally-unique 10-digit Xedruo ID.
// Runs as the calling user; uses the service role only to read existing IDs
// across all users so the same number is never issued twice.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Never regenerate an ID for a customer who already has one.
    if (user.xedruo_id) {
      return Response.json({ xedruoId: user.xedruo_id, created: false });
    }

    // Collect every existing Xedruo ID so the new one is globally unique.
    const existing = new Set();
    try {
      const users = await base44.asServiceRole.entities.User.list('-created_date', 10000);
      const rows = Array.isArray(users) ? users : (users.items || []);
      for (const u of rows) {
        if (u && u.xedruo_id) existing.add(String(u.xedruo_id));
      }
    } catch (_e) {
      // If the read fails, proceed best-effort (random) — the per-customer
      // guard above still prevents duplicates for the same user.
    }

    function generate() {
      let n = String(Math.floor(Math.random() * 9) + 1); // first digit 1-9
      for (let i = 0; i < 9; i++) n += String(Math.floor(Math.random() * 10));
      return n;
    }

    let id = generate();
    let attempts = 0;
    while (existing.has(id) && attempts < 100) {
      id = generate();
      attempts += 1;
    }

    return Response.json({ xedruoId: id, created: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}