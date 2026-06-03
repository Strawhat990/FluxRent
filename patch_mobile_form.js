const fs = require('fs');
let src = fs.readFileSync('src/components/RentifyApp.tsx', 'utf8');
src = src.replace(/\r\n/g, '\n');

// 1. Add import for new ListingFormModal at the top (after existing imports)
src = src.replace(
  `} from "@/lib/supabase";`,
  `} from "@/lib/supabase";
import ListingFormModal from "./ListingFormModal";`
);

// 2. Remove the old inline ListingFormModal function (lines 1487–1576 approx)
// Find and remove it
src = src.replace(
  /\nfunction ListingFormModal\(\{[\s\S]*?\}\n\}\n\nfunction BookingModal/,
  '\n\nfunction BookingModal'
);

// 3. Update the JSX usage of ListingFormModal to remove currentUser prop (it gets it internally now)
// The old usage: <ListingFormModal key="listing-form-modal" currentUser={currentUser} onClose={...} onCreate={addListing} />
// The new component accepts currentUser, onClose, onCreate
// (no change needed — same props)

// 4. Remove unused Menu icon import if present, add Menu icon import
if (!src.includes('Menu,')) {
  src = src.replace(
    'import {\n  Bell,',
    'import {\n  Bell,\n  Menu,'
  );
}

// 5. Add mobile menu state to RentifyApp
src = src.replace(
  `  const [toast, setToast] = useState<string | null>(null);`,
  `  const [toast, setToast] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);`
);

// 6. Pass mobileMenuOpen to Header
src = src.replace(
  `        isLoggedIn={isLoggedIn}
        onAuth={setAuthMode}
        onSignOut={async () => { await signOut(); notify("Signed out."); }}
        onList={() => setShowListingForm(true)}
        onDashboard={() => setDashboardTab("overview")}
        onAdmin={() => setDashboardTab("admin")}`,
  `        isLoggedIn={isLoggedIn}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        onAuth={setAuthMode}
        onSignOut={async () => { await signOut(); notify("Signed out."); setMobileMenuOpen(false); }}
        onList={() => { setShowListingForm(true); setMobileMenuOpen(false); }}
        onDashboard={() => { setDashboardTab("overview"); setMobileMenuOpen(false); }}
        onAdmin={() => { setDashboardTab("admin"); setMobileMenuOpen(false); }}`
);

// 7. Update Header props type and implementation
src = src.replace(
  `function Header({
  currentUser,
  unreadCount,
  theme,
  isLoggedIn,
  onTheme,
  onAuth,
  onSignOut,
  onList,
  onDashboard,
  onAdmin,
}: {
  currentUser: UserProfile;
  unreadCount: number;
  theme: "light" | "dark";
  isLoggedIn: boolean;
  onTheme: () => void;
  onAuth: (mode: AuthMode) => void;
  onSignOut: () => void;
  onList: () => void;
  onDashboard: () => void;
  onAdmin: () => void;
}) {`,
  `function Header({
  currentUser,
  unreadCount,
  theme,
  isLoggedIn,
  mobileMenuOpen,
  onMobileMenu,
  onTheme,
  onAuth,
  onSignOut,
  onList,
  onDashboard,
  onAdmin,
}: {
  currentUser: UserProfile;
  unreadCount: number;
  theme: "light" | "dark";
  isLoggedIn: boolean;
  mobileMenuOpen: boolean;
  onMobileMenu: () => void;
  onTheme: () => void;
  onAuth: (mode: AuthMode) => void;
  onSignOut: () => void;
  onList: () => void;
  onDashboard: () => void;
  onAdmin: () => void;
}) {`
);

// 8. Add hamburger button and mobile drawer to Header JSX
src = src.replace(
  `          <button className="icon-btn relative" onClick={onDashboard} aria-label="Notifications">
            <Bell size={18} />
            {unreadCount > 0 && <span className="badge-dot">{unreadCount}</span>}
          </button>
          <button className="icon-btn" onClick={onTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {isLoggedIn ? (
            <button className="btn-secondary hidden md:inline-flex" onClick={onSignOut}>
              Sign out
            </button>
          ) : (
            <button className="btn-secondary hidden md:inline-flex" onClick={() => onAuth("login")}>
              <LogIn size={16} />
              Login
            </button>
          )}
          <button className="btn-primary hidden md:inline-flex" onClick={isLoggedIn ? onList : () => onAuth("login")}>
            <Plus size={16} />
            List item
          </button>
          <button className="avatar-chip" onClick={onDashboard}>
            <span>{currentUser.avatar}</span>
            <span className="hidden sm:block">{currentUser.name.split(" ")[0]}</span>
          </button>`,
  `          <button className="icon-btn relative" onClick={onDashboard} aria-label="Notifications">
            <Bell size={18} />
            {unreadCount > 0 && <span className="badge-dot">{unreadCount}</span>}
          </button>
          <button className="icon-btn" onClick={onTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {isLoggedIn ? (
            <button className="btn-secondary hidden md:inline-flex" onClick={onSignOut}>
              Sign out
            </button>
          ) : (
            <button className="btn-secondary hidden md:inline-flex" onClick={() => onAuth("login")}>
              <LogIn size={16} />
              Login
            </button>
          )}
          <button className="btn-primary hidden md:inline-flex" onClick={isLoggedIn ? onList : () => onAuth("login")}>
            <Plus size={16} />
            List item
          </button>
          <button className="avatar-chip hidden md:flex" onClick={onDashboard}>
            <span>{currentUser.avatar}</span>
            <span className="hidden sm:block">{currentUser.name.split(" ")[0]}</span>
          </button>
          <button className="icon-btn md:hidden" onClick={onMobileMenu} aria-label="Open menu">
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>`
);

// 9. Add mobile drawer after </header>
src = src.replace(
  `    </header>
  );
}

function Hero`,
  `    </header>
    {/* Mobile slide-out menu */}
    {mobileMenuOpen && (
      <div className="fixed inset-0 z-40 md:hidden">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onMobileMenu} />
        <nav className="absolute right-0 top-0 h-full w-72 bg-[var(--bg)] shadow-2xl flex flex-col p-6 gap-4 pt-20">
          <a href="#browse" className="text-lg font-bold py-2 border-b border-[var(--border)]" onClick={onMobileMenu}>Browse</a>
          <a href="#trending" className="text-lg font-bold py-2 border-b border-[var(--border)]" onClick={onMobileMenu}>Trending</a>
          <a href="#categories" className="text-lg font-bold py-2 border-b border-[var(--border)]" onClick={onMobileMenu}>Categories</a>
          <button className="text-lg font-bold py-2 border-b border-[var(--border)] text-left" onClick={onDashboard}>Dashboard</button>
          {currentUser.role === "admin" && <button className="text-lg font-bold py-2 border-b border-[var(--border)] text-left" onClick={onAdmin}>Admin</button>}
          <div className="mt-auto flex flex-col gap-3">
            {isLoggedIn ? (
              <button className="btn-secondary h-12 w-full justify-center" onClick={onSignOut}>Sign out</button>
            ) : (
              <button className="btn-secondary h-12 w-full justify-center" onClick={() => { onAuth("login"); onMobileMenu(); }}>
                <LogIn size={16} />Login
              </button>
            )}
            <button className="btn-primary h-12 w-full justify-center" onClick={isLoggedIn ? onList : () => { onAuth("login"); onMobileMenu(); }}>
              <Plus size={16} />List item
            </button>
          </div>
        </nav>
      </div>
    )}
  );
}

function Hero`
);

fs.writeFileSync('src/components/RentifyApp.tsx', src.replace(/\n/g, '\r\n'), 'utf8');
console.log('RentifyApp patched. Size:', src.length);
