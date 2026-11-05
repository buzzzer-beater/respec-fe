// 해커톤 시연용: 설명에 키워드가 있으면 AI 초안을 만들지 않고 미리 배포해 둔 사이트를 연결합니다.

const DEMO_KEYWORD = '신발';

export const DEMO_DEPLOYMENT_URL = 'https://morrow-demo-a.vercel.app/';

/** 실제로 만드는 것처럼 보이도록 만드는 중 화면을 보여 주는 시간 */
export const DEMO_MAKING_DELAY_MS = 12000;

export const isDemoPrompt = (prompt: string) => prompt.includes(DEMO_KEYWORD);
