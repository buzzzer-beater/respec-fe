import { PIN_SCRIPT_PATH } from '@/shared/lib/pin-bridge';

/** 배포 사이트 `<head>`에 넣을 핀 스크립트 태그 */
export const getPinScriptTag = (appOrigin: string) =>
  `<script async src="${appOrigin}${PIN_SCRIPT_PATH}"></script>`;
