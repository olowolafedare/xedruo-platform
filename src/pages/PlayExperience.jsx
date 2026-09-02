import React,{useEffect,useMemo,useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {Activity,Camera,ChevronLeft,ChevronRight,Copy,Heart,Home,Library,ListMusic,Music2,Pause,Play,Plus,Search,ShoppingBag,Ticket,UserCircle2,Users,Volume2} from 'lucide-react';
import {xedruo} from '@/api/xedruoClient';
import {ensureXedruoId} from '@/lib/xedruoIdentity';

const tracks=[
 ['t1','Midnight Signal','Lunar Ave','Afro-Fusion'],
 ['t2','Golden Hour','Tola Vibes','Afrobeat'],
 ['t3','After Rain','Mara Sound','Soul / R&B'],
 ['t4','City Lights','Kobe Drift','Hip-Hop'],
 ['t5','Late Night','Sade Moon','R&B'],
 ['t6','New Wave','Tola Vibes','Afrobeat'],
];
const artists=[['a1','Lunar Ave','Afro-Fusion'],['a2','Mara Sound','Soul / R&B'],['a3','Kobe Drift','Hip-Hop'],['a4','Nneka Blues','Blues'],['a5','Tola Vibes','Afrobeat'],['a6','Sade Moon','R&B']];
const events=[['e1','Lagos Live Sessions','Live music · Lagos','/sell-tickets'],['e2','Afro Fusion Night','Live event · Lagos','/sell-tickets'],['e3','Xedruo Artist Showcase','Artists · Lagos','/sell-tickets']];

export default function PlayExperience(){
 const navigate=useNavigate();
 const [section,setSection]=useState('home');
 const [query,setQuery]=useState('');
 const [playing,setPlaying]=useState(null);
 const [liked,setLiked]=useState([]);
 const [profileOpen,setProfileOpen]=useState(false);
 const [user,setUser]=useState(null);
 const [xedruoId,setXedruoId]=useState('');
 const [library,setLibrary]=useState(['t1','t2']);

 useEffect(()=>{(async()=>{try{const me=await xedruo.auth.me();setUser(me);const xid=await ensureXedruoId();setXedruoId(xid?.xedruoId||xid?.xedruo_id||'')}catch{}})()},[]);
 const filteredTracks=useMemo(()=>tracks.filter(t=>t.slice(1).join(' ').toLowerCase().includes(query.toLowerCase())),[query]);
 const filteredArtists=useMemo(()=>artists.filter(a=>a.join(' ').toLowerCase().includes(query.toLowerCase())),[query]);
 const firstName=user?.full_name?.split(' ')[0]||'there';
 const avatar=user?.avatar_url||user?.user_metadata?.avatar_url||user?.user_metadata?.picture||'';
 const toggleLike=(id)=>setLiked(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id]);
 const toggleLibrary=(id)=>setLibrary(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id]);
 const copyId=()=>xedruoId&&navigator.clipboard?.writeText(xedruoId).catch(()=>{});
 const playTrack=(id)=>setPlaying(v=>v===id?null:id);
 const current=tracks.find(t=>t[0]===playing);

 return <div className="min-h-screen bg-[#121212] text-white pb-28">
  <header className="sticky top-0 z-40 bg-[#121212]/95 backdrop-blur border-b border-white/5">
   <div className="max-w-7xl mx-auto px-4 h-20 flex items-center gap-4">
    <button onClick={()=>navigate('/pay-and-play/pay')} className="text-xs font-semibold text-white/60 hover:text-white px-3 py-2 rounded-full border border-white/10">PAY</button>
    <button onClick={()=>setProfileOpen(true)} className="shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-400" aria-label="Open profile">
      {avatar?<img src={avatar} alt="Profile" className="w-11 h-11 rounded-full object-cover"/>:<span className="w-11 h-11 rounded-full bg-emerald-500 grid place-items-center font-bold">{firstName.charAt(0).toUpperCase()}</span>}
    </button>
    <div className="min-w-0"><div className="font-bold truncate">PLAY</div><div className="text-xs text-white/50 truncate">Music, artists, events and experiences</div></div>
    <div className="ml-auto hidden md:flex items-center gap-2 bg-[#242424] rounded-full px-4 h-11 w-[420px]"><Search className="w-5 h-5 text-white/50"/><input value={query} onChange={e=>{setQuery(e.target.value);setSection('search')}} placeholder="What do you want to listen to?" className="bg-transparent outline-none w-full text-sm placeholder:text-white/40"/></div>
    <button onClick={()=>setProfileOpen(true)} className="hidden sm:block text-sm text-white/70 hover:text-white">{firstName}</button>
   </div>
  </header>

  <div className="max-w-7xl mx-auto px-4 py-6">
   <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
    <aside className="hidden lg:block">
      <nav className="space-y-1 sticky top-24">
       <SideNav active={section==='home'} onClick={()=>setSection('home')} icon={Home} label="Home"/>
       <SideNav active={section==='search'} onClick={()=>setSection('search')} icon={Search} label="Search"/>
       <SideNav active={section==='library'} onClick={()=>setSection('library')} icon={Library} label="Your Library"/>
       <div className="pt-5 pb-2 px-3 text-[11px] font-bold uppercase tracking-widest text-white/40">Create & discover</div>
       <SideNav onClick={()=>navigate('/artist-catalog')} icon={Users} label="Artists"/>
       <SideNav onClick={()=>navigate('/sell-tickets')} icon={Ticket} label="Live Events"/>
       <SideNav onClick={()=>navigate('/creator-store')} icon={ShoppingBag} label="Artist Market / Store"/>
       <SideNav onClick={()=>setSection('premium')} icon={Activity} label="Premium"/>
      </nav>
    </aside>

    <main className="min-w-0">
      {section==='home'&&<HomeContent firstName={firstName} tracks={tracks} artists={artists} events={events} playing={playing} playTrack={playTrack} liked={liked} toggleLike={toggleLike} navigate={navigate}/>} 
      {section==='search'&&<SearchContent query={query} setQuery={setQuery} tracks={filteredTracks} artists={filteredArtists} playing={playing} playTrack={playTrack} navigate={navigate}/>} 
      {section==='library'&&<LibraryContent tracks={tracks.filter(t=>library.includes(t[0]))} playing={playing} playTrack={playTrack} liked={liked} toggleLike={toggleLike} toggleLibrary={toggleLibrary}/>} 
      {section==='premium'&&<PremiumContent/>}
    </main>
   </div>
  </div>

  {current&&<div className="fixed bottom-[72px] md:bottom-0 left-0 right-0 z-50 bg-[#242424] border-t border-white/10"><div className="max-w-7xl mx-auto h-16 px-4 flex items-center gap-4"><div className="w-10 h-10 rounded-md bg-gradient-to-br from-emerald-400 to-slate-900 grid place-items-center"><Music2 className="w-5 h-5"/></div><div className="min-w-0 flex-1"><div className="font-semibold text-sm truncate">{current[1]}</div><div className="text-xs text-white/50 truncate">{current[2]}</div></div><button onClick={()=>playTrack(current[0])} className="w-9 h-9 rounded-full bg-white text-black grid place-items-center">{playing===current[0]?<Pause className="w-4 h-4"/>:<Play className="w-4 h-4 fill-current"/>}</button><Volume2 className="w-5 h-5 text-white/60"/></div></div>}

  <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#000]/95 border-t border-white/10"><div className="h-16 grid grid-cols-5"><MobileNav active={section==='home'} onClick={()=>setSection('home')} icon={Home} label="Home"/><MobileNav active={section==='search'} onClick={()=>setSection('search')} icon={Search} label="Search"/><MobileNav active={section==='library'} onClick={()=>setSection('library')} icon={Library} label="Your Library"/><MobileNav onClick={()=>navigate('/creator-store')} icon={ShoppingBag} label="Market"/><MobileNav onClick={()=>setProfileOpen(true)} icon={UserCircle2} label="Profile"/></div></nav>

  {profileOpen&&<ProfilePanel user={user} id={xedruoId} avatar={avatar} firstName={firstName} copyId={copyId} onClose={()=>setProfileOpen(false)} navigate={navigate}/>} 
 </div>
}

function SideNav({active,onClick,icon:I,label}){return <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left font-semibold text-sm ${active?'bg-white/10 text-white':'text-white/60 hover:text-white hover:bg-white/5'}`}><I className="w-5 h-5"/>{label}</button>}
function MobileNav({active,onClick,icon:I,label}){return <button onClick={onClick} className={`flex flex-col items-center justify-center gap-1 text-[10px] ${active?'text-white':'text-white/50'}`}><I className="w-5 h-5"/><span>{label}</span></button>}

function Cover({label,subtitle}){return <div className="aspect-square rounded-xl bg-gradient-to-br from-emerald-400 via-teal-800 to-slate-950 grid place-items-center text-center p-4"><div><Music2 className="w-8 h-8 mx-auto mb-2"/><div className="font-bold text-sm">{label}</div>{subtitle&&<div className="text-xs text-white/60 mt-1">{subtitle}</div>}</div></div>}
function TrackCard({track,playing,playTrack,liked,toggleLike}){const[id,title,artist]=track;return <div className="group rounded-xl bg-[#181818] hover:bg-[#222] p-3 transition"><div className="relative"><Cover label={title}/><button onClick={()=>playTrack(id)} className="absolute right-2 bottom-2 w-10 h-10 rounded-full bg-emerald-500 text-black grid place-items-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition shadow-lg">{playing===id?<Pause className="w-5 h-5"/>:<Play className="w-5 h-5 fill-current"/>}</button></div><div className="mt-3 font-semibold truncate">{title}</div><div className="text-sm text-white/50 truncate">{artist}</div><button onClick={()=>toggleLike(id)} className="mt-2 text-xs text-white/50 hover:text-emerald-400 flex items-center gap-1">{liked.includes(id)?<Heart className="w-4 h-4 fill-current text-emerald-400"/>:<Heart className="w-4 h-4"/>}{liked.includes(id)?'Liked':'Like'}</button></div>}

function HomeContent({firstName,tracks,artists,events,playing,playTrack,liked,toggleLike,navigate}){return <div className="space-y-10"><section><div className="flex items-center justify-between mb-4"><div><div className="text-xs uppercase tracking-[0.25em] text-emerald-400 font-bold">Discover</div><h1 className="text-3xl md:text-5xl font-black mt-2">Good afternoon{firstName&&`, ${firstName}`}</h1></div><div className="hidden md:flex gap-2"><button className="w-9 h-9 rounded-full bg-white/10 grid place-items-center"><ChevronLeft className="w-5 h-5"/></button><button className="w-9 h-9 rounded-full bg-white/10 grid place-items-center"><ChevronRight className="w-5 h-5"/></button></div></div><div className="grid grid-cols-2 md:grid-cols-3 gap-3">{tracks.map(t=><TrackCard key={t[0]} track={t} playing={playing} playTrack={playTrack} liked={liked} toggleLike={toggleLike}/>)}</div></section>
<section><h2 className="text-2xl font-bold mb-4">Made for you</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{artists.slice(0,4).map(a=><button key={a[0]} onClick={()=>navigate('/artist/'+a[0])} className="text-left"><Cover label={a[1]} subtitle={a[2]}/><div className="font-semibold mt-2">{a[1]}</div><div className="text-sm text-white/50">{a[2]}</div></button>)}</div></section>
<section><div className="flex items-center justify-between mb-4"><h2 className="text-2xl font-bold">Live events</h2><button onClick={()=>navigate('/sell-tickets')} className="text-sm font-bold text-white/60 hover:text-white">See all</button></div><div className="grid md:grid-cols-3 gap-4">{events.map(e=><button key={e[0]} onClick={()=>navigate(e[3])} className="text-left rounded-xl bg-[#181818] hover:bg-[#222] p-4"><div className="aspect-[16/9] rounded-lg bg-gradient-to-br from-purple-600 via-emerald-500 to-slate-950 grid place-items-center"><Ticket className="w-10 h-10"/></div><div className="font-bold mt-3">{e[1]}</div><div className="text-sm text-white/50 mt-1">{e[2]}</div><div className="mt-3 text-sm text-emerald-400 font-semibold">Buy Ticket →</div></button>)}</div></section>
<section><h2 className="text-2xl font-bold mb-4">Your Xedruo services</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><ServiceCard icon={Ticket} title="Buy Ticket" text="Discover live events and manage your tickets." onClick={()=>navigate('/sell-tickets')}/><ServiceCard icon={Users} title="Book Artist" text="Find artists, availability and booking services." onClick={()=>navigate('/artist-catalog')}/><ServiceCard icon={ShoppingBag} title="Artist Market / Store" text="Shop artist products, music and experiences." onClick={()=>navigate('/creator-store')}/></div></section></div>}
function ServiceCard({icon:I,title,text,onClick}){return <button onClick={onClick} className="rounded-2xl bg-[#181818] hover:bg-[#242424] p-5 text-left border border-white/5"><span className="w-11 h-11 rounded-full bg-emerald-500 text-black grid place-items-center"><I className="w-5 h-5"/></span><h3 className="font-bold text-lg mt-4">{title}</h3><p className="text-sm text-white/50 mt-1">{text}</p><div className="mt-4 text-sm text-emerald-400 font-semibold">Open →</div></button>}

function SearchContent({query,setQuery,tracks,artists,playing,playTrack,navigate}){return <div className="space-y-8"><div className="md:hidden flex items-center gap-3 bg-white text-black rounded-lg px-4 h-14"><Search className="w-5 h-5"/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="What do you want to listen to?" className="outline-none w-full"/></div><section><h1 className="text-3xl font-black">Search</h1><p className="text-white/50 mt-1">Find music, artists, events and Xedruo services.</p></section>{query?<><section><h2 className="text-xl font-bold mb-4">Songs</h2><div className="space-y-2">{tracks.length?tracks.map(t=><button key={t[0]} onClick={()=>playTrack(t[0])} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 text-left"><div className="w-12 h-12 rounded-md bg-gradient-to-br from-emerald-400 to-slate-900 grid place-items-center"><Play className="w-5 h-5"/></div><div className="flex-1"><div className="font-semibold">{t[1]}</div><div className="text-sm text-white/50">{t[2]} · {t[3]}</div></div></button>):<div className="text-white/40">No songs found.</div>}</div></section><section><h2 className="text-xl font-bold mb-4">Artists</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{artists.map(a=><button key={a[0]} onClick={()=>navigate('/artist/'+a[0])} className="text-left"><Cover label={a[1]} subtitle={a[2]}/><div className="font-semibold mt-2">{a[1]}</div></button>)}</div></section></>:<section><h2 className="text-2xl font-bold mb-4">Browse all</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{['Music','Podcasts','Artists','Albums','Live Events','Made For You','Buy Tickets','Artist Market'].map((x,i)=><button key={x} onClick={()=>i===6?navigate('/sell-tickets'):i===7?navigate('/creator-store'):i===2?navigate('/artist-catalog'):null} className="aspect-[4/3] rounded-xl bg-gradient-to-br from-emerald-500 to-slate-900 p-5 text-left font-black text-xl">{x}</button>)}</div></section>}</div>}

function LibraryContent({tracks,playing,playTrack,liked,toggleLike,toggleLibrary}){return <div className="space-y-8"><div><h1 className="text-3xl font-black">Your Library</h1><p className="text-white/50 mt-1">Playlists, liked music, artists and saved content.</p></div><div className="flex gap-2 overflow-x-auto pb-1">{['Playlists','Podcasts','Albums','Artists','Downloads'].map(x=><button key={x} className="px-5 py-2 rounded-full bg-white/10 whitespace-nowrap font-semibold">{x}</button>)}</div><section><div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 mb-2"><div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-emerald-300 grid place-items-center"><Heart className="w-8 h-8 fill-current"/></div><div><div className="font-bold text-lg">Liked Songs</div><div className="text-sm text-white/50">{liked.length} liked tracks</div></div></div>{tracks.length?tracks.map(t=><div key={t[0]} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5"><div className="w-12 h-12 rounded-md bg-gradient-to-br from-emerald-400 to-slate-900 grid place-items-center"><Music2 className="w-5 h-5"/></div><button onClick={()=>playTrack(t[0])} className="text-left flex-1"><div className="font-semibold">{t[1]}</div><div className="text-sm text-white/50">{t[2]}</div></button><button onClick={()=>toggleLibrary(t[0])} className="text-white/40 hover:text-white"><Plus className="w-5 h-5 rotate-45"/></button></div>):<div className="py-10 text-center text-white/40">Your library is ready for music.</div>}</section></div>}

function PremiumContent(){return <div className="space-y-8"><div className="rounded-2xl p-8 md:p-12 bg-gradient-to-br from-emerald-500 via-teal-800 to-slate-950"><div className="flex items-center gap-2 font-bold"><Activity className="w-5 h-5"/> PLAY Premium</div><h1 className="text-4xl md:text-6xl font-black mt-6">More music. More freedom.</h1><p className="text-white/70 max-w-2xl mt-4">Premium listening, offline access, better audio and an uninterrupted PLAY experience.</p><button className="mt-7 bg-white text-black rounded-full px-8 py-3 font-bold">Explore Premium</button></div><div className="grid md:grid-cols-2 gap-4">{[['Ad-free listening','Enjoy music without interruptions.'],['Offline listening','Save your favourite music for offline playback.'],['High audio quality','Listen with richer, clearer sound.'],['Listen with friends','Share your listening experience in real time.']].map(([a,b])=><div key={a} className="bg-[#181818] rounded-xl p-5"><h3 className="font-bold text-lg">{a}</h3><p className="text-white/50 mt-2 text-sm">{b}</p></div>)}</div></div>}

function ProfilePanel({user,id,avatar,firstName,copyId,onClose,navigate}){return <div className="fixed inset-0 z-[70] bg-black/70 flex justify-end" onClick={onClose}><div className="w-full max-w-md h-full bg-[#181818] border-l border-white/10 p-6 overflow-y-auto" onClick={e=>e.stopPropagation()}><div className="flex items-center justify-between"><button onClick={onClose} className="text-white/60 hover:text-white">Close</button><button onClick={()=>navigate('/pay-and-play/pay')} className="text-xs px-3 py-2 rounded-full border border-white/10">PAY</button></div><div className="flex flex-col items-center text-center pt-10"><div className="w-28 h-28 rounded-full overflow-hidden bg-emerald-500 grid place-items-center text-3xl font-black">{avatar?<img src={avatar} alt="Profile" className="w-full h-full object-cover"/>:firstName.charAt(0).toUpperCase()}</div><h2 className="text-2xl font-black mt-5">{user?.full_name||'Xedruo User'}</h2><div className="mt-2 flex items-center gap-2 text-emerald-400 font-mono text-sm"><span>{id||'XEDRUO-ID-PENDING'}</span><button onClick={copyId} aria-label="Copy Xedruo ID"><Copy className="w-4 h-4"/></button></div></div><div className="grid grid-cols-3 gap-3 mt-10"><ProfileAction icon={Ticket} title="Buy Ticket" onClick={()=>navigate('/sell-tickets')}/><ProfileAction icon={Users} title="Book Artist" onClick={()=>navigate('/artist-catalog')}/><ProfileAction icon={ShoppingBag} title="Artist Store" onClick={()=>navigate('/creator-store')}/></div><div className="mt-8 rounded-2xl bg-[#242424] p-5"><div className="flex items-center gap-3"><ListMusic className="w-5 h-5 text-emerald-400"/><div><div className="font-bold">Your Playlists</div><div className="text-sm text-white/50">Create and manage your music collection.</div></div></div><button onClick={onClose} className="mt-4 w-full rounded-full bg-white text-black py-3 font-bold">View Library</button></div></div></div>}
function ProfileAction({icon:I,title,onClick}){return <button onClick={onClick} className="rounded-xl bg-[#242424] hover:bg-[#2b2b2b] p-4 text-center"><I className="w-6 h-6 mx-auto text-emerald-400"/><div className="text-xs font-bold mt-2">{title}</div></button>}
