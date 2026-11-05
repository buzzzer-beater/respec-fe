# 백엔드 작업 요청 (데모 디자인 기준, 2026-11-05 확정)

데모 디자인(`demo-design/`)을 최종 화면 기준으로 정하고 respec-be `origin/main`(`5167d6f`)과 대조했습니다.

## 팀 결정

1. **초안 핀은 초안에만 둔다.** 고객은 초안(A)에 핀으로 요청하고, 배포본(B)으로 핀을 옮기거나 다시 찾지 않습니다.
2. **검수 요청 때 개발자가 배포본에 위치를 다시 찍는다.** 묶음 검수 요청에서 요청마다 반영 설명을 쓰고, 배포 미리보기에서 "여기를 고쳤어요" 위치를 찍습니다. 고객은 그 위치를 보며 검수합니다.
3. **검수 요청은 묶음 제출, 검수할 사이트는 처음 연결한 배포 주소로 고정.** 검수 요청마다 주소를 다시 받지 않습니다.

## 요청

### 1. 검수 요청 바꾸기 — 필수

`POST /projects/{id}/review-requests`

- **배포 주소 빼기**: 지금은 매번 `deployment_url`이 필수이고 프로젝트 주소와 비교하지 않습니다. 빼거나 선택값으로 바꾸고, 비어 있으면 프로젝트의 `deployment_url`을 저장. 프로젝트에 배포 주소가 없으면 409.
- **항목마다 배포본 위치 받기**: `items[].location`에 핀 위치와 같은 모양(`page_path`, `element_selector`, `relative_x`, `relative_y`, `location_context`)을 받아 검수 항목에 저장. 핀 위치 수정(`PATCH /pins/{id}/location`)은 초안 위치를 덮어쓰므로 쓰지 않습니다.
- **돌려줄 곳**: `GET /review-requests/{id}`의 `items[]`, 수정 요청의 `latest_review_item`에 `location` 포함
- 요청 예시

```json
{
  "items": [
    {
      "change_request_id": 12,
      "implementation_note": "메인 배너를 흰 배경으로 바꾸고 로고를 키웠어요",
      "location": { "page_path": "/", "element_selector": "#hero", "relative_x": 0.5, "relative_y": 0.4 }
    }
  ]
}
```

### 2. 사용자 이름 `users.name` — 필수

- `POST /auth/signup`에 `name` 받기 (데모 회원가입에 이름 칸 있음)
- 돌려줄 곳: `GET /auth/me`, `GET /projects/{id}/members`, `GET /invitations/preview`의 `invited_by`·`me`

### 3. 알림 종류 추가 — 필수

- 지금: `review_requested`(→ 고객), `change_reopened`(→ 개발자)
- 추가: `change_created`(고객이 새 요청 → 개발자), `change_resolved`(고객 승인 → 개발자)

### 4. 핀이 남겨진 곳 `pins.source` — 필수

- `'draft' | 'deployment'` 저장. 초안 핀은 초안에서만, 배포본에서 새로 찍은 핀은 배포본에서만 그립니다.
- `POST /pins`에서 받고, `GET /pins?source=` 필터, 핀·수정 요청 응답에 포함

### 5. 배포 후에도 초안 보기 — 필수 확인

- 배포 주소를 연결한 뒤에도 `GET /draft`, `GET /draft/preview`가 계속 동작해야 합니다. 고객이 초안에서 남긴 요청을 초안 위에서 다시 봅니다.

### 6. 배포 시각 `deployment_updated_at` — 권장

- 작업 화면 미리보기 아래 "마지막 배포 · 3일 전" 표시용. 배포 주소를 연결·변경할 때 저장하고 `GET /projects/{id}`에 포함
- 초안은 이미 있는 `GET /draft`의 `updated_at`을 씁니다

### 7. 프로젝트 목록 보조 필드 — 있으면 좋음

- `GET /projects`에 `has_draft`(bool), `my_turn_count` 추가
- 내 차례: 개발자 = `open`·`reviewing`·`in_progress`, 고객 = `pending_review`

### 8. 정리

- 예제 `Task` API(`/tasks`)와 `tasks` 테이블 삭제

## 이미 있어서 그대로 쓰는 것

수정 요청 5단계(`acknowledge`·`start`·`resolve`·`reopen`+사유), 상태 이력, 핀 위치 확인 필요·위치 다시 지정(같은 사이트 안에서), 핀 댓글 스레드와 본인 댓글 수정·삭제, `ai_summary`, `ai_plain_text`(양방향), 채팅에서 요청 등록, 채팅 핀 공유, 초대 링크 발급·비활성화·미리보기·수락, 초안 생성·다시 만들기·ZIP, 배포 주소 연결, 알림 목록·읽음.

## 필요 없어진 것 (데모에서 지움)

받은 초대 목록·거절, 이메일 초대, 프로젝트 마지막 활동 시각, 초안 페이지 목록, 초안 비동기 생성, "작업 시작" 알림.
