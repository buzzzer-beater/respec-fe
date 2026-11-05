/** Blob을 파일로 저장합니다. 브라우저에서만 씁니다. */
export const saveBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  // 바로 해제하면 일부 브라우저에서 다운로드가 취소되어 조금 뒤에 해제합니다.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
