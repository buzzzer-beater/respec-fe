/**
 * AI 개발 요청 정리를 제목과 항목으로 나눕니다 (demo-design `renderAiSummary`).
 * 첫 줄이 "·"로 시작하지 않으면 제목이고, 나머지 줄은 앞의 "·"를 떼고 항목으로 둡니다.
 */
export const parseAiSummary = (text: string): { title: string | null; items: string[] } => {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const title = lines[0] && !lines[0].startsWith('·') ? (lines.shift() ?? null) : null;
  return { title, items: lines.map((line) => line.replace(/^·\s*/, '')) };
};
