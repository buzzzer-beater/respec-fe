import { isAxiosError } from 'axios';

/** 파일 응답. 파일 이름은 `Content-Disposition`에 있을 때만 있습니다. */
export interface FileResponse {
  blob: Blob;
  filename: string | null;
}

const decode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

/** `Content-Disposition`에서 파일 이름을 꺼냅니다. `filename*`(UTF-8)을 먼저 씁니다. */
export const parseContentDispositionFilename = (header: unknown): string | null => {
  if (typeof header !== 'string') return null;

  const encoded = /filename\*\s*=\s*([^;]+)/i.exec(header);
  if (encoded) {
    // 예: UTF-8''%EC%B4%88%EC%95%88.zip
    const value = encoded[1].trim().replace(/^"(.*)"$/, '$1');
    const name = decode(value.replace(/^[^']*'[^']*'/, ''));
    if (name) return name;
  }

  const plain = /filename\s*=\s*("([^"]*)"|[^;]+)/i.exec(header);
  const name = (plain?.[2] ?? plain?.[1])?.trim();
  return name || null;
};

/**
 * `responseType: 'blob'`이면 오류 본문도 Blob으로 옵니다.
 * `toApiError`가 오류 코드를 읽을 수 있게 JSON 본문을 객체로 바꿔 둡니다.
 */
export const parseBlobErrorBody = async (error: unknown) => {
  if (!isAxiosError(error) || !(error.response?.data instanceof Blob)) return error;
  try {
    error.response.data = JSON.parse(await error.response.data.text());
  } catch {
    // JSON이 아니면 그대로 두고 알 수 없는 오류로 처리합니다.
  }
  return error;
};
