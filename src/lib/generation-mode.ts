export type GenerationMode =
  | "image-to-image"
  | "text-to-image"
  | "pure-landscape";

const PURE_LANDSCAPE_MARKERS = [
  "인물이 전혀 등장하지 않는",
  "순수한 풍경",
  "사람이 없는 풍경",
  "인물 없는 풍경",
];

export function isPureLandscapePrompt(prompt: string): boolean {
  return PURE_LANDSCAPE_MARKERS.some((marker) => prompt.includes(marker));
}

export function selectGenerationMode(
  prompt: string,
  hasUserImage: boolean,
): GenerationMode {
  if (isPureLandscapePrompt(prompt)) return "pure-landscape";
  if (hasUserImage) return "image-to-image";
  return "text-to-image";
}
