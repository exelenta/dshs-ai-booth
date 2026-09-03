import assert from "node:assert/strict";
import test from "node:test";

import {
  isValidKoreanPhoneInput,
  normalizeKoreanPhoneNumber,
} from "./phone.ts";

test("국내 휴대폰 번호를 국제 형식으로 정규화한다", () => {
  assert.equal(normalizeKoreanPhoneNumber("010-1234-5678"), "01012345678");
});

test("국제 형식 번호를 Solapi 국내 형식으로 변환한다", () => {
  assert.equal(normalizeKoreanPhoneNumber("+82 10 1234 5678"), "01012345678");
});

test("휴대폰 번호가 아닌 입력을 거부한다", () => {
  assert.equal(isValidKoreanPhoneInput("053-123-4567"), false);
  assert.equal(isValidKoreanPhoneInput("전화번호 없음"), false);
});
