# 사이트 미리보기와 핀 구현 방식 (제안)

> 상태: **제안**. CLAUDE.md "결정이 필요한 것"의 _외부 배포 사이트 미리보기 방식_, _AI 초안 미리보기 렌더링 방식_ 에 대한 안입니다. 팀에서 확정하면 이 줄을 바꿔 주세요.
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

| 방식                                             | 판단   | 이유                                                                                 |
| ------------------------------------------------ | ------ | ------------------------------------------------------------------------------------ |
| 플랫폼 안에서 코드 직접 실행 (Sandpack 등)       | 비추천 | 개발자는 결국 저장소에서 작업하므로 코드가 두 군데 생김                              |
| 프록시로 외부 배포 사이트를 같은 출처로 띄우기   | 비추천 | 에셋 경로, CSP, 쿠키, 라우팅이 깨지기 쉬움                                           |
| 초안 `preview_url`을 그대로 iframe + 핀 스크립트 | 불가   | 미리보기 응답 CSP가 스크립트를 막고, 검증기가 `<script>`와 `data-*`를 거절함         |
| 투명 오버레이로 좌표만 저장                      | 폴백용 | 요소 기준 핀과 "위치 확인 필요" 판정이 불가능. 핀 스크립트가 연결되지 않을 때만 사용 |
| **초안: 같은 출처 `srcdoc` / 배포: 핀 스크립트** | 채택안 | 백엔드 수정 없이 초안 핀 가능, 배포 사이트는 개발자 흐름을 해치지 않음               |

## 초안 미리보기

```text
[워크스페이스]
  1. GET /projects/{id}/draft → preview_url 받기 (재생성마다 access 토큰이 바뀌므로 저장하지 않음)
  2. Next.js 라우트 핸들러가 서버에서 preview_url의 HTML을 받아 옴 (브라우저 CORS 회피)
  3. <iframe srcdoc={html} sandbox="allow-same-origin">  ← allow-scripts, allow-forms 없음
  4. 부모가 contentDocument를 직접 읽어 핀 엔진 실행
```

- `sandbox`에 `allow-scripts`가 없으므로 iframe 문서 안에서는 어떤 스크립트도 실행되지 않습니다. 원본 응답의 CSP 헤더는 `srcdoc`에 적용되지 않으므로 이 `sandbox`가 대신 막아 줍니다.
- `allow-forms`도 빼서 폼 전송을 막습니다 (원본 CSP의 `form-action 'none'`과 같은 효과).
- **iframe 높이를 문서 높이에 맞추고, 스크롤은 부모 컨테이너에서 합니다.** 그러면 마커를 부모의 같은 스크롤 영역에 그릴 수 있어서 iframe 스크롤과 위치를 맞출 필요가 없습니다. 화면 너비 프리셋은 iframe 너비로 조절합니다. (`100vh`를 쓰는 레이아웃은 높이가 달라질 수 있음)
- **핀 모드**: iframe 위에 투명 레이어를 덮어 클릭 좌표를 받고, `contentDocument.elementFromPoint()`로 아래 요소를 찾습니다. iframe 문서에 이벤트 리스너를 붙이지 않아도 되므로 `sandbox` 동작 차이에 영향받지 않습니다.
- **체험 모드의 한계**: 초안에는 스크립트가 없어서 장바구니, 날짜 선택 같은 동작은 체험할 수 없고 스크롤과 링크 정도만 됩니다. CLAUDE.md의 "미리보기로 직접 사용해 봄"과 차이가 있으니 팀 공유가 필요합니다.
- 생성은 동기 방식이고 최대 120초(nginx timeout)까지 걸립니다. 로딩 화면과 502/504 처리가 필요합니다.

## 연결 사이트 (외부 배포)

```text
[워크스페이스]  ← 핀 목록, 스레드 UI, 채팅
  └ <iframe src="https://고객사이트.vercel.app">
       └ respec-pin.js (개발자가 한 줄 추가)
          - 핀 엔진 실행 (앵커 계산/복원, 마커 표시)
          - 핀 모드: 투명 레이어로 클릭을 막고 아래 요소 찾기
          - 페이지 이동 감지 → parent로 전송
```

개발자가 넣을 것:

```html
<script async src="https://<RE:SPEC 도메인>/respec-pin.js"></script>
```

```json
// vercel.json
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

- 스크립트는 iframe 안일 때(`window.parent !== window`)만 동작하고, `async`로 불러와 우리 서버 장애가 사이트 로딩에 영향을 주지 않게 합니다.
- 마커는 iframe 안에서 Shadow DOM으로 그립니다. 부모에서 그리면 스크롤마다 메시지 지연으로 핀이 흔들립니다.
- `respec:ready`를 3초 안에 못 받으면 "핀 스크립트가 연결되지 않았어요" 안내 후 좌표만 저장하는 오버레이로 폴백합니다. iframe `onload`는 에러 화면에도 발생하므로 판정에 쓰지 않습니다.

### 메시지 규격 (초안)

```ts
// 부모 → iframe
{ type: 'respec:set-mode', mode: 'browse' | 'pin' }
{ type: 'respec:show-pins', pins }
{ type: 'respec:navigate', path, pinId } // 채팅 핀 카드 클릭 시

// iframe → 부모
{ type: 'respec:ready', version }
{ type: 'respec:path-changed', path }
{ type: 'respec:pin-created', anchor }
{ type: 'respec:pin-clicked', pinId }
{ type: 'respec:pin-missing', pinId } // DOM에 요소가 없음 → needs_check 보고
```

- 양쪽 모두 `event.origin`을 검사합니다. 부모는 프로젝트의 `deployment_url` origin만, 스크립트는 RE:SPEC origin만 받습니다.
- 인증 토큰이나 사용자 정보는 iframe으로 보내지 않습니다.

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
- **현재 저장할 수 없는 값**: 반복 요소 `index`, `viewport_width`, 대비용 페이지 좌표. `location_context`가 `extra="forbid"`이고 DB에도 저장되지 않기 때문입니다. 그래서 지금은 `needs_check` 핀을 화면에 그릴 위치가 없고 **패널 목록에만** 보입니다.

## 백엔드 API 사용 정리

공통 prefix: `/projects/{project_id}` (정확한 값은 respec-be `app/routers/project_support.py`의 `PROJECT`)

| 프론트 동작                        | API                                                                 | 비고                                                   |
| ---------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------ |
| 초안 생성                          | `PUT /draft`                                                        | client만 가능, 동기(최대 120초)                        |
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
| 초안      | 생성이 최대 120초 블로킹                                                          | 로딩 화면, 502/504 안내, 재시도 버튼                                       |
| 초안/배포 | 핀에 초안/배포 구분이 없어 `page_path`가 다르면 초안 핀이 전부 `needs_check`가 됨 | 초안의 `page_path` 규칙 확인 (아래 "정할 것")                              |
| 핀 모드   | `pointerdown`, `touchstart`, hover로 동작하는 컴포넌트가 반응함                   | 투명 레이어 + `elementFromPoint()`                                         |
| 핀 모드   | 유튜브, 지도 같은 iframe 안의 iframe은 안쪽 요소를 읽을 수 없음                   | 해당 iframe 요소 단위로만 핀 허용                                          |
| 경로      | Next.js 클라이언트 이동은 `pushState`라 감지 이벤트가 없음                        | 핀 스크립트에서 `pushState`/`replaceState` 감싸기 또는 Navigation API      |
| 배포      | Vercel 미리보기 URL은 커밋마다 바뀌고 로그인 보호가 걸린 경우가 많음              | 프로덕션 도메인 하나만 `deployment_url`로 연결                             |
| 배포      | 개발자가 핀 스크립트나 `frame-ancestors`를 빼면 iframe이 안 뜨거나 핀이 안 됨     | `respec:ready` 타임아웃 → 안내 + 좌표 오버레이 폴백                        |
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
5. 화면 너비 프리셋, `respec:ready` 타임아웃 폴백

범위 밖: 반응형 핀 위치 보정, 핀 위치 자동 복구, 스크린샷 저장, 실시간 화면 동기화(스크롤, 커서 공유).

## 정할 것

- **`reviewing` 탭 매핑**: "요청" 탭과 "작업중" 탭 중 어디에 넣을지
- **초안의 `page_path`**: 초안은 링크가 `#앵커`만 허용되는 한 페이지 HTML이므로 `/`로 저장하는 안. 배포 사이트는 여러 페이지일 수 있어서, 초안 핀은 배포 사이트의 `/`에서만 이어 보임
- 경로 기준: `/products/3`과 `/products/4`를 같은 페이지로 볼지, 쿼리를 경로에 포함할지
- 초안 체험 범위: 정적 HTML 한계를 받아들일지
- 초안 코드 전달 방식: 백엔드에 ZIP 다운로드(`GET /draft/zip`)가 있음. GitHub 저장소 생성까지 할지
- 핀 스크립트 배포 위치와 버전 관리 방식
