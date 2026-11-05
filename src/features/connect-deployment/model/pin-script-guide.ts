import { PIN_SCRIPT_PATH } from '@/shared/lib/pin-bridge';

/** 배포 사이트 `<head>`에 넣을 핀 스크립트 태그 */
export const getPinScriptTag = (appOrigin: string) =>
  `<script async src="${appOrigin}${PIN_SCRIPT_PATH}"></script>`;

/** RE:SPEC 화면 안(iframe)에서 사이트가 열리도록 허용하는 Vercel 헤더 설정 */
export const getFrameAncestorsConfig = (appOrigin: string) =>
  JSON.stringify(
    {
      headers: [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'Content-Security-Policy',
              value: `frame-ancestors 'self' ${appOrigin}`,
            },
          ],
        },
      ],
    },
    null,
    2,
  );
