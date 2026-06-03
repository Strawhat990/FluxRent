const fs = require('fs');
let src = fs.readFileSync('src/components/RentifyApp.tsx', 'utf8');
src = src.replace(/\r\n/g, '\n');

// 1. Update Header props definition to add isLoggedIn and onSignOut
src = src.replace(
  `function Header({
  currentUser,
  unreadCount,
  theme,
  onTheme,
  onAuth,
  onList,
  onDashboard,
  onAdmin,
}: {
  currentUser: UserProfile;
  unreadCount: number;
  theme: "light" | "dark";
  onTheme: () => void;
  onAuth: (mode: AuthMode) => void;
  onList: () => void;
  onDashboard: () => void;
  onAdmin: () => void;
}) {`,
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
}) {`
);

// 2. Replace login/list item buttons in Header with conditional sign-out
src = src.replace(
  `          <button className="btn-secondary hidden md:inline-flex" onClick={() => onAuth("login")}>
            <LogIn size={16} />
            Login
          </button>
          <button className="btn-primary hidden md:inline-flex" onClick={onList}>
            <Plus size={16} />
            List item
          </button>`,
  `          {isLoggedIn ? (
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
          </button>`
);

// 3. Fix AuthModal to clear demo defaults and not force demo user after login
src = src.replace(
  `      } else {
        await signInWithEmail(email, password);
        const demo = demoUsers.find((user) => user.email === email) ?? demoUsers[0];
        setCurrentUser(demo);
        notify(isSupabaseConfigured() ? "Logged in." : "Demo login complete.");
      }`,
  `      } else {
        await signInWithEmail(email, password);
        // Profile will be set by the auth state listener in RentifyApp
        notify(isSupabaseConfigured() ? "Logged in successfully!" : "Demo login complete.");
      }`
);

// 4. Fix signup to not create a fake user (listener will handle it)
src = src.replace(
  `        await signUpWithEmail(email, password, name);
        setCurrentUser({
          id: uid("user"),
          name,
          email,
          city: "Bangalore",
          bio: "New Rentify member.",
          avatar: name.slice(0, 2).toUpperCase(),
          rating: 5,
          reviewCount: 0,
          verified: false,
          role: "renter",
          listedItems: 0,
          rentalHistory: 0,
        });
        notify(isSupabaseConfigured() ? "Account created." : "Demo account created locally.");`,
  `        await signUpWithEmail(email, password, name);
        notify(isSupabaseConfigured() ? "Account created! Check your email to confirm." : "Demo account created locally.");`
);

// 5. Remove default values from email/password in AuthModal (no demo pre-fill)
src = src.replace(
  `        <label className="label">Email<input className="input" name="email" type="email" defaultValue="rhea@rentify.test" required /></label>
        {mode !== "forgot" && <label className="label">Password<input className="input" name="password" type="password" defaultValue="rentify123" required /></label>}`,
  `        <label className="label">Email<input className="input" name="email" type="email" placeholder="you@example.com" required /></label>
        {mode !== "forgot" && <label className="label">Password<input className="input" name="password" type="password" placeholder="Min 6 characters" required /></label>}`
);

// 6. Update the auth label to just say "Supabase auth"
src = src.replace(
  `          <div className="section-eyebrow">{isSupabaseConfigured() ? "Supabase auth" : "Demo auth"}</div>`,
  `          <div className="section-eyebrow">{isSupabaseConfigured() ? "Secure auth" : "Demo auth"}</div>`
);

// 7. Update auth description
src = src.replace(
  `          <p className="mt-2 text-sm text-[var(--muted)]">
            Email and Google auth are wired for Supabase. Add env keys to make this production backed.
          </p>`,
  `          <p className="mt-2 text-sm text-[var(--muted)]">
            Sign in to list items, contact owners, and track your rentals.
          </p>`
);

fs.writeFileSync('src/components/RentifyApp.tsx', src.replace(/\n/g, '\r\n'), 'utf8');
console.log('Header+AuthModal patched. Size:', src.length);
