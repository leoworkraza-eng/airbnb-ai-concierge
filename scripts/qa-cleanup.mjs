import fs from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Supabase service credentials are unavailable.");
  process.exit(1);
}

const files = process.argv.slice(2);
if (!files.length) files.push(".qa/artifacts.json");

const emails = new Set();
for (const file of files) {
  try {
    const data = JSON.parse(await fs.readFile(file, "utf8"));
    for (const email of Object.values(data.emails ?? {})) {
      if (typeof email === "string" && /^qa-[^@]+@example\.com$/i.test(email)) {
        emails.add(email.toLowerCase());
      }
    }
  } catch (error) {
    console.warn(`Could not read ${file}: ${error.message}`);
  }
}

if (!emails.size) {
  console.log("No QA emails found. Nothing to clean.");
  process.exit(0);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

for (const email of emails) {
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email);
  if (profileError) throw new Error(`profiles ${email}: ${profileError.message}`);

  for (const profile of profiles ?? []) {
    const { data: properties, error: propertyError } = await supabase
      .from("properties")
      .select("id")
      .eq("host_id", profile.id);
    if (propertyError) throw new Error(`properties ${email}: ${propertyError.message}`);

    const propertyIds = (properties ?? []).map((property) => property.id);
    if (propertyIds.length) {
      const { error } = await supabase.from("properties").delete().in("id", propertyIds);
      if (error) throw new Error(`delete properties ${email}: ${error.message}`);
    }

    const { error: profileDeleteError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", profile.id);
    if (profileDeleteError) {
      throw new Error(`delete profile ${email}: ${profileDeleteError.message}`);
    }
  }

  let page = 1;
  let authUser = null;
  while (!authUser) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw new Error(`list auth users: ${error.message}`);
    authUser =
      data.users.find((user) => user.email?.toLowerCase() === email) ?? null;
    if (data.users.length < 200) break;
    page += 1;
  }

  if (authUser) {
    const { error } = await supabase.auth.admin.deleteUser(authUser.id);
    if (error) throw new Error(`delete auth user ${email}: ${error.message}`);
  }

  console.log(`Cleaned ${email}`);
}
