export const API_BASE_URL = process.env.API_BASE_URL;

/**
 * 브라우저가 `/backend` rewrite를 거치지 않고 백엔드를 바로 부를 때 쓰는 주소입니다.
 * Vercel의 외부 rewrite는 120초에 끊겨서, 그보다 오래 걸리는 초안 생성에만 씁니다.
 * 없으면 `/backend`로 보냅니다. `NEXT_PUBLIC_` 값은 빌드할 때 번들에 들어갑니다.
 */
export const PUBLIC_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') || undefined;
