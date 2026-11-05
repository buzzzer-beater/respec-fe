import { DraftView } from '@/views/draft';
import { Sidebar } from '@/widgets/sidebar';

// 메인 페이지는 초안 생성 화면입니다. 사이트 뷰어와 프로젝트 설정 경로는 라우팅이 정해지면 바꿉니다.
const HomePage = () => {
  return (
    <div className="bg-surface-subtle flex h-screen">
      <Sidebar
        items={[
          { href: '/viewer', label: '사이트 뷰어' },
          { href: '/', label: '초안 생성' },
          { href: '/settings', label: '프로젝트 설정' },
        ]}
        project={{ name: 'Project Name', plan: 'plan' }}
      />
      <div aria-hidden className="bg-line-subtle w-px shrink-0" />
      <DraftView />
    </div>
  );
};

export default HomePage;
