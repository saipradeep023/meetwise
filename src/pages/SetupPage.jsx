export default function SetupPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <section className="max-w-xl rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">MeetWise setup</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Connect your Supabase project</h1>
        <p className="mt-3 text-slate-600">Copy <code>.env.example</code> to <code>.env.local</code>, then add the project URL and publishable key. The browser never needs a service-role key.</p>
      </section>
    </main>
  )
}
