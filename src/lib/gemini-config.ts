const GEMINI_CONFIGURATION_ERROR_MARKERS = [
  "could not load the default credentials",
  "api key",
  "authentication",
  "unauthenticated",
  "permission_denied",
];

export function getGeminiApiKey(
  environment: Record<string, string | undefined> = process.env,
): string | null {
  const apiKey = environment.GEMINI_API_KEY?.trim();
  return apiKey || null;
}

export function getGeminiClientOptions(apiKey: string) {
  return {
    apiKey,
    enterprise: false as const,
  };
}

export function isGeminiConfigurationError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return GEMINI_CONFIGURATION_ERROR_MARKERS.some((marker) =>
    message.includes(marker),
  );
}
