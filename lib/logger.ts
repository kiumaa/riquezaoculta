export function logInfo(scope: string, message: string, data?: unknown) {
  const base = `[${new Date().toISOString()}] [${scope}] ${message}`;
  if (data !== undefined) {
    console.log(base, data);
    return;
  }
  console.log(base);
}

export function logError(scope: string, message: string, error?: unknown) {
  const base = `[${new Date().toISOString()}] [${scope}] ${message}`;
  if (error !== undefined) {
    console.error(base, error);
    return;
  }
  console.error(base);
}
