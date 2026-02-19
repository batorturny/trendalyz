import { TrendalyzLogo } from '@/components/TrendalyzLogo';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[var(--surface-raised)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo - server rendered, no JS needed */}
        <div className="text-center mb-8 flex flex-col items-center">
          <TrendalyzLogo size="lg" />
          <p className="text-[var(--text-secondary)] text-sm mt-3 max-w-xs">
            Multi-platform social media analitika és riport dashboard
          </p>
        </div>

        {/* Interactive form - client component */}
        <LoginForm />
      </div>
    </div>
  );
}
