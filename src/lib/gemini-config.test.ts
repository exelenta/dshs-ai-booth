import assert from "node:assert/strict";
import test from "node:test";
import {
  getGeminiApiKey,
  getGeminiClientOptions,
  isGeminiConfigurationError,
} from "./gemini-config.ts";

test("Gemini API 키의 앞뒤 공백을 제거한다", () => {
  assert.equal(getGeminiApiKey({ GEMINI_API_KEY: "  test-key  " }), "test-key");
});

test("Gemini API 키가 비어 있으면 설정되지 않은 것으로 처리한다", () => {
  assert.equal(getGeminiApiKey({}), null);
  assert.equal(getGeminiApiKey({ GEMINI_API_KEY: "   " }), null);
});

test("Google Cloud 기본 인증 오류를 설정 오류로 분류한다", () => {
  assert.equal(
    isGeminiConfigurationError(
      new Error("Could not load the default credentials."),
    ),
    true,
  );
});

test("배포 환경과 관계없이 Gemini API 키 인증 방식을 사용한다", () => {
  assert.deepEqual(getGeminiClientOptions("test-key"), {
    apiKey: "test-key",
    enterprise: false,
  });
});
