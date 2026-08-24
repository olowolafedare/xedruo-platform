import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Store, Truck, MapPin, Heart, Plus, UserCircle2, Package, LogIn } from 'lucide-react';
import { xedruo } from '@/api/xedruoClient';

const categories = ['All', 'Phones & Electronics', 'Fashion', 'Home', 'Beauty', 'Food & Groceries', 'Vehicles', 'Services'];
const products = [
  { id: 1, name: 'Smartphone Pro 256GB', price: '₦485,000', seller: 'Adom Tech Store', location: 'Lagos', category: 'Phones & Electronics', badge: 'Verified' },
  { id: 2, name: 'Premium Sneakers', price: '₦58,000', seller: 'Urban Steps', location: 'Ikeja', category: 'Fashion', badge: 'Top seller' },
  { id: 3, name: '4-Burner Gas Cooker', price: '₦145,000', seller: 'HomePlus', location: 'Lekki', category: 'Home', badge: 'Fast delivery' },
  { id: 4, name: 'Weekly Grocery Box', price: '₦42,500', seller: 'Fresh Basket', location: 'Yaba', category: 'Food & Groceries', badge: 'Nearby' },
  { id: 5, name: 'Wireless Headphones', price: '₦39,900', seller: 'Sound Hub', location: 'Surulere', category: 'Phones & Electronics', badge: 'Verified' },
  { id: 6, name: 'Designer Handbag', price: '₦72,000', seller: 'Adom Fashion', location: 'Victoria Island', category: 'Fashion', badge: 'New' },
];

export default function AdomLanding() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [showSell, setShowSell] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const filtered = useMemo(() => products.filter(p =>
    (category === 'All' || p.category === category) &&
    `${p.name} ${p.seller} ${p.location}`.toLowerCase().includes(query.toLowerCase())
  ), [query, category]);

  const loginWithGoogle = async () => {
    setError(''); setGoogleLoading(true);
    try { await xedruo.auth.loginWithProvider('google', '/adom'); }
    catch (e) { setError(e?.message || 'Google sign-in failed.'); setGoogleLoading(false); }
  };

  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-5 px-4 lg:px-8">
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-2xl font-black tracking-tight text-emerald-700">ADOM</button>
        <div className="hidden md:flex flex-1 max-w-2xl relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products, stores and services" className="w-full rounded-xl border bg-slate-50 py-2.5 pl-10 pr-4 outline-none focus:border-emerald-500" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setShowSell(true)} className="hidden sm:inline-flex items-center gap-2 rounded-xl px-3 py-2 font-semibold text-emerald-700 hover:bg-emerald-50"><Plus className="h-4 w-4" />Sell</button>
          <button onClick={loginWithGoogle} disabled={googleLoading} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-700"><LogIn className="h-4 w-4" />{googleLoading ? 'Opening…' : 'Login with Google'}</button>
        </div>
      </div>
      <div className="md:hidden px-4 pb-3"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search products, stores and services" className="w-full rounded-xl border bg-slate-50 py-2 pl-9 pr-3 outline-none"/></div></div>
    </header>

    <main>
      <section className="bg-emerald-700 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-2 lg:px-8 lg:py-20">
          <div>
            <span className="inline-flex rounded-full bg-yellow-300 px-3 py-1 text-sm font-bold text-emerald-950">Buy · Sell · Deliver</span>
            <h1 className="mt-5 text-5xl font-black leading-tight sm:text-6xl">Your marketplace for buying and selling.</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/85">Shop products and local stores, sell your own items, order from nearby merchants and track delivery — all through Adom.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' })} className="rounded-2xl bg-yellow-300 px-7 py-4 font-extrabold text-emerald-950 shadow-lg hover:bg-yellow-200">Get Started</button>
              <button onClick={loginWithGoogle} className="rounded-2xl border border-white/30 bg-white/10 px-7 py-4 font-bold hover:bg-white/15">Login with Google</button>
            </div>
            {error && <div className="mt-4 rounded-xl bg-white/10 p-3 text-sm">{error}</div>}
          </div>
          <div className="rounded-3xl border border-white/15 bg-black/10 p-5 shadow-2xl">
            <div className="grid grid-cols-2 gap-4">
              {[['Buy','Browse products & stores',ShoppingBag],['Sell','List products & manage sales',Store],['Local','Find nearby merchants',MapPin],['Delivery','Track every order',Truck]].map(([title,text,Icon]) => <div key={title} className="rounded-2xl bg-white/10 p-5"><Icon className="h-6 w-6 text-yellow-300"/><div className="mt-4 text-xl font-extrabold">{title}</div><p className="mt-1 text-sm text-white/70">{text}</p></div>)}
            </div>
          </div>
        </div>
      </section>

      <section id="marketplace" className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-3xl font-black">Shop on Adom</h2><p className="mt-1 text-slate-500">Products, stores and local sellers.</p></div><button onClick={() => setShowSell(true)} className="inline-flex w-fit items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-bold text-white"><Plus className="h-4 w-4"/>Start Selling</button></div>
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">{categories.map(c => <button key={c} onClick={() => setCategory(c)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${category===c?'bg-emerald-600 text-white':'bg-white border text-slate-600 hover:bg-emerald-50'}`}>{c}</button>)}</div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(p => <article key={p.id} className="overflow-hidden rounded-3xl border bg-white shadow-sm hover:shadow-md"><div className="relative grid h-48 place-items-center bg-emerald-50"><ShoppingBag className="h-12 w-12 text-emerald-300"/><button className="absolute right-3 top-3 rounded-full bg-white p-2 shadow"><Heart className="h-4 w-4 text-slate-500"/></button><span className="absolute left-3 top-3 rounded-full bg-yellow-300 px-2 py-1 text-xs font-bold text-emerald-950">{p.badge}</span></div><div className="p-5"><h3 className="font-bold text-lg">{p.name}</h3><div className="mt-2 text-xl font-black text-emerald-700">{p.price}</div><div className="mt-3 flex items-center gap-2 text-sm text-slate-500"><Store className="h-4 w-4"/>{p.seller}</div><div className="mt-1 flex items-center gap-2 text-sm text-slate-500"><MapPin className="h-4 w-4"/>{p.location}</div><button className="mt-4 w-full rounded-xl bg-emerald-600 py-3 font-bold text-white hover:bg-emerald-700">View product</button></div></article>)}
        </div>
        {!filtered.length && <div className="rounded-3xl border bg-white p-10 text-center text-slate-500">No matching products yet. Try another search or category.</div>}
      </section>

      <section className="border-y bg-white"><div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:grid-cols-3 lg:px-8">{[['Buyer','Search, compare, order and track purchases.',Package],['Seller','Create listings, manage stock and receive orders.',Store],['Delivery','Connect orders with local delivery and tracking.',Truck]].map(([title,text,Icon])=><div key={title} className="rounded-2xl bg-slate-50 p-6"><Icon className="h-7 w-7 text-emerald-600"/><h3 className="mt-4 text-xl font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></div>)}</div></section>
    </main>

    {showSell && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setShowSell(false)}><div onClick={e=>e.stopPropagation()} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-2xl font-black">Start selling on Adom</h2><button onClick={()=>setShowSell(false)} className="text-slate-400">✕</button></div><p className="mt-2 text-sm text-slate-500">Login with Google to create your seller profile, list products and manage orders.</p><button onClick={loginWithGoogle} className="mt-6 w-full rounded-xl bg-emerald-600 py-3 font-bold text-white">Continue with Google</button></div></div>}
  </div>;
}
