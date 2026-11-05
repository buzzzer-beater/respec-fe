import { ProjectListView } from '@/views/project-list';
import { TopBar } from '@/widgets/top-bar';

const ProjectsPage = () => (
  <div className="flex h-screen flex-col">
    <TopBar title="내 프로젝트" />
    <ProjectListView />
  </div>
);

export default ProjectsPage;
