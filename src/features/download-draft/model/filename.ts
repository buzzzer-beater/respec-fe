// 파일 이름에 쓸 수 없는 문자
const INVALID_FILENAME_CHARS = /[\\/:*?"<>|\u0000-\u001f]/g;

/** 응답에 파일 이름이 없을 때 쓰는 `<프로젝트 이름>-draft.zip` */
export const toDraftZipFilename = (projectName: string | undefined) => {
  const base = (projectName ?? '').replace(INVALID_FILENAME_CHARS, '').trim();
  return `${base || 'respec'}-draft.zip`;
};
