/** `POST /auth/signup`, `GET /auth/me` 응답 */
export interface User {
  id: number;
  email: string;
}

/** `POST /auth/login` 응답. JWT `sub`가 사용자 id입니다. */
export interface AccessToken {
  access_token: string;
}
