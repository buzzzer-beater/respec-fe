# respec-fe

Next.js App Router와 Feature-Sliced Design(FSD)을 사용하는 단일 프런트엔드 앱입니다.

## 스택

pnpm / Next.js 16 (App Router) / React 19 / TypeScript 5.9 / Tailwind CSS 4 / TanStack Query v5 / axios / ESLint + Prettier

## 구조

```text
src/
├── app/       Next.js 라우팅, 전역 스타일, Provider
├── views/     페이지 구성 (FSD pages 레이어)
├── widgets/   독립적인 화면 블록
├── features/  사용자 기능
├── entities/  도메인 엔티티
└── shared/    공통 API, 환경 설정, 유틸리티, UI
```

의존성은 `app → views → widgets → features → entities → shared` 방향으로만 흐릅니다. 페이지 구현은 `views`에, 라우트 파일은 `app`에 둡니다.

## 시작하기

```sh
pnpm install
API_BASE_URL=http://localhost:8080 pnpm dev
```

`API_BASE_URL`은 필수입니다. 로컬에서는 루트 `.env.local`에 설정해도 됩니다. 브라우저의 `/backend/*` 요청은 Next.js rewrite를 통해 해당 서버로 전달되며, `/api/*`는 Next.js Route Handler용으로 남겨 둡니다.

`NEXT_PUBLIC_API_BASE_URL`은 선택입니다. 초안 생성(`PUT /projects/{id}/draft`)은 최대 약 240초 걸리는데 Vercel의 외부 rewrite는 120초에 끊기므로, 이 값이 있으면 초안 생성만 브라우저가 백엔드로 바로 보냅니다. 배포 환경(Vercel)에는 `API_BASE_URL`과 같은 주소로 설정합니다. 빌드할 때 번들에 들어가므로 바꾸면 다시 배포해야 합니다.

## API 경계

- 브라우저 API: `@/shared/api`의 `get`, `post`, `patch`, `put`, `del`을 사용합니다. Axios base URL은 `/backend`입니다.
- 서버 전용 API: `@/shared/api/index.server`의 같은 메서드를 사용합니다. `API_BASE_URL`에 직접 요청하며 `server-only`로 클라이언트 번들 import를 막습니다.

## 검증

```sh
pnpm peers check
pnpm lint
pnpm format:check
pnpm test
API_BASE_URL=http://localhost:8080 pnpm check-types
API_BASE_URL=http://localhost:8080 pnpm build
```

PR CI는 같은 검사를 실행합니다.
