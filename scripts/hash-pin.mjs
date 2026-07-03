// Usage: node scripts/hash-pin.mjs <your-pin>
// Outputs the bcrypt hash to paste into the SQL migration.
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const bcrypt = require("bcryptjs");

const pin = process.argv[2];
if (!pin) {
  console.error("Usage: node scripts/hash-pin.mjs <your-pin>");
  process.exit(1);
}

const hash = await bcrypt.hash(String(pin), 10);
console.log("\nPIN hash (paste into SQL):\n");
console.log(hash);
console.log();
