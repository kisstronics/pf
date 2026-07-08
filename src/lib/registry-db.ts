import "server-only";

import fs from "fs";
import { getRegistryDbPath, getTemplatePath, getUsersDir } from "./data-dir";

let ensured = false;

export async function ensureRegistryDatabase(): Promise<void> {
  if (ensured) return;

  fs.mkdirSync(getUsersDir(), { recursive: true });

  const dbPath = getRegistryDbPath();
  if (fs.existsSync(dbPath) && fs.statSync(dbPath).size > 0) {
    ensured = true;
    return;
  }

  const template = getTemplatePath("registry");
  if (!fs.existsSync(template)) {
    throw new Error(
      "Registry database template is missing. Redeploy the app so build templates are generated."
    );
  }

  fs.copyFileSync(template, dbPath);
  ensured = true;
}
