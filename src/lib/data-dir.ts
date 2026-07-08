import path from "path";

export function getDataDir(): string {
  if (process.env.DATA_DIR) {
    return process.env.DATA_DIR;
  }

  // Amplify / Lambda: only /tmp is writable and persists for the lifetime of the instance.
  if (
    process.env.AWS_EXECUTION_ENV ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.AMPLIFY_APP_ID
  ) {
    return path.join("/tmp", "personal-finance");
  }

  return path.join(process.cwd(), "prisma");
}

export function getUsersDir(): string {
  return path.join(getDataDir(), "users");
}

export function getRegistryDbPath(): string {
  return path.join(getDataDir(), "registry.db");
}

export function getRegistryDbUrl(): string {
  return `file:${getRegistryDbPath()}`;
}

export function getTemplatePath(name: "user" | "registry"): string {
  return path.join(process.cwd(), "prisma", "templates", `${name}-template.db`);
}
