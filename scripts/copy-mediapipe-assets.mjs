import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceDirectory = join(
  projectRoot,
  "node_modules",
  "@mediapipe",
  "selfie_segmentation",
);
const targetDirectory = join(
  projectRoot,
  "public",
  "mediapipe",
  "selfie-segmentation",
);

const assets = [
  "selfie_segmentation.js",
  "selfie_segmentation.binarypb",
  "selfie_segmentation.tflite",
  "selfie_segmentation_landscape.tflite",
  "selfie_segmentation_solution_simd_wasm_bin.data",
  "selfie_segmentation_solution_simd_wasm_bin.js",
  "selfie_segmentation_solution_simd_wasm_bin.wasm",
  "selfie_segmentation_solution_wasm_bin.js",
  "selfie_segmentation_solution_wasm_bin.wasm",
];

await mkdir(targetDirectory, { recursive: true });
await Promise.all(
  assets.map((asset) =>
    copyFile(join(sourceDirectory, asset), join(targetDirectory, asset)),
  ),
);

console.log(`Copied ${assets.length} MediaPipe assets to public/mediapipe.`);
