import { sql, requireSession, json, fail } from "../_lib/auth.js";

export default async function handler(req,res) {
  if (req.method!=="POST") return fail(res,405,"method_not_allowed","Use POST.");
  try {
    const session=await requireSession(req);
    if (!session) return fail(res,401,"unauthorized","A valid Xedruo session is required.");
    await sql.query("update public.xedruo_auth_sessions set revoked_at=now() where id=$1 and revoked_at is null",[session.sid]);
    return json(res,200,{ok:true,signed_out:true});
  } catch(e) {
    console.error("logout_failed",e);
    return fail(res,500,"logout_failed","Unable to sign out this session.");
  }
}
