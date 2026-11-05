# 사이트 미리보기와 핀 구현 방식

> 상태: **확정** (팀 결정 2026-11-05). CLAUDE.md "결정이 필요한 것"의 _외부 배포 사이트 미리보기 방식_ 은 **핀 스크립트(`respec-pin.js`) + postMessage**, _AI 초안 미리보기 렌더링 방식_ 은 **같은 출처 `srcdoc` + `sandbox`** 로 정했습니다.
>
> 백엔드 현황은 respec-be main `b8db2f2` 기준으로 확인했습니다 (2026-11-05).

## 요약

미리보기 대상이 두 가지이고, 대상마다 iframe을 띄우는 방식이 다릅니다. **핀 위치 계산과 마커 표시 로직(핀 엔진)은 한 벌로 만들어 두 방식에서 같이 씁니다.**

| 대상                                 | 띄우는 방식                                                    | 부모가 DOM을 읽는 방법                           |
| ------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ |
| 초안 미리보기 (백엔드 `preview_url`) | HTML을 받아 같은 출처 iframe(`srcdoc`)으로 표시, 스크립트 차단 | 부모가 `iframe.contentDocument`를 직접 읽음      |
| 연결 사이트 (개발자의 외부 배포 URL) | 배포 URL을 cross-origin iframe으로 표시                        | 사이트에 넣은 핀 스크립트가 `postMessage`로 전달 |

- 초안 HTML은 백엔드 검증기가 `<script>`를 막는 정적 HTML이라서 핀 스크립트를 넣을 수 없습니다. 대신 같은 출처로 띄우면 부모가 DOM을 직접 읽을 수 있습니다.
- 외부 배포 사이트는 우리가 헤더나 코드를 제어할 수 없으므로, 개발자가 핀 스크립트 한 줄과 iframe 허용 헤더를 넣는 방식입니다. 이번 시연은 준비된 사이트를 쓰므로 우리가 직접 넣습니다.
- 두 경우 모두 **iframe 안의 사이트는 백엔드와 통신하지 않습니다.** 핀 저장/조회는 워크스페이스(부모)가 Bearer 토큰으로 호출합니다.

## 검토한 대안

| 방식                                             | 판단   | 이유                                                                                                |
| ------------------------------------------------ | ------ | --------------------------------------------------------------------------------------------------- |
| 플랫폼 안에서 코드 직접 실행 (Sandpack 등)       | 비추천 | 개발자는 결국 저장소에서 작업하므로 코드가 두 군데 생김                                             |
| 프록시로 외부 배포 사이트를 같은 출처로 띄우기   | 비추천 | 에셋 경로, CSP, 쿠키, 라우팅이 깨지기 쉬움                                                          |
| 초안 `preview_url`을 그대로 iframe + 핀 스크립트 | 불가   | 미리보기 응답 CSP가 스크립트를 막고, 검증기가 `<script>`와 `data-*`를 거절함                        |
| 투명 오버레이로 좌표만 저장                      | 제외   | 요소 기준 핀과 "위치 확인 필요" 판정이 불가능. 스크롤하면 핀이 어긋나서 폴백으로도 쓰지 않음(FE#80) |
| **초안: 같은 출처 `srcdoc` / 배포: 핀 스크립트** | 채택안 | 백엔드 수정 없이 초안 핀 가능, 배포 사이트는 개발자 흐름을 해치지 않음                              |

## 초안 미리보기

> 상태: **확정** (백엔드와 합의, #51). 구현: `src/app/api/projects/[projectId]/draft-preview/route.ts`, `src/widgets/site-viewer/ui/DraftPreviewFrame.tsx`

```text
[워크스페이스]
  1. GET /projects/{id}/draft → preview_url 받기 (재생성마다 access 토큰이 바뀌므로 저장하지 않음)
  2. Next.js 라우트 핸들러가 서버에서 HTML을 받아 옴 (브라우저 CORS 회피)
     브라우저는 projectId와 access 키만 넘기고, 서버가 API_BASE_URL로 URL을 직접 만듦 (SSRF 방지)
     응답 <head>에 원래 CSP와 같은 <meta http-equiv="Content-Security-Policy">를 넣음
  3. <iframe srcdoc={html} sandbox="allow-same-origin">  ← allow-scripts, allow-forms 없음
  4. 부모가 contentDocument를 직접 읽어 핀 엔진 실행
```

- `sandbox`에 `allow-scripts`가 없으므로 iframe 문서 안에서는 어떤 스크립트도 실행되지 않습니다. 원본 응답의 CSP 헤더는 `srcdoc`에 적용되지 않으므로 이 `sandbox`가 대신 막아 줍니다.
- `allow-forms`도 빼서 폼 전송을 막습니다 (원본 CSP의 `form-action 'none'`과 같은 효과).
- **iframe 높이를 문서 높이에 맞추고, 스크롤은 부모 컨테이너에서 합니다.** 그러면 마커를 부모의 같은 스크롤 영역에 그릴 수 있어서 iframe 스크롤과 위치를 맞출 필요가 없습니다. 화면 너비 프리셋은 iframe 너비로 조절합니다. (`100vh`를 쓰는 레이아웃은 높이가 달라질 수 있음)
- **핀 모드**: iframe 위에 투명 레이어를 덮어 클릭 좌표를 받고, `contentDocument.elementFromPoint()`로 아래 요소를 찾습니다. iframe 문서에 이벤트 리스너를 붙이지 않아도 되므로 `sandbox` 동작 차이에 영향받지 않습니다.
- **`#섹션` 링크**: srcdoc 문서의 `#id` 링크는 부모 페이지 주소 기준으로 해석돼 iframe이 앱 페이지로 이동합니다. 부모가 iframe 문서의 클릭을 받아 `preventDefault` 후 해당 요소 위치로 부모 컨테이너를 스크롤합니다(Chrome에서 `sandbox` 문서에도 부모 리스너가 동작하는 것을 확인).
- **체험 모드의 한계**: 초안에는 스크립트가 없어서 장바구니, 날짜 선택 같은 동작은 체험할 수 없고 스크롤과 링크 정도만 됩니다. CLAUDE.md의 "미리보기로 직접 사용해 봄"과 차이가 있으니 팀 공유가 필요합니다.
- 생성은 동기 방식이고 최대 약 240초(Bedrock 응답 대기, nginx는 300초)까지 걸립니다. 로딩 화면과 502/504 처리가 필요합니다. Vercel rewrite는 120초에 끊기므로 브라우저가 `NEXT_PUBLIC_API_BASE_URL`로 백엔드를 바로 부릅니다.

## 연결 사이트 (외부 배포)

> 상태: **확정** (#21). 구현: `src/shared/lib/pin-script/`(스크립트), `src/shared/lib/pin-bridge/`(메시지 규격), `src/widgets/site-viewer/ui/DeployedSiteFrame.tsx`(부모)

```text
[워크스페이스]  ← 핀 목록, 스레드 UI, 채팅, 핀 저장(Bearer)
  └ <iframe src="https://고객사이트.vercel.app" sandbox="allow-scripts allow-same-origin ...">
       └ respec-pin.js (개발자가 한 줄 추가)
          - 핀 엔진 실행 (앵커 계산/복원, Shadow DOM 마커)
          - 핀 모드: 투명 레이어로 클릭을 막고 아래 요소 찾기
          - pushState/replaceState/popstate 감지 → parent로 전송
```

### 설치 방법 (개발자, 시연 사이트 #22)

배포 연결 대화상자의 "핀 스크립트 설치"에 RE:SPEC 주소가 채워진 코드와 복사 버튼이 있습니다.

1. 사이트 `<head>`에 스크립트 한 줄을 넣습니다.

   ```html
   <script async src="https://<RE:SPEC 도메인>/respec-pin.js"></script>
   ```

   Next.js App Router는 루트 `layout.tsx`의 `<head>`에 그대로 넣거나 `next/script`(`strategy="afterInteractive"`)를 씁니다. 스크립트를 다른 주소에서 내려줄 때(로컬 개발 등)는 `data-respec-origin="http://localhost:3000"`으로 RE:SPEC origin을 따로 적습니다. 공백이나 쉼표로 여러 개를 적을 수 있습니다.

2. RE:SPEC 화면 안에서 열리도록 응답 헤더를 넣습니다. Vercel은 `vercel.json`:

   ```json
   {
     "headers": [
       {
         "source": "/(.*)",
         "headers": [
           {
             "key": "Content-Security-Policy",
             "value": "frame-ancestors 'self' https://<RE:SPEC 도메인>"
           }
         ]
       }
     ]
   }
   ```

   Next.js는 `next.config`의 `headers()`로 같은 헤더를 넣어도 됩니다. `X-Frame-Options: DENY/SAMEORIGIN`이 있으면 지워야 합니다.

3. 다시 배포하고, 개발자가 프로젝트에 프로덕션 도메인을 연결합니다. 워크스페이스에서 "핀 스크립트가 연결되지 않았어요"가 보이지 않으면 연결된 것입니다.

주의: RE:SPEC이 `http://localhost`일 때 `https` 사이트는 mixed content로 스크립트를 막습니다. 로컬에서 확인할 때는 스크립트를 배포된 RE:SPEC에서 받고 `data-respec-origin`에 로컬 주소를 적습니다.

### 동작

- 스크립트는 iframe 안일 때(`window.parent !== window`)만 동작하고, `async`로 불러와 우리 서버 장애가 사이트 로딩에 영향을 주지 않게 합니다. 두 번 넣어도 한 번만 실행합니다.
- 허용 origin은 스크립트 주소(`src`)의 origin입니다. `data-respec-origin`이 있으면 그 값을 씁니다.
- 마커는 iframe 안에서 Shadow DOM(`<respec-pin-root>`)으로 그립니다. 부모에서 그리면 스크롤마다 메시지 지연으로 핀이 흔들립니다. 스크롤, 창 크기, DOM 변경 때 `requestAnimationFrame`으로 위치를 다시 계산합니다.
- 마커 모양은 앱의 `PinMarkerButton`과 같습니다: 요청 상태 색(`tone`, `CHANGE_REQUEST_STATUS_TONE`), 해결됐거나 요청이 없는 핀은 작은 점(`muted`, 마우스를 올리면 번호), 고른 핀은 링과 확대, 마우스를 올리면 `request_preview` 툴팁, 요소를 못 찾은 핀은 저장된 좌표(`page_x/page_y`)에 흐린 점선. Shadow DOM 안에는 Tailwind가 없어서 스타일은 `overlay.ts`의 CSS 문자열로 쓰고, 색 값은 `pin-script/theme.ts` 한 곳에 `globals.css` 토큰 값을 옮겨 둡니다(`theme.test.ts`가 비교).
- 핀 모드: Shadow DOM 안의 투명 레이어가 화면을 덮고, `window` capture 단계에서 마우스·포인터·터치 이벤트를 멈춰 사이트 리스너로 가지 않게 합니다. 스크롤(`wheel`)은 막지 않습니다. 누른 위치는 `elementsFromPoint`로 레이어를 건너뛰고 아래 요소를 찾습니다.
- 경로: `location.pathname`만 `page_path`로 씁니다(쿼리, 해시 제외). 경로가 바뀌면 이전 경로 마커를 지우고 `path-changed`를 보냅니다. 부모는 현재 경로의 핀만 다시 보냅니다.
- 다른 경로의 핀을 고르면(`navigate`) 스크립트가 `location.assign`으로 새로 불러옵니다. 새 문서가 `ready`를 보내면 부모가 같은 경로로 `navigate`를 다시 보내 핀으로 스크롤합니다.
- `pin-missing`/`pin-found`: 핀 목록을 받거나 DOM이 바뀌면 2초 뒤 요소를 다시 찾아, 핀마다 상태가 **바뀔 때만** 보냅니다. 처음 상태는 서버의 `location_status`입니다. DOM에 요소가 **아예 없으면** `pin-missing`, `needs_check`였거나 없다고 보낸 핀의 요소를 다시 찾으면 `pin-found`입니다. 숨겨진 요소(모달, 탭)는 어느 쪽도 보내지 않고 마커도 그리지 않습니다. 부모(`DeployedSiteFrame`)는 `onPinMissing`/`onPinFound`로 넘기고, `SiteViewerView`가 `useReportPinLocation`의 `reportMissing`/`reportFound`로 `PATCH .../location-status`를 보냅니다.
- `respec:ready`를 2초 안에 못 받으면 핀 모드를 막고 주황 안내를 띄웁니다. 개발자에게는 "설치 방법"(배포 연결 대화상자), 고객에게는 개발자에게 설치를 요청하라는 문구를 보여 줍니다. 좌표만 저장하는 대체 방식은 없습니다(FE#80). 연결을 기다리는 동안에도 핀 모드를 막고, 늦게라도 `ready`가 오면 핀 모드가 풀립니다. iframe `onload`는 에러 화면에도 발생하므로 판정에 쓰지 않습니다.
- iframe `sandbox`에 `allow-top-navigation`을 넣지 않아 사이트가 워크스페이스 주소를 바꾸지 못합니다. `allow-same-origin`은 사이트가 자기 origin(쿠키, 저장소)을 유지하도록 넣습니다. cross-origin이라 워크스페이스에는 접근할 수 없습니다.

### 빌드

- `public/respec-pin.js`는 `pnpm build:pin-script`(`scripts/build-pin-script.mjs`)로 만들고 저장소에 커밋합니다. 새 의존성 없이 이미 있는 `typescript`의 `transpileModule`로 파일마다 CommonJS로 바꾸고, 작은 `require` 함수와 함께 IIFE 하나로 묶습니다. 상대 경로 import만 따라가므로 `pin-engine`, `pin-bridge`, `pin-script`는 서로 상대 경로로 import합니다.
- `src/shared/lib/pin-script/bundle.test.ts`가 커밋된 파일과 지금 소스로 만든 결과를 비교합니다. 핀 엔진이나 규격을 바꾸고 다시 만들지 않으면 `pnpm test`가 실패합니다.
- Next.js가 `public/`을 `Cache-Control: public, max-age=0`으로 내려주므로 다시 배포하면 바로 반영됩니다. 규격을 바꾸면 `PIN_BRIDGE_VERSION`을 올립니다. 부모는 버전이 다르면 경고만 남깁니다.
- 축소(minify)는 하지 않습니다(약 39KB). 필요해지면 esbuild 같은 번들러를 개발 의존성으로 넣는 안을 검토합니다.

### 메시지 규격

타입과 검증 함수는 `src/shared/lib/pin-bridge/protocol.ts` 한 곳에 있고 양쪽이 같이 씁니다. 받는 쪽은 `parseParentMessage`/`parseSiteMessage`로 모양을 확인하고, 모르는 필드는 지웁니다(백엔드 `extra="forbid"`).

```ts
// 부모 → iframe
{ type: 'respec:set-mode', mode: 'browse' | 'pin' }
{ type: 'respec:show-pins', pins: BridgePin[], selectedPinId } // 현재 경로의 핀만
{ type: 'respec:navigate', path, pinId } // 채팅 핀 카드, 패널에서 핀 선택 시

// iframe → 부모
{ type: 'respec:ready', version, path }
{ type: 'respec:path-changed', path }
{ type: 'respec:pin-created', anchor, x, y } // x, y: 누른 지점의 iframe 화면 기준 %
{ type: 'respec:pin-clicked', pinId }
{ type: 'respec:pin-missing', pinId } // DOM에 요소가 없음 → needs_check 보고 대상
{ type: 'respec:pin-found', pinId } // 못 찾던 요소를 다시 찾음 → located 보고 대상
```

- `BridgePin`(규격 버전 2): `id`, `number`, `page_path`, `element_selector`, `relative_x`, `relative_y`, `location_context`, `tone`(`brand`/`ink`/`warn`/`faint`), `muted`, `request_preview`, `location_status`만 보냅니다. 고른 핀은 `selectedPinId`로 보냅니다.
- 요청 내용은 툴팁용 `request_preview`(첫 댓글 원문, 200자까지)만 보냅니다. 배포 사이트 코드가 읽을 수 있는 값이라 작성자, 댓글 스레드, AI 변환, 인증 토큰은 보내지 않습니다. 스크립트는 툴팁을 `textContent`로만 넣습니다.
- 양쪽 모두 `event.origin`과 `event.source`를 검사합니다. 부모는 프로젝트 `deployment_url`의 origin과 자기 iframe에서 온 메시지만, 스크립트는 허용 origin과 `window.parent`에서 온 메시지만 받습니다. 보낼 때도 `targetOrigin`을 그 origin으로 지정합니다.
- 부모는 `pin-created`의 앵커로 `POST /pins`를 보내고, `pin-clicked`로 오른쪽 패널의 핀을 고르며, `ready`/`path-changed`로 현재 `page_path`를 관리합니다.

## 핀 앵커

백엔드 핀 생성 API가 받는 값에 맞춥니다.

```ts
type PinAnchor = {
  page_path: string; // 목록 조회 시 exact match
  element_selector: string;
  relative_x: number; // 요소 안 상대 위치 0~1
  relative_y: number;
  location_context?: {
    element_text?: string; // 찾은 요소 검증용
    section_name?: string;
  };
};
```

- **`element_selector` 우선순위**: `#id` → 짧은 CSS 경로. 초안 검증기가 `data-*`를 거절하고 `id`는 허용하므로 `data-respec-id` 대신 **`id`** 를 앵커로 씁니다. AI가 요소마다 고정 `id`를 붙이도록 요청했습니다 ([respec-be#12](https://github.com/buzzzer-beater/respec-be/issues/12)). React `useId`가 만드는 `:r1:` 같은 id는 렌더마다 바뀌므로 쓰지 않습니다.
- **`section_name`**: 가장 가까운 `<section>`의 `id`나 첫 제목(`h1`~`h3`) 텍스트에서 읽습니다.
- **"위치 확인 필요" 보고**: DOM에 요소가 **아예 없을 때만** `PATCH .../location-status`로 `needs_check`를 보냅니다. 모달, 탭처럼 지금 숨겨진 요소는 보고하지 않고 화면에서만 "지금 화면에 없음"으로 표시합니다. 다시 찾으면 `located`로 되돌립니다.
- **대비용 위치 저장**: 반복 요소 `index`, `viewport_width`, 페이지 좌표 `page_x/page_y`를 `location_context`에 함께 저장합니다(백엔드 반영됨). 요소를 못 찾은 `needs_check` 핀은 이 페이지 좌표에 흐린 점선으로 그리고, 패널에도 "위치 확인 필요" 배지를 보여 줍니다.

## 백엔드 API 사용 정리

공통 prefix: `/projects/{project_id}` (정확한 값은 respec-be `app/routers/project_support.py`의 `PROJECT`)

| 프론트 동작                        | API                                                                 | 비고                                                   |
| ---------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------ |
| 초안 생성                          | `PUT /draft`                                                        | client만 가능, 동기(최대 약 240초)                     |
| 초안 미리보기 URL                  | `GET /draft`                                                        | `preview_url` 쿼리가 재생성마다 바뀜                   |
| 페이지 핀 그리기                   | `GET /pins?page_path=`                                              | 응답: id, page_path, selector, 좌표, location_status만 |
| 핀 상태 색 / 완료 핀 숨기기        | `GET /change-requests` 후 `pin_id`로 프론트에서 묶기                | `pin_id` 필터 없음, `status` 필터만 있음               |
| 핀 생성 (핀 + 첫 댓글 + 수정 요청) | `POST /pins`                                                        | 초안도 `deployment_url`도 없으면 409                   |
| 채팅 핀 카드 → 이동                | `GET /pins/{pin_id}`                                                | `page_path`로 이동 후 selector로 스크롤                |
| 스레드                             | `GET/POST /pins/{pin_id}/comments`, `PATCH/DELETE .../{comment_id}` | 핀의 요청이 `resolved`면 작성/수정/삭제 409            |
| 위치 확인 필요 보고                | `PATCH /pins/{pin_id}/location-status`                              | `located` \| `needs_check`, 프로젝트 멤버 누구나       |
| 배포 URL 연결                      | `PUT /deployment`                                                   | 단일 문자열, 덮어쓰기                                  |

### 수정 요청 상태

백엔드 값: `open` → `reviewing` → `in_progress` → `pending_review` → `resolved` (목록 필터용 `all`)

| 전이 API                | 역할   | 결과                                                      |
| ----------------------- | ------ | --------------------------------------------------------- |
| `acknowledge`           | 개발자 | `reviewing`                                               |
| `start`                 | 개발자 | `in_progress`                                             |
| `POST /review-requests` | 개발자 | 선택한 요청들을 `pending_review`로 (검수 URL + 반영 설명) |
| `resolve`               | 고객   | `resolved`                                                |
| `reopen`                | 고객   | 재수정 요청, `reason` 필수                                |

- CLAUDE.md는 4단계(미해결 → 진행 중 → 검수 대기 → 해결됨)인데 백엔드는 `reviewing`이 하나 더 있습니다. 탭 매핑을 정해야 합니다 (아래 "정할 것").
- 상태 라벨과 탭 매핑은 `entities/request`에 한 곳에서만 정의합니다.

## 백엔드에 요청할 것

1~4번은 모두 반영되었습니다(respec-be main `e377d33` 기준).

1. **`location_context` 저장과 반환**: JSON 컬럼으로 저장하고 단건/목록 응답에 포함. 자유 필드(`index`, `viewport_width`, 대비용 좌표) 허용 — [respec-be#9](https://github.com/buzzzer-beater/respec-be/issues/9)
2. **핀 위치 수정 API**: `needs_check` 핀을 다른 요소로 옮기기 (`element_selector`, 좌표 수정) — [respec-be#10](https://github.com/buzzzer-beater/respec-be/issues/10)
3. **핀 목록 응답에 요청 상태 포함**: `request_status`, `change_request_id`, 첫 댓글 미리보기. 안 되면 `change-requests`에 `pin_id` 필터 — [respec-be#11](https://github.com/buzzzer-beater/respec-be/issues/11)
4. **초안 생성 시 요소별 고정 `id` 부여**: 검증기는 `id`를 허용하지만 AI 지시문에 규칙이 없음 — [respec-be#12](https://github.com/buzzzer-beater/respec-be/issues/12)
5. (나중에) 초안 생성 비동기화와 상태 조회, 스크린샷 업로드 API — 이슈 미생성

## 예상 문제와 대응

| 영역      | 문제                                                                              | 대응                                                                       |
| --------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 앵커      | `map`으로 그린 반복 요소는 같은 selector가 여러 개 잡힘                           | 지금은 첫 번째 요소 + `element_text`로 검증. `index` 저장은 백엔드 확장 후 |
| 앵커      | 모달, 탭, 아코디언 안의 요소는 닫혀 있으면 DOM에 없거나 숨겨짐                    | 숨겨진 요소는 `needs_check`로 보고하지 않고 "지금 화면에 없음"으로만 표시  |
| 앵커      | API 데이터, 로그인 상태, 랜덤 요소로 화면이 바뀜                                  | 시연 사이트는 목데이터 고정                                                |
| 앵커      | CSS 경로 selector는 클래스, `nth-child` 변경에 쉽게 깨짐                          | `id` 우선, CSS 경로는 최후의 수단                                          |
| 앵커      | `location_context`가 저장되지 않아 찾은 요소가 맞는지 검증할 수 없음              | 백엔드 요청 1번. 그 전까지는 selector 일치만으로 판단                      |
| 반응형    | 고객(모바일)과 개발자(PC)의 레이아웃이 다름                                       | 뷰어에 데스크톱/모바일 너비 프리셋. `viewport_width` 저장은 백엔드 확장 후 |
| 초안      | 스크립트가 없어 동작(장바구니, 폼 등)을 체험할 수 없음                            | 팀 공유. 시연은 준비된 배포 사이트로 동작 체험                             |
| 초안      | 생성이 최대 약 240초 블로킹                                                       | 로딩 화면, 502/504 안내, 재시도 버튼                                       |
| 초안/배포 | 핀에 초안/배포 구분이 없어 `page_path`가 다르면 초안 핀이 전부 `needs_check`가 됨 | 초안의 `page_path` 규칙 확인 (아래 "정할 것")                              |
| 핀 모드   | `pointerdown`, `touchstart`, hover로 동작하는 컴포넌트가 반응함                   | 투명 레이어 + `elementFromPoint()`                                         |
| 핀 모드   | 유튜브, 지도 같은 iframe 안의 iframe은 안쪽 요소를 읽을 수 없음                   | 해당 iframe 요소 단위로만 핀 허용                                          |
| 경로      | Next.js 클라이언트 이동은 `pushState`라 감지 이벤트가 없음                        | 핀 스크립트에서 `pushState`/`replaceState` 감싸기 또는 Navigation API      |
| 배포      | Vercel 미리보기 URL은 커밋마다 바뀌고 로그인 보호가 걸린 경우가 많음              | 프로덕션 도메인 하나만 `deployment_url`로 연결                             |
| 배포      | 개발자가 핀 스크립트나 `frame-ancestors`를 빼면 iframe이 안 뜨거나 핀이 안 됨     | `respec:ready` 타임아웃 → 핀 모드 막고 설치 안내                           |
| iframe    | 구글 OAuth, 일부 결제창, 일부 지도 API는 iframe 안에서 막힘                       | 해당 동작에 "새 탭에서 열기" 안내                                          |
| 보안      | origin 검사 누락 시 다른 사이트가 가짜 핀 메시지를 보낼 수 있음                   | 양방향 origin 검사                                                         |
| 보안      | `deployment_url`에 임의 주소를 등록하면 피싱 사이트를 띄울 수 있음                | 해커톤에서는 `*.vercel.app`만 허용                                         |
| 보안      | 초안 HTML을 같은 출처로 띄우므로 스크립트가 실행되면 워크스페이스가 위험해짐      | `sandbox`에서 `allow-scripts`를 절대 넣지 않음                             |
| 이력      | 이전 버전을 저장하지 않아 위치를 잃은 핀은 원래 화면을 알 수 없음                 | 스크린샷 업로드 API가 생기면 핀 생성 시 캡처 저장                          |

## 해커톤 우선순위

1. 핀 엔진 (selector 생성/복원, `elementFromPoint`, 마커 위치 계산) — 초안과 배포 공통
2. 초안 미리보기: 라우트 핸들러로 HTML 받기 + `srcdoc` + 높이 맞춤 + 투명 레이어 핀 모드
3. 시연용 배포 사이트에 핀 스크립트 삽입 + postMessage + `pushState` 감지
4. `needs_check` 보고와 패널 목록 표시
5. 화면 너비 프리셋, `respec:ready` 타임아웃 안내

범위 밖: 반응형 핀 위치 보정, 핀 위치 자동 복구, 스크린샷 저장, 실시간 화면 동기화(스크롤, 커서 공유).

## 정할 것

- **`reviewing` 탭 매핑**: "요청" 탭과 "작업중" 탭 중 어디에 넣을지
- **초안의 `page_path`**: 초안은 링크가 `#앵커`만 허용되는 한 페이지 HTML이므로 `/`로 저장하는 안. 배포 사이트는 여러 페이지일 수 있어서, 초안 핀은 배포 사이트의 `/`에서만 이어 보임
- 경로 기준: `/products/3`과 `/products/4`를 같은 페이지로 볼지, 쿼리를 경로에 포함할지
- 초안 체험 범위: 정적 HTML 한계를 받아들일지
- 초안 코드 전달 방식: 백엔드에 ZIP 다운로드(`GET /draft/zip`)가 있음. GitHub 저장소 생성까지 할지
- ~~핀 스크립트 배포 위치와 버전 관리 방식~~ → RE:SPEC `public/respec-pin.js`에서 내려주고 `PIN_BRIDGE_VERSION`으로 규격 버전을 확인 (#21)
