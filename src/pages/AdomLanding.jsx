import React from 'react';

export default function AdomLanding({ onGetStarted, onGoogleLogin }) {
  return (
    <main className="min-h-screen bg-green-700 text-white">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 lg:px-12">
        <header className="flex items-center justify-between">
          <div className="text-2xl font-extrabold tracking-tight">ADOM</div>
          <button onClick={onGoogleLogin} className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 font-semibold backdrop-blur">
            Login with Google
          </button>
        </header>

        <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-2">
          <div>
            <span className="inline-flex rounded-full bg-yellow-300 px-3 py-1 text-sm font-bold text-green-950">Buy. Sell. Deliver.</span>
            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-tight tracking-tight sm:text-6xl">
              Everything you want to buy or sell, in one place.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/85">
              Discover products and local stores, create your own listings, shop from merchants and get your orders delivered.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={onGetStarted} className="rounded-2xl bg-yellow-300 px-7 py-4 font-extrabold text-green-950 shadow-lg transition hover:bg-yellow-200">
                Get Started
              </button>
              <button onClick={onGoogleLogin} className="rounded-2xl border border-white/30 bg-white/10 px-7 py-4 font-bold backdrop-blur transition hover:bg-white/15">
                Login with Google
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/15 bg-black/10 p-6 shadow-2xl backdrop-blur">
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Buy', 'Shop products and stores'],
                ['Sell', 'List products and manage sales'],
                ['Local', 'Find nearby merchants'],
                ['Delivery', 'Track your order'],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl bg-white/10 p-5">
                  <div className="text-xl font-extrabold">{title}</div>
                  <p className="mt-2 text-sm leading-6 text-white/70">{text}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl bg-yellow-300 p-5 text-green-950">
              <div className="font-extrabold">One marketplace. Multiple ways to shop.</div>
              <p className="mt-1 text-sm font-medium">Marketplace listings, stores, local commerce and delivery.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
