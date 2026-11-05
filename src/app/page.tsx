import { DraftView } from '@/views/draft';
import { TopBar } from '@/widgets/top-bar';

// 메인 페이지는 초안 생성 화면입니다.
const HomePage = () => {
  return (
    <div className="flex h-screen flex-col">
      <TopBar />
      <DraftView />
    </div>
  );
};

export default HomePage;
