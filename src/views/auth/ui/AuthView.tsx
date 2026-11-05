import { AuthForm } from '@/features/auth';

interface AuthViewProps {
  mode: 'login' | 'signup';
}

const AuthView = ({ mode }: AuthViewProps) => {
  return (
    <main className="bg-canvas flex min-h-screen items-center justify-center p-8">
      <AuthForm mode={mode} />
    </main>
  );
};

export default AuthView;
