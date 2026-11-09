import { sql, json, fail } from "../_lib/auth.js";

export default async function handler(req,res) {
  if (req.method!=="GET") return fail(res,405,"method_not_allowed","Use GET.");
  try {
    const rows = await sql.query("select current_database() as database, now() as database_time");
    return json(res,200,{ok:true,service:"xedruo-central-auth",database:rows[0].database,time:rows[0].database_time});
  } catch(e) {
    console.error("auth_health_failed",e);
    return fail(res,503,"database_unavailable","Central authentication database is unavailable.");
  }
}
