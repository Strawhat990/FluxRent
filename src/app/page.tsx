"use client";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // Cursor
    const cur = document.getElementById('cur');
    const cur2 = document.getElementById('cur2');
    const onMouseMove = (e: MouseEvent) => {
      const mx = e.clientX;
      const my = e.clientY;
      if (cur) { cur.style.left = mx + 'px'; cur.style.top = my + 'px'; }
      setTimeout(() => { if (cur2) { cur2.style.left = mx + 'px'; cur2.style.top = my + 'px'; } }, 90);
    };
    document.addEventListener('mousemove', onMouseMove);

    // Observer
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal,.listing-card,.featured-card,.how-step,.cat-card,.review-card').forEach(el => obs.observe(el));

    // Stats Counters
    function counter(el: Element | null, end: number, prefix: string = '', suffix: string = '') {
      let v=0; const step=end/(1800/16);
      const t=setInterval(()=>{ v=Math.min(v+step,end); if(el) el.textContent=prefix+Math.floor(v).toLocaleString('en-IN')+suffix; if(v>=end)clearInterval(t); },16);
    }
    const statsObs = new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          counter(document.getElementById('sn1'),1200,'','+ items');
          counter(document.getElementById('sn2'),8500,'','+ users');
          counter(document.getElementById('sn3'),12,'','+ cities');
          counter(document.getElementById('sn4'),0,'₹');
          setTimeout(()=>counter(document.getElementById('sn4'),9500,'₹'),0);
          statsObs.disconnect();
        }
      });
    },{threshold:.3});
    const statsBar = document.querySelector('.stats-bar');
    if (statsBar) statsObs.observe(statsBar);

    // Cat pills
    const pills = document.querySelectorAll('.cat-pill');
    pills.forEach(p => {
      p.addEventListener('click', () => {
        pills.forEach(x=>x.classList.remove('active'));
        p.classList.add('active');
      });
    });

    // Save hearts
    document.querySelectorAll('.card-save').forEach((btn) => {
      btn.addEventListener('click', ()=>{
        btn.textContent = btn.textContent==='♡' ? '♥' : '♡';
        (btn as HTMLElement).style.color = btn.textContent==='♥' ? '#FF1F8E' : '';
      });
    });

    // Stagger listings
    setTimeout(()=>{
      document.querySelectorAll('.listing-card, .featured-card').forEach((c,i)=>{
        setTimeout(()=>c.classList.add('visible'), i*80);
      });
    },200);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      obs.disconnect();
      statsObs.disconnect();
    }
  }, []);

  return (
    <>
      

{/**/}
<div id="cur"></div>
<div id="cur2"></div>

{/**/}
<div className="float-btn">+ List an Item</div>

{/**/}
<nav>
  <div className="logo">Rent<em>ify</em></div>
  <ul className="nav-links">
    <li><a href="#browse">Browse</a></li>
    <li><a href="#how">How It Works</a></li>
    <li><a href="#categories">Categories</a></li>
    <li><a href="#list">List Item</a></li>
  </ul>
  <div className="nav-right">
    <button className="btn-ghost">Log In</button>
    <button className="btn-cta">Sign Up Free</button>
  </div>
</nav>

{/**/}
<section className="hero" id="home">
  <div className="blob blob1"></div>
  <div className="blob blob2"></div>
  <div className="blob blob3"></div>

  <div className="hero-inner">
    <div className="hero-pill">
      <div className="pill-dot"></div>
      1,200+ items listed across India
    </div>

    <h1>
      <div className="line"><span>Rent <span className="txt-stroke">Anything.</span></span></div>
      <div className="line"><span>From <span className="txt-accent">Anyone.</span></span></div>
      <div className="line"><span>Near You.</span></div>
    </h1>

    <p className="hero-desc">Cameras, cars, dresses, tools, speakers — borrow what you need from people around you. List what you own and earn while you're not using it.</p>

    <div className="hero-actions">
      <button className="btn-big">Explore Rentals →</button>
      <button className="btn-big-sec">List Your Item</button>
    </div>
  </div>

  {/**/}
  <div className="hero-floaters">
    <div className="floater-pill" style={{ "--tx": "20px" } as React.CSSProperties}><span className="pill-emoji">📸</span> Sony A7IV Camera <span className="pill-price">₹800/day</span></div>
    <div className="floater-pill" style={{ "--tx": "-10px" } as React.CSSProperties}><span className="pill-emoji">🚗</span> Swift Dzire — Self Drive <span className="pill-price">₹1,200/day</span></div>
    <div className="floater-pill" style={{ "--tx": "30px" } as React.CSSProperties}><span className="pill-emoji">👗</span> Designer Lehenga <span className="pill-price">₹2,500/day</span></div>
    <div className="floater-pill" style={{ "--tx": "0px" } as React.CSSProperties}><span className="pill-emoji">🔊</span> JBL PartyBox 300 <span className="pill-price">₹600/day</span></div>
    <div className="floater-pill" style={{ "--tx": "15px" } as React.CSSProperties}><span className="pill-emoji">🏕️</span> Camping Tent (6-person) <span className="pill-price">₹400/day</span></div>
  </div>
</section>

{/**/}
<div className="marquee-wrap">
  <div className="marquee-inner" id="marq">
    <div className="marquee-item"><span>📸</span> Cameras & Lenses</div>
    <div className="marquee-item"><span>🚗</span> Cars & Bikes</div>
    <div className="marquee-item"><span>👗</span> Fashion & Jewellery</div>
    <div className="marquee-item"><span>🔧</span> Power Tools</div>
    <div className="marquee-item"><span>🎮</span> Gaming Consoles</div>
    <div className="marquee-item"><span>🏕️</span> Outdoor & Camping</div>
    <div className="marquee-item"><span>🎵</span> Musical Instruments</div>
    <div className="marquee-item"><span>🏠</span> Home Appliances</div>
    <div className="marquee-item"><span>💻</span> Laptops & Gadgets</div>
    <div className="marquee-item"><span>🎉</span> Event Equipment</div>
    {/**/}
    <div className="marquee-item"><span>📸</span> Cameras & Lenses</div>
    <div className="marquee-item"><span>🚗</span> Cars & Bikes</div>
    <div className="marquee-item"><span>👗</span> Fashion & Jewellery</div>
    <div className="marquee-item"><span>🔧</span> Power Tools</div>
    <div className="marquee-item"><span>🎮</span> Gaming Consoles</div>
    <div className="marquee-item"><span>🏕️</span> Outdoor & Camping</div>
    <div className="marquee-item"><span>🎵</span> Musical Instruments</div>
    <div className="marquee-item"><span>🏠</span> Home Appliances</div>
    <div className="marquee-item"><span>💻</span> Laptops & Gadgets</div>
    <div className="marquee-item"><span>🎉</span> Event Equipment</div>
  </div>
</div>

{/**/}
<section className="search-section" id="browse">
  <div className="search-box">
    <div className="search-field">
      <span className="search-icon">🔍</span>
      <input className="search-input" type="text" placeholder="What do you want to rent?" />
    </div>
    <div className="search-field">
      <span className="search-icon">📍</span>
      <input className="search-input" type="text" placeholder="Location" />
    </div>
    <div className="search-field" style={{"borderRight":"none","maxWidth":"160px"}}>
      <span className="search-icon">📅</span>
      <input className="search-input" type="text" placeholder="When?" />
    </div>
    <button className="search-btn">Search</button>
  </div>

  <div className="cats">
    <div className="cat-pill active">🌟 All</div>
    <div className="cat-pill">📸 Cameras</div>
    <div className="cat-pill">🚗 Vehicles</div>
    <div className="cat-pill">👗 Fashion</div>
    <div className="cat-pill">🔧 Tools</div>
    <div className="cat-pill">🎮 Gaming</div>
    <div className="cat-pill">🎵 Music</div>
    <div className="cat-pill">🏕️ Outdoors</div>
    <div className="cat-pill">💻 Electronics</div>
    <div className="cat-pill">🎉 Events</div>
  </div>
</section>

{/**/}
<section className="listings-section">
  <div className="section-header">
    <div>
      <div className="section-tag">Featured Listings</div>
      <div className="section-title reveal">Trending Near You</div>
    </div>
    <a href="#" className="see-all">See all listings →</a>
  </div>

  <div className="cards-grid" id="cardsGrid">

    {/**/}
    <div className="featured-card listing-card" style={{"transitionDelay":".0s"}}>
      <div className="featured-img">📸</div>
      <div className="featured-body">
        <div>
          <div className="featured-tag">✨ Featured Pick</div>
          <div className="featured-title">Sony Alpha A7 IV Full-Frame Camera Kit</div>
          <div className="featured-desc">Includes 24-70mm f/2.8 lens, 2 batteries, charger, SD card, and carry bag. Perfect for weddings, portraits & travel photography.</div>
          <div style={{"display":"flex","gap":"10px","flexWrap":"wrap","marginBottom":"16px"}}>
            <span style={{"background":"rgba(255,255,255,.07)","padding":"4px 12px","borderRadius":"100px","fontSize":".75rem","color":"rgba(247,244,238,.6)"}}>📍 Koramangala</span>
            <span style={{"background":"rgba(255,255,255,.07)","padding":"4px 12px","borderRadius":"100px","fontSize":".75rem","color":"rgba(247,244,238,.6)"}}>⭐ 4.9 (128 reviews)</span>
            <span style={{"background":"rgba(255,255,255,.07)","padding":"4px 12px","borderRadius":"100px","fontSize":".75rem","color":"rgba(247,244,238,.6)"}}>✅ ID Verified</span>
          </div>
        </div>
        <div style={{"display":"flex","alignItems":"center","justifyContent":"space-between"}}>
          <div>
            <div className="featured-price">₹800 <span>/day</span></div>
            <div style={{"fontSize":".78rem","color":"rgba(247,244,238,.4)","marginTop":"2px"}}>₹4,500/week · ₹14,000/month</div>
          </div>
          <button style={{"padding":"12px 28px","borderRadius":"12px","background":"var(--accent)","color":"#fff","fontFamily":"'Cabinet Grotesk',sans-serif","fontWeight":"700","border":"none","cursor":"none","fontSize":".95rem"}}>Rent Now</button>
        </div>
      </div>
    </div>

    {/**/}
    <div className="listing-card" style={{"transitionDelay":".05s"}}>
      <div className="card-img" style={{"background":"linear-gradient(135deg,#FFF8E7,#FFF3C4)"}}>
        <div className="card-img-inner">🚗</div>
        <div className="card-badge badge-hot">🔥 Hot</div>
        <div className="card-save">♡</div>
      </div>
      <div className="card-body">
        <div className="card-cat">🚗 Vehicles</div>
        <div className="card-title">Maruti Swift Dzire — Self Drive</div>
        <div className="card-location">📍 Indiranagar, Bangalore</div>
        <div className="card-footer">
          <div className="card-price">₹1,200 <span>/day</span></div>
          <div className="card-owner">
            <div className="owner-ava" style={{"background":"#FF6B2B"}}>R</div>
            <div className="owner-info">
              <div className="owner-name">Rohit M.</div>
              <div className="owner-rating">⭐ 4.8 · 64 trips</div>
            </div>
          </div>
        </div>
      </div>
      <div className="card-actions">
        <button className="card-btn-rent">Rent Now</button>
        <button className="card-btn-msg">💬</button>
      </div>
    </div>

    {/**/}
    <div className="listing-card" style={{"transitionDelay":".1s"}}>
      <div className="card-img" style={{"background":"linear-gradient(135deg,#F0E6FF,#E4D0FF)"}}>
        <div className="card-img-inner">👗</div>
        <div className="card-badge badge-new">✨ New</div>
        <div className="card-save">♡</div>
      </div>
      <div className="card-body">
        <div className="card-cat">👗 Fashion</div>
        <div className="card-title">Manish Malhotra Designer Lehenga</div>
        <div className="card-location">📍 HSR Layout, Bangalore</div>
        <div className="card-footer">
          <div className="card-price">₹2,500 <span>/day</span></div>
          <div className="card-owner">
            <div className="owner-ava" style={{"background":"#FF1F8E"}}>P</div>
            <div className="owner-info">
              <div className="owner-name">Priya S.</div>
              <div className="owner-rating">⭐ 4.9 · 32 rentals</div>
            </div>
          </div>
        </div>
      </div>
      <div className="card-actions">
        <button className="card-btn-rent">Rent Now</button>
        <button className="card-btn-msg">💬</button>
      </div>
    </div>

    {/**/}
    <div className="listing-card" style={{"transitionDelay":".15s"}}>
      <div className="card-img" style={{"background":"linear-gradient(135deg,#E6F7FF,#C9E9FF)"}}>
        <div className="card-img-inner">🔊</div>
        <div className="card-badge badge-top">🏆 Top Rated</div>
        <div className="card-save">♡</div>
      </div>
      <div className="card-body">
        <div className="card-cat">🎵 Music & Audio</div>
        <div className="card-title">JBL PartyBox 300 Speaker</div>
        <div className="card-location">📍 BTM Layout, Bangalore</div>
        <div className="card-footer">
          <div className="card-price">₹600 <span>/day</span></div>
          <div className="card-owner">
            <div className="owner-ava" style={{"background":"#1A1AFF"}}>A</div>
            <div className="owner-info">
              <div className="owner-name">Arjun K.</div>
              <div className="owner-rating">⭐ 5.0 · 89 rentals</div>
            </div>
          </div>
        </div>
      </div>
      <div className="card-actions">
        <button className="card-btn-rent">Rent Now</button>
        <button className="card-btn-msg">💬</button>
      </div>
    </div>

    {/**/}
    <div className="listing-card" style={{"transitionDelay":".2s"}}>
      <div className="card-img" style={{"background":"linear-gradient(135deg,#E6FFF2,#C3F5D8)"}}>
        <div className="card-img-inner">🏕️</div>
        <div className="card-badge badge-pop">💜 Popular</div>
        <div className="card-save">♡</div>
      </div>
      <div className="card-body">
        <div className="card-cat">🏕️ Outdoors</div>
        <div className="card-title">6-Person Camping Tent Kit</div>
        <div className="card-location">📍 Whitefield, Bangalore</div>
        <div className="card-footer">
          <div className="card-price">₹400 <span>/day</span></div>
          <div className="card-owner">
            <div className="owner-ava" style={{"background":"#00C464"}}>S</div>
            <div className="owner-info">
              <div className="owner-name">Sneha V.</div>
              <div className="owner-rating">⭐ 4.7 · 41 rentals</div>
            </div>
          </div>
        </div>
      </div>
      <div className="card-actions">
        <button className="card-btn-rent">Rent Now</button>
        <button className="card-btn-msg">💬</button>
      </div>
    </div>

    {/**/}
    <div className="listing-card" style={{"transitionDelay":".25s"}}>
      <div className="card-img" style={{"background":"linear-gradient(135deg,#FFF0E6,#FFD9BF)"}}>
        <div className="card-img-inner">🔧</div>
        <div className="card-badge badge-hot">🔥 Hot</div>
        <div className="card-save">♡</div>
      </div>
      <div className="card-body">
        <div className="card-cat">🔧 Power Tools</div>
        <div className="card-title">Bosch Drill + Full Tool Kit</div>
        <div className="card-location">📍 Marathahalli, Bangalore</div>
        <div className="card-footer">
          <div className="card-price">₹250 <span>/day</span></div>
          <div className="card-owner">
            <div className="owner-ava" style={{"background":"#FF4D1C"}}>V</div>
            <div className="owner-info">
              <div className="owner-name">Vijay R.</div>
              <div className="owner-rating">⭐ 4.6 · 77 rentals</div>
            </div>
          </div>
        </div>
      </div>
      <div className="card-actions">
        <button className="card-btn-rent">Rent Now</button>
        <button className="card-btn-msg">💬</button>
      </div>
    </div>

    {/**/}
    <div className="listing-card" style={{"transitionDelay":".3s"}}>
      <div className="card-img" style={{"background":"linear-gradient(135deg,#EEF0FF,#D8DCFF)"}}>
        <div className="card-img-inner">🎮</div>
        <div className="card-badge badge-new">✨ New</div>
        <div className="card-save">♡</div>
      </div>
      <div className="card-body">
        <div className="card-cat">🎮 Gaming</div>
        <div className="card-title">PS5 Console + 5 Games Bundle</div>
        <div className="card-location">📍 Jayanagar, Bangalore</div>
        <div className="card-footer">
          <div className="card-price">₹700 <span>/day</span></div>
          <div className="card-owner">
            <div className="owner-ava" style={{"background":"#7C3AED"}}>D</div>
            <div className="owner-info">
              <div className="owner-name">Dev T.</div>
              <div className="owner-rating">⭐ 4.9 · 23 rentals</div>
            </div>
          </div>
        </div>
      </div>
      <div className="card-actions">
        <button className="card-btn-rent">Rent Now</button>
        <button className="card-btn-msg">💬</button>
      </div>
    </div>

    {/**/}
    <div className="listing-card" style={{"transitionDelay":".35s"}}>
      <div className="card-img" style={{"background":"linear-gradient(135deg,#FFF8E7,#FFECB3)"}}>
        <div className="card-img-inner">🎸</div>
        <div className="card-badge badge-top">🏆 Top Rated</div>
        <div className="card-save">♡</div>
      </div>
      <div className="card-body">
        <div className="card-cat">🎵 Musical</div>
        <div className="card-title">Gibson Les Paul Electric Guitar</div>
        <div className="card-location">📍 MG Road, Bangalore</div>
        <div className="card-footer">
          <div className="card-price">₹500 <span>/day</span></div>
          <div className="card-owner">
            <div className="owner-ava" style={{"background":"#059669"}}>M</div>
            <div className="owner-info">
              <div className="owner-name">Meera G.</div>
              <div className="owner-rating">⭐ 5.0 · 18 rentals</div>
            </div>
          </div>
        </div>
      </div>
      <div className="card-actions">
        <button className="card-btn-rent">Rent Now</button>
        <button className="card-btn-msg">💬</button>
      </div>
    </div>

    {/**/}
    <div className="listing-card" style={{"transitionDelay":".4s"}}>
      <div className="card-img" style={{"background":"linear-gradient(135deg,#FFEFF2,#FFD6DC)"}}>
        <div className="card-img-inner">💍</div>
        <div className="card-badge badge-pop">💜 Popular</div>
        <div className="card-save">♡</div>
      </div>
      <div className="card-body">
        <div className="card-cat">💍 Jewellery</div>
        <div className="card-title">22K Gold Bridal Necklace Set</div>
        <div className="card-location">📍 Rajajinagar, Bangalore</div>
        <div className="card-footer">
          <div className="card-price">₹1,800 <span>/day</span></div>
          <div className="card-owner">
            <div className="owner-ava" style={{"background":"#DB2777"}}>L</div>
            <div className="owner-info">
              <div className="owner-name">Lakshmi N.</div>
              <div className="owner-rating">⭐ 4.8 · 55 rentals</div>
            </div>
          </div>
        </div>
      </div>
      <div className="card-actions">
        <button className="card-btn-rent">Rent Now</button>
        <button className="card-btn-msg">💬</button>
      </div>
    </div>

    {/**/}
    <div className="listing-card" style={{"transitionDelay":".45s"}}>
      <div className="card-img" style={{"background":"linear-gradient(135deg,#E6F7FF,#BAE7FF)"}}>
        <div className="card-img-inner">💻</div>
        <div className="card-badge badge-hot">🔥 Hot</div>
        <div className="card-save">♡</div>
      </div>
      <div className="card-body">
        <div className="card-cat">💻 Electronics</div>
        <div className="card-title">MacBook Pro M3 16" + Accessories</div>
        <div className="card-location">📍 Electronic City</div>
        <div className="card-footer">
          <div className="card-price">₹1,500 <span>/day</span></div>
          <div className="card-owner">
            <div className="owner-ava" style={{"background":"#0284C7"}}>K</div>
            <div className="owner-info">
              <div className="owner-name">Kiran B.</div>
              <div className="owner-rating">⭐ 4.7 · 38 rentals</div>
            </div>
          </div>
        </div>
      </div>
      <div className="card-actions">
        <button className="card-btn-rent">Rent Now</button>
        <button className="card-btn-msg">💬</button>
      </div>
    </div>

  </div>{/**/}

  {/**/}
  <div style={{"textAlign":"center","marginTop":"48px"}}>
    <button style={{"padding":"16px 48px","borderRadius":"100px","border":"2px solid var(--border)","background":"transparent","fontFamily":"'Cabinet Grotesk',sans-serif","fontWeight":"700","fontSize":"1rem","cursor":"none","transition":"all .2s"}}  >Load More Listings</button>
  </div>
</section>

{/**/}
<section className="how-section" id="how">
  <div className="section-tag" style={{"color":"rgba(247,244,238,.5)"}}>
    <div style={{"width":"20px","height":"2px","background":"var(--accent)","display":"block"}}></div>
    How It Works
  </div>
  <div className="section-title reveal" style={{"color":"var(--bg)","marginTop":"10px","marginBottom":"0"}}>Simple for renters.<br/>Effortless for listers.</div>

  <div className="how-grid">
    {/**/}
    <div className="how-step">
      <div className="how-num">01</div>
      <div className="how-icon">🔍</div>
      <div className="how-title">Search & Discover</div>
      <div className="how-desc">Browse thousands of items nearby. Filter by category, price, distance, and availability dates. Every listing has photos, verified reviews, and clear pricing.</div>
    </div>
    <div className="how-step" style={{"transitionDelay":".1s"}}>
      <div className="how-num">02</div>
      <div className="how-icon">📆</div>
      <div className="how-title">Book Instantly</div>
      <div className="how-desc">Pick your dates, request a booking, and pay securely through the app. UPI, card, wallets — all accepted. Your payment is held safely until item handover.</div>
    </div>
    <div className="how-step" style={{"transitionDelay":".2s"}}>
      <div className="how-num">03</div>
      <div className="how-icon">🤝</div>
      <div className="how-title">Pickup & Return</div>
      <div className="how-desc">Meet the owner for pickup or get it delivered. Use it, enjoy it. Return on time. Rate the experience. Our damage protection covers both parties throughout.</div>
    </div>
    {/**/}
    <div className="how-step" style={{"transitionDelay":".3s","borderTop":"1px solid rgba(247,244,238,.12)"}}>
      <div className="how-num">01</div>
      <div className="how-icon">📷</div>
      <div className="how-title">List Your Item</div>
      <div className="how-desc">Upload photos, write a description, set your daily/weekly price, and add your location. Listing is completely free and takes under 3 minutes.</div>
    </div>
    <div className="how-step" style={{"transitionDelay":".4s","borderTop":"1px solid rgba(247,244,238,.12)"}}>
      <div className="how-num">02</div>
      <div className="how-icon">📲</div>
      <div className="how-title">Accept Requests</div>
      <div className="how-desc">Get notified instantly when someone wants to rent your item. Review the renter's profile, ID verification, and approve or decline in one tap.</div>
    </div>
    <div className="how-step" style={{"transitionDelay":".5s","borderTop":"1px solid rgba(247,244,238,.12)"}}>
      <div className="how-num">03</div>
      <div className="how-icon">💸</div>
      <div className="how-title">Get Paid</div>
      <div className="how-desc">Earnings hit your account within 24 hours of successful handover. Rentify takes just 12% commission — no hidden charges, no delays, ever.</div>
    </div>
  </div>
</section>

{/**/}
<div className="stats-bar">
  <div className="stat-i"><div className="stat-n" id="sn1">0</div><div className="stat-l">Items listed across India</div></div>
  <div className="stat-i"><div className="stat-n" id="sn2">0</div><div className="stat-l">Happy renters & counting</div></div>
  <div className="stat-i"><div className="stat-n" id="sn3">0</div><div className="stat-l">Cities active</div></div>
  <div className="stat-i"><div className="stat-n" id="sn4">0</div><div className="stat-l">Avg. owner monthly earnings</div></div>
</div>

{/**/}
<section className="cats-section" id="categories">
  <div className="section-tag">Explore</div>
  <div className="section-title reveal" style={{"marginBottom":"0"}}>Browse by Category</div>

  <div className="cats-grid">
    <div className="cat-card" style={{"transitionDelay":".0s"}}><div className="cat-emoji">📸</div><div className="cat-name">Cameras</div><div className="cat-count">124 items</div></div>
    <div className="cat-card" style={{"transitionDelay":".06s"}}><div className="cat-emoji">🚗</div><div className="cat-name">Vehicles</div><div className="cat-count">89 items</div></div>
    <div className="cat-card" style={{"transitionDelay":".12s"}}><div className="cat-emoji">👗</div><div className="cat-name">Fashion</div><div className="cat-count">211 items</div></div>
    <div className="cat-card" style={{"transitionDelay":".18s"}}><div className="cat-emoji">🔧</div><div className="cat-name">Tools</div><div className="cat-count">167 items</div></div>
    <div className="cat-card" style={{"transitionDelay":".24s"}}><div className="cat-emoji">🎮</div><div className="cat-name">Gaming</div><div className="cat-count">73 items</div></div>
    <div className="cat-card" style={{"transitionDelay":".30s"}}><div className="cat-emoji">🏕️</div><div className="cat-name">Outdoors</div><div className="cat-count">95 items</div></div>
    <div className="cat-card" style={{"transitionDelay":".36s"}}><div className="cat-emoji">🎵</div><div className="cat-name">Music</div><div className="cat-count">58 items</div></div>
    <div className="cat-card" style={{"transitionDelay":".42s"}}><div className="cat-emoji">💻</div><div className="cat-name">Electronics</div><div className="cat-count">142 items</div></div>
    <div className="cat-card" style={{"transitionDelay":".48s"}}><div className="cat-emoji">🎉</div><div className="cat-name">Events</div><div className="cat-count">86 items</div></div>
    <div className="cat-card" style={{"transitionDelay":".54s"}}><div className="cat-emoji">💍</div><div className="cat-name">Jewellery</div><div className="cat-count">64 items</div></div>
    <div className="cat-card" style={{"transitionDelay":".60s"}}><div className="cat-emoji">🏠</div><div className="cat-name">Appliances</div><div className="cat-count">103 items</div></div>
    <div className="cat-card" style={{"transitionDelay":".66s"}}><div className="cat-emoji">📚</div><div className="cat-name">Books</div><div className="cat-count">77 items</div></div>
  </div>
</section>

{/**/}
<section className="lister-section" id="list">
  <div className="lister-card">
    <div>
      <div className="section-tag">For Owners</div>
      <h2>Turn idle items into <em>income</em></h2>
      <p>That camera sitting in your drawer, the car you use thrice a month, the lehenga worn once — list them on Rentify and earn every time someone needs them.</p>
      <button className="btn-big" style={{"fontSize":".95rem","padding":"16px 36px"}}>Start Listing Free →</button>
    </div>

    <div className="lister-steps">
      <div className="lister-step">
        <div className="ls-num">1</div>
        <div className="ls-text">
          <h4>Create Your Free Listing</h4>
          <p>Add photos, description, pricing and availability. No cost to list — ever. Goes live within 2 hours.</p>
        </div>
      </div>
      <div className="lister-step">
        <div className="ls-num">2</div>
        <div className="ls-text">
          <h4>Set Your Rules</h4>
          <p>Choose delivery or pickup, set minimum rental days, security deposit, and who can rent from you.</p>
        </div>
      </div>
      <div className="lister-step">
        <div className="ls-num">3</div>
        <div className="ls-text">
          <h4>Accept & Handover</h4>
          <p>Get booking request, review renter's verified profile, accept, and hand over the item. That's it.</p>
        </div>
      </div>
      <div className="lister-step">
        <div className="ls-num">4</div>
        <div className="ls-text">
          <h4>Earn in 24 Hours</h4>
          <p>Money lands in your bank within 24 hours of return. Rentify's ₹50K damage cover protects your items.</p>
        </div>
      </div>
    </div>
  </div>
</section>

{/**/}
<section className="reviews-section">
  <div className="section-tag">Testimonials</div>
  <div className="section-title reveal" style={{"marginBottom":"0"}}>People love Rentify.</div>

  <div className="reviews-row">
    <div className="reviews-col" style={{"flex":"1"}}>
      <div className="review-card">
        <div className="review-stars">★★★★★</div>
        <div className="review-text">"Rented a Sony camera for my sister's wedding. The owner was super helpful and the gear was in perfect condition. Saved me ₹80,000 instead of buying one!"</div>
        <div className="review-user">
          <div className="review-ava" style={{"background":"#FF4D1C"}}>A</div>
          <div><div className="review-name">Ananya Krishnan</div><div className="review-loc">📍 Koramangala · Camera Renter</div></div>
        </div>
      </div>
      <div className="review-card" style={{"transitionDelay":".15s"}}>
        <div className="review-stars">★★★★★</div>
        <div className="review-text">"Listed my car on Rentify 3 months ago. I'm making ₹18,000 extra per month just from weekend rentals. The verification process made me feel completely safe."</div>
        <div className="review-user">
          <div className="review-ava" style={{"background":"#7C3AED"}}>V</div>
          <div><div className="review-name">Vikram Patel</div><div className="review-loc">📍 Indiranagar · Car Owner</div></div>
        </div>
      </div>
    </div>
    <div className="reviews-col" style={{"flex":"1"}}>
      <div className="review-card" style={{"transitionDelay":".1s"}}>
        <div className="review-stars">★★★★★</div>
        <div className="review-text">"Booked a lehenga for my cousin's sangeet. Perfect fit, beautiful condition. Pickup was easy and the owner was so sweet. Will use Rentify again for every event!"</div>
        <div className="review-user">
          <div className="review-ava" style={{"background":"#FF1F8E"}}>S</div>
          <div><div className="review-name">Shreya Nambiar</div><div className="review-loc">📍 HSR Layout · Fashion Renter</div></div>
        </div>
      </div>
      <div className="review-card" style={{"transitionDelay":".25s"}}>
        <div className="review-stars">★★★★☆</div>
        <div className="review-text">"I never thought anyone would rent my old camping gear. Listed it thinking nothing would happen. Got 12 bookings in the first month alone. Brilliant platform."</div>
        <div className="review-user">
          <div className="review-ava" style={{"background":"#059669"}}>R</div>
          <div><div className="review-name">Ranjit Nair</div><div className="review-loc">📍 Whitefield · Outdoors Owner</div></div>
        </div>
      </div>
    </div>
    <div className="reviews-col" style={{"flex":"1"}}>
      <div className="review-card" style={{"transitionDelay":".2s"}}>
        <div className="review-stars">★★★★★</div>
        <div className="review-text">"The damage protection gives me so much peace of mind. I have ₹2 lakh worth of equipment listed. Rentify's coverage means I don't worry at all. Highly recommend."</div>
        <div className="review-user">
          <div className="review-ava" style={{"background":"#0284C7"}}>M</div>
          <div><div className="review-name">Mohammed Farouk</div><div className="review-loc">📍 MG Road · Gadget Owner</div></div>
        </div>
      </div>
      <div className="review-card" style={{"transitionDelay":".35s"}}>
        <div className="review-stars">★★★★★</div>
        <div className="review-text">"Used Rentify to get a PS5 for a 3-day trip. The owner was responsive and the whole booking took 2 minutes. So much better than buying something I'd use once."</div>
        <div className="review-user">
          <div className="review-ava" style={{"background":"#D97706"}}>D</div>
          <div><div className="review-name">Divesh Kumar</div><div className="review-loc">📍 Jayanagar · Gaming Renter</div></div>
        </div>
      </div>
    </div>
  </div>
</section>

{/**/}
<footer>
  <div className="foot-grid">
    <div className="foot-brand">
      <div className="logo" style={{"color":"var(--bg)"}}>Rent<em>ify</em></div>
      <p>India's peer-to-peer rental marketplace. Rent anything from anyone around you — or earn from what you own.</p>
      <div style={{"display":"flex","gap":"10px","marginTop":"20px"}}>
        <div style={{"width":"36px","height":"36px","borderRadius":"8px","background":"rgba(247,244,238,.08)","display":"flex","alignItems":"center","justifyContent":"center","fontSize":".95rem","cursor":"none"}}>𝕏</div>
        <div style={{"width":"36px","height":"36px","borderRadius":"8px","background":"rgba(247,244,238,.08)","display":"flex","alignItems":"center","justifyContent":"center","fontSize":".95rem","cursor":"none"}}>in</div>
        <div style={{"width":"36px","height":"36px","borderRadius":"8px","background":"rgba(247,244,238,.08)","display":"flex","alignItems":"center","justifyContent":"center","fontSize":".95rem","cursor":"none"}}>📸</div>
      </div>
    </div>
    <div className="foot-col">
      <h4>For Renters</h4>
      <ul>
        <li><a href="#">Browse All Items</a></li>
        <li><a href="#">How to Rent</a></li>
        <li><a href="#">Pricing Guide</a></li>
        <li><a href="#">Safety & Trust</a></li>
        <li><a href="#">Download App</a></li>
      </ul>
    </div>
    <div className="foot-col">
      <h4>For Owners</h4>
      <ul>
        <li><a href="#">List Your Item</a></li>
        <li><a href="#">Earn Estimate</a></li>
        <li><a href="#">Damage Protection</a></li>
        <li><a href="#">Owner Dashboard</a></li>
        <li><a href="#">Payout Policy</a></li>
      </ul>
    </div>
    <div className="foot-col">
      <h4>Company</h4>
      <ul>
        <li><a href="#">About Rentify</a></li>
        <li><a href="#">Blog</a></li>
        <li><a href="#">Careers</a></li>
        <li><a href="#">Press</a></li>
        <li><a href="#">Contact</a></li>
      </ul>
    </div>
  </div>
  <div className="foot-bottom">
    <div>© 2025 Rentify Technologies · Made in India 🇮🇳</div>
    <div style={{"display":"flex","gap":"24px"}}>
      <a href="#" style={{"color":"rgba(247,244,238,.35)","textDecoration":"none","fontSize":".8rem"}}>Privacy</a>
      <a href="#" style={{"color":"rgba(247,244,238,.35)","textDecoration":"none","fontSize":".8rem"}}>Terms</a>
      <a href="#" style={{"color":"rgba(247,244,238,.35)","textDecoration":"none","fontSize":".8rem"}}>Refunds</a>
      <a href="#" style={{"color":"rgba(247,244,238,.35)","textDecoration":"none","fontSize":".8rem"}}>Help</a>
    </div>
  </div>
</footer>



    </>
  );
}
