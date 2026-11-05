import { AuthForm } from '@/features/auth';
import { TopBar } from '@/widgets/top-bar';

interface AuthViewProps {
  mode: 'login' | 'signup';
}

const AuthView = ({ mode }: AuthViewProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <main className="flex flex-1 items-center justify-center p-8 pb-24">
        <AuthForm mode={mode} />
      </main>
    </div>
  );
};

export default AuthView;
