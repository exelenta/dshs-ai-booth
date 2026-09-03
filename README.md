# 우리가족 상상스케치

대구과학고등학교 AI 동아리 부스에서 운영하는 가족 참여형 AI 그림 체험 프로그램입니다. 참가자가 테마와 그림 요소를 고르고, 선택적으로 촬영한 사진을 바탕으로 Gemini가 하나의 완성된 일러스트를 생성합니다.

## 체험 흐름

1. 우주, 바닷속, 마법의 숲, 미래 도시 중 테마를 선택합니다.
2. 원하면 웹캠으로 사진을 촬영합니다. 배경 제거는 브라우저에서 실행되는 MediaPipe가 처리합니다.
3. 스타일, 피사체, 배경, 구도, 조명, 품질을 골라 프롬프트를 완성합니다.
4. Gemini 이미지 모델이 촬영 인물과 배경을 같은 화풍으로 다시 그립니다. 사진을 건너뛴 경우에는 텍스트만으로 그림을 생성합니다.
5. 문구와 학교 로고를 합성한 뒤 다운로드, 인쇄 또는 문자 전송을 선택합니다.

## 기술 구성

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4
- Google Gemini 이미지 생성 API
- `react-webcam`, MediaPipe Selfie Segmentation
- Firebase Storage 및 Hosting
- Solapi SMS

촬영 이미지, 생성 이미지, 인쇄 이미지는 브라우저의 작은 `sessionStorage` 대신 IndexedDB에 임시 저장됩니다. 텍스트 선택값만 `sessionStorage`를 사용합니다.

## 로컬 실행

Node.js 24와 npm을 권장합니다.

```bash
npm ci
copy .env.example .env.local
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다. `npm ci`가 실행되면 MediaPipe 모델과 WASM 파일이 `public/mediapipe` 아래로 자동 복사되므로 행사장에서는 jsDelivr CDN에 의존하지 않습니다.

카메라는 `localhost` 또는 HTTPS 환경에서만 정상적으로 권한을 요청할 수 있습니다.

## 환경 변수

`.env.example`을 `.env.local`로 복사한 뒤 실제 값을 입력합니다. `.env.local`은 커밋하지 않습니다.

- `GEMINI_API_KEY`: 서버의 Gemini 이미지 생성 키
- `SOLAPI_API_KEY`, `SOLAPI_API_SECRET`, `SOLAPI_SENDER_NUMBER`: 문자 발송 설정
- `NEXT_PUBLIC_FIREBASE_*`: Firebase 웹 앱 및 Storage 설정

Solapi 발신 번호는 콘솔에서 사전 등록 및 인증되어 있어야 합니다.

Firebase에 배포할 때 `GEMINI_API_KEY`는 반드시 **실행 환경에도** 등록해야 합니다. 로컬의 `.env.local`은 GitHub나 Firebase에 자동으로 전달되지 않습니다. App Hosting을 사용한다면 Firebase Console의 **App Hosting → 백엔드 → 설정 → 환경**에서 Secret으로 등록하거나 `firebase apphosting:secrets:set GEMINI_API_KEY`를 사용한 뒤 새 롤아웃을 생성합니다. 기존 프레임워크 인식 Hosting을 사용한다면 배포 프로젝트용 dotenv 설정에 같은 이름으로 등록하고 다시 배포합니다. API 키를 저장소에 직접 커밋하지 마세요.

## 검사 명령

```bash
npm run lint
npm test
npm run build
npm run check
```

GitHub Actions도 커밋마다 린트, 단위 테스트, 프로덕션 빌드를 실행합니다.

## Firebase Storage와 개인정보

- 촬영 사진은 그림 생성을 위해 Google Gemini로 전송될 수 있습니다.
- 인쇄 또는 문자 전송을 선택한 경우에만 완성 이미지가 Firebase Storage에 업로드됩니다.
- 휴대폰 번호는 Solapi 발송 요청에만 전달하며 이 앱의 데이터베이스에는 저장하지 않습니다.
- 완성 이미지는 최대 7일만 보관합니다.
- 촬영 원본과 중간 이미지는 브라우저에 임시 저장되며 2분간 입력이 없거나 체험이 끝나면 삭제합니다.

`firebase deploy --only storage`로 `storage.rules`를 배포하고, Firebase Storage가 사용하는 Google Cloud Storage 버킷에 `storage-lifecycle.json`의 7일 삭제 정책을 적용해야 합니다. 수명 주기 정책은 Firebase 규칙 배포만으로 활성화되지 않으므로 Google Cloud Console의 버킷 **Lifecycle** 화면에서 별도로 적용하고 실제 삭제 설정을 확인하세요.

세부 운영 원칙은 [`docs/PRIVACY.md`](docs/PRIVACY.md)를 참고하세요.

## 행사 전 점검

- 실제 Gemini 키로 사진 포함·미포함·순수 풍경 모드를 각각 생성합니다.
- 행사장 네트워크를 끊은 상태에서도 카메라 배경 제거가 실행되는지 확인합니다.
- Firebase 업로드와 7일 삭제 정책을 확인합니다.
- Solapi API 키와 등록된 발신 번호 설정을 확인합니다.
- 브라우저 인쇄 배율을 100%, 용지를 A4 가로 방향으로 맞춥니다.
- 프린터 잼 이후 Firebase 백업 이미지로 재출력하는 절차를 담당자에게 공유합니다.
