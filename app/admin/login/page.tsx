import LoginForm from "./LoginForm";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const { denied } = await searchParams;
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm border border-white/10 bg-[#171232] p-6 sm:p-8">
        <p className="font-serif text-sm uppercase tracking-[0.24em]">
          Kaara <span className="text-white/50">&amp; Co</span>
        </p>
        <h1 className="mt-6 font-serif text-3xl">Staff sign in</h1>
        <LoginForm denied={denied === "1"} />
      </div>
    </main>
  );
}
