import { DraftView } from '@/views/draft';

// 메인 페이지는 새 프로젝트 초안 생성 화면입니다. 상단 바는 화면이 직접 그려 제목을 바꿉니다.
const HomePage = () => (
  <div className="flex h-screen flex-col">
    <DraftView />
  </div>
);

export default HomePage;
