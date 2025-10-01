import { LoginForm } from '@/components/login/login_form';

type Props = {
  searchParams: Promise<{ message?: string }>;
};

export default async function SignUp({ searchParams }: Props) {
  const { message } = await searchParams;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm isSignUp={true} message={message} />
      </div>
    </div>
  );
}
