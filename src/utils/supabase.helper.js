const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl =
  process.env.SUPABASE_URL || "https://ivhrpetuemmqnmowsywk.supabase.co";
const supabaseKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY;

if (!supabaseKey) {
  console.warn(
    "⚠️ Warning: Neither SUPABASE_ANON_KEY nor SUPABASE_SERVICE_ROLE_KEY is defined in environment variables."
  );
}

// Safely initialize Supabase client or proxy fallback to prevent startup crashes when key is not set
const supabase = supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : new Proxy(
      {},
      {
        get(_, prop) {
          if (prop === "from" || prop === "storage") {
            return () => {
              throw new Error(
                "SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY is missing in environment variables. Please configure SUPABASE_ANON_KEY in Railway Variables tab."
              );
            };
          }
          return undefined;
        }
      }
    );

module.exports = supabase;
