import { NextResponse } from "next/server";
import { SolapiMessageService } from "solapi";
import { normalizeKoreanPhoneNumber } from "@/lib/phone";
import { getErrorMessage } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawPhone = body.phoneNumber || body.phone;
    const photoUrl = body.photoUrl || body.imageUrl;

    if (!rawPhone || !photoUrl) {
      return NextResponse.json(
        { error: "전화번호와 이미지 URL이 필요합니다." },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizeKoreanPhoneNumber(rawPhone);
    if (!normalizedPhone) {
      return NextResponse.json(
        { error: "올바른 휴대폰 번호를 입력해 주세요. (예: 010-1234-5678)" },
        { status: 400 }
      );
    }

    const apiKey = process.env.SOLAPI_API_KEY;
    const apiSecret = process.env.SOLAPI_API_SECRET;
    const senderNumber = process.env.SOLAPI_SENDER_NUMBER;

    if (!apiKey || !apiSecret || !senderNumber) {
      return NextResponse.json(
        {
          error:
            "솔라피(Solapi) 문자 발송 환경 변수(SOLAPI_API_KEY, SOLAPI_API_SECRET, SOLAPI_SENDER_NUMBER)가 설정되지 않았습니다.",
        },
        { status: 503 }
      );
    }

    const messageText = `[대구과학고등학교 AI 부스입니다. 생성한 사진을 보내드렸어요. 즐거운 하루 되세요!]\n${photoUrl}`;

    const messageService = new SolapiMessageService(apiKey, apiSecret);

    const response = await messageService.send({
      to: normalizedPhone,
      from: senderNumber.replace(/\D/g, ""),
      text: messageText,
      autoTypeDetect: true,
    });

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error: unknown) {
    console.error("Error sending photo SMS via Solapi:", error);
    const serviceMessage =
      typeof error === "object" && error !== null && "errorMessage" in error
        ? String((error as { errorMessage?: unknown }).errorMessage || "")
        : "";
    const message =
      serviceMessage || getErrorMessage(error, "문자 발송 중 오류가 발생했습니다.");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

