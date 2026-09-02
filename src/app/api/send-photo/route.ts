import { NextResponse } from "next/server";
import { normalizeKoreanPhoneNumber } from "@/lib/phone";

export async function POST(request: Request) {
  try {
    const { phone, imageUrl } = await request.json();

    if (!phone || !imageUrl) {
      return NextResponse.json(
        { error: "전화번호와 이미지 URL이 필요합니다." },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizeKoreanPhoneNumber(phone);
    if (!normalizedPhone) {
      return NextResponse.json(
        { error: "올바른 휴대폰 번호를 입력해 주세요. (예: 010-1234-5678)" },
        { status: 400 }
      );
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json(
        { error: "문자 발송 서비스(Twilio)가 설정되지 않았습니다." },
        { status: 503 }
      );
    }

    const smsBody =
      "[우리가족 상상스케치] 부스에서 만든 사진입니다. 아래 링크에서 확인하세요:\n" +
      imageUrl;

    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString(
      "base64"
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: normalizedPhone,
          From: fromNumber,
          Body: smsBody,
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Twilio SMS failed:", errorData);

      let errorMessage = "문자 발송에 실패했습니다.";
      if (errorData.code === 572002 || errorData.code === 21608) {
        errorMessage =
          "Twilio 체험판 계정 제한: Twilio Console에 'Verified Caller ID'로 등록된 휴대폰 번호로만 발송이 가능합니다.";
      } else if (errorData.code === 21211) {
        errorMessage = "유효하지 않은 수신자 휴대폰 번호입니다.";
      } else if (errorData.message) {
        errorMessage = `문자 발송 실패: ${errorData.message}`;
      }

      return NextResponse.json({ error: errorMessage }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error sending photo SMS:", error);
    const message =
      error.name === "AbortError"
        ? "Twilio 문자 발송 서버 응답 시간이 초과되었습니다 (10초)."
        : error.message || "문자 발송 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
