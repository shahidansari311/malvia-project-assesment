const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

// Test connection on startup
supabase
  .from("markets")
  .select("id", { count: "exact", head: true })
  .then(({ error }) => {
    if (error) {
      console.error("❌ Database connection failed:", error.message);
    } else {
      console.log("✅ Database connected successfully (Supabase HTTPS)");
    }
  });

module.exports = supabase;
