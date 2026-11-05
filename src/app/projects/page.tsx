import { ProjectListView } from '@/views/project-list';
import { TopBar } from '@/widgets/top-bar';

const ProjectsPage = () => (
  <div className="flex h-screen flex-col">
    <TopBar />
    <ProjectListView />
  </div>
);

export default ProjectsPage;
