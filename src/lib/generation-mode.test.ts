import assert from "node:assert/strict";
import test from "node:test";

import {
  isPureLandscapePrompt,
  selectGenerationMode,
} from "./generation-mode.ts";

test("사진이 있으면 이미지 변환 모드를 사용한다", () => {
  assert.equal(selectGenerationMode("웃고 있는 가족", true), "image-to-image");
});

test("사진 없이도 인물이 요청되면 텍스트 이미지 모드를 사용한다", () => {
  assert.equal(selectGenerationMode("웃고 있는 가족", false), "text-to-image");
});

test("순수 풍경 요청은 사진 유무와 관계없이 인물을 제외한다", () => {
  assert.equal(
    selectGenerationMode("인물이 전혀 등장하지 않는 순수한 풍경", true),
    "pure-landscape",
  );
  assert.equal(isPureLandscapePrompt("사람이 없는 풍경"), true);
});
