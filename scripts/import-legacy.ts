/**
 * Imports signatures exported from the previous signature provider.
 *
 *   npx tsx --env-file=.env.local scripts/import-legacy.ts <dir>
 *
 * <dir> must contain signatures.json (full records, at least one) and dashboard_list.json ([{ id, name, email }]).
 * In production, POST the same data to /api/admin/import-legacy instead.
 */
import { readFileSync } from "fs";
import path from "path";
import { importLegacy } from "../src/lib/legacyImport";

const dir = process.argv[2] || path.join(process.env.USERPROFILE || process.env.HOME || ".", "research", "export");
const read = (f: string) => JSON.parse(readFileSync(path.join(dir, f), "utf8"));

importLegacy(read("signatures.json"), read("dashboard_list.json"))
  .then((r) => {
    if (r.generatorCreated) console.log("created generator /g/dre-team");
    console.log(`imported ${r.created}, skipped ${r.skipped} already imported, full data for ${r.fullRecords}`);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
