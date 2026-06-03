const fs = require('fs');
let src = fs.readFileSync('src/components/RentifyApp.tsx', 'utf8');

// Normalize to LF for easier manipulation
src = src.replace(/\r\n/g, '\n');

// 1. Replace supabase imports
src = src.replace(
  `import {\n  isSupabaseConfigured,\n  resetPassword,\n  signInWithEmail,\n  signInWithGoogle,\n  signUpWithEmail,\n} from "@/lib/supabase";`,
  `import {\n  addFavorite,\n  createBooking,\n  createListing,\n  createNotification,\n  createReview,\n  createThread,\n  deleteListing as sbDeleteListing,\n  fetchFavorites,\n  fetchListings,\n  fetchMyBookings,\n  fetchMyThreads,\n  fetchNotifications,\n  fetchProfile,\n  getSupabaseBrowserClient,\n  isSupabaseConfigured,\n  removeFavorite,\n  resetPassword,\n  sendMessage as sbSendMessage,\n  signInWithEmail,\n  signInWithGoogle,\n  signOut,\n  signUpWithEmail,\n  updateBookingStatus as sbUpdateBookingStatus,\n  updateProfile,\n} from "@/lib/supabase";`
);

// 2. Remove unused demo imports
src = src.replace('  demoBookings,\n', '');
src = src.replace('  demoNotifications,\n', '');
src = src.replace('  demoThreads,\n', '');

// 3. Replace persisted state with useState + Supabase state
src = src.replace(
  `  const [listings, setListings] = usePersistedState<Listing[]>("rentify-listings", demoListings);\n  const [bookings, setBookings] = usePersistedState<Booking[]>("rentify-bookings", demoBookings);\n  const [threads, setThreads] = usePersistedState<Thread[]>("rentify-threads", demoThreads);\n  const [reviews, setReviews] = usePersistedState<Review[]>("rentify-reviews", demoReviews);\n  const [notifications, setNotifications] = usePersistedState<Notification[]>("rentify-notifications", demoNotifications);\n  const [users, setUsers] = usePersistedState<UserProfile[]>("rentify-users", demoUsers);\n  const [currentUser, setCurrentUser] = usePersistedState<UserProfile>("rentify-current-user", demoUsers[0]);\n  const [favorites, setFavorites] = usePersistedState<string[]>("rentify-favorites", ["lst-camera-a7", "lst-lehenga"]);`,
  `  const [listings, setListings] = useState<Listing[]>(demoListings);\n  const [bookings, setBookings] = useState<Booking[]>([]);\n  const [threads, setThreads] = useState<Thread[]>([]);\n  const [reviews, setReviews] = useState<Review[]>(demoReviews);\n  const [notifications, setNotifications] = useState<Notification[]>([]);\n  const [users, setUsers] = useState<UserProfile[]>(demoUsers);\n  const [currentUser, setCurrentUser] = useState<UserProfile>(demoUsers[0]);\n  const [isLoggedIn, setIsLoggedIn] = useState(false);\n  const [favorites, setFavorites] = useState<string[]>([]);`
);

// 4. Inject Supabase hooks after the theme useEffect
const THEME_END = '  }, [theme]);\n\n  function notify';
const SUPABASE_HOOKS = `  }, [theme]);\n\n  // Fetch public listings on mount\n  useEffect(() => {\n    if (!isSupabaseConfigured()) return;\n    fetchListings().then((data) => { if (data.length > 0) setListings(data); });\n  }, []);\n\n  // Auth state listener – load personal data on sign in\n  useEffect(() => {\n    if (!isSupabaseConfigured()) return;\n    const sb = getSupabaseBrowserClient();\n    if (!sb) return;\n    const { data: { subscription } } = sb.auth.onAuthStateChange(async (event, session) => {\n      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {\n        const userId = session.user.id;\n        const profile = await fetchProfile(userId);\n        if (profile) { setCurrentUser(profile); setIsLoggedIn(true); }\n        const [favs, myBookings, myThreads, myNotifs] = await Promise.all([\n          fetchFavorites(userId),\n          fetchMyBookings(userId),\n          fetchMyThreads(userId),\n          fetchNotifications(userId),\n        ]);\n        setFavorites(favs);\n        setBookings(myBookings);\n        setThreads(myThreads);\n        setNotifications(myNotifs);\n      } else if (event === 'SIGNED_OUT') {\n        setCurrentUser(demoUsers[0]);\n        setIsLoggedIn(false);\n        setFavorites([]);\n        setBookings([]);\n        setThreads([]);\n        setNotifications([]);\n      }\n    });\n    return () => subscription.unsubscribe();\n  }, []);\n\n  function notify`;

src = src.replace(THEME_END, SUPABASE_HOOKS);

// Write back with CRLF
fs.writeFileSync('src/components/RentifyApp.tsx', src.replace(/\n/g, '\r\n'), 'utf8');
console.log('Patched successfully. Size:', src.length);
