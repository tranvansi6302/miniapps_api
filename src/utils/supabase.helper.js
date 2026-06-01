const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL || "https://ivhrpetuemmqnmowsywk.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.warn("⚠️ Warning: Neither SUPABASE_ANON_KEY nor SUPABASE_SERVICE_ROLE_KEY is defined in your .env file.");
}

const supabase = createClient(supabaseUrl, supabaseKey || "");

module.exports = supabase;
