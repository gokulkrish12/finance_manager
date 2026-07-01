// Split-screen shell used by the Login and Register pages.
const AuthShell = ({ children }) => (
  <div className="flex min-h-screen">
    <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-brand-600 to-brand-800 p-12 text-white lg:flex">
      <div className="flex items-center gap-2 text-2xl font-extrabold">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">₹</span> FinTrack
      </div>
      <div>
        <h1 className="text-4xl font-extrabold leading-tight">Take control of your money.</h1>
        <p className="mt-4 max-w-md text-brand-100">
          Track expenses, set budgets, hit savings goals, and see exactly where your money goes — all in one place.
        </p>
        <ul className="mt-8 space-y-3 text-brand-100">
          {['Categorized expense tracking', 'Real-time budget alerts', 'Visual reports & CSV/PDF export', 'Savings goals with progress'].map((f) => (
            <li key={f} className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">✓</span>
              {f}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-sm text-brand-200">© {new Date().getFullYear()} FinTrack. Personal Finance Manager.</p>
    </div>
    <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  </div>
);

export default AuthShell;
