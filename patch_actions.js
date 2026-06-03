const fs = require('fs');
let src = fs.readFileSync('src/components/RentifyApp.tsx', 'utf8');
src = src.replace(/\r\n/g, '\n');

// 1. toggleFavorite – persist to Supabase
src = src.replace(
  `  function toggleFavorite(listing: Listing) {
    setFavorites((current) =>
      current.includes(listing.id) ? current.filter((id) => id !== listing.id) : [...current, listing.id],
    );
    setNotifications((current) => [
      {
        id: uid("not"),
        title: favorites.includes(listing.id) ? "Removed from saved" : "Saved item",
        body: \`\${listing.title} \${favorites.includes(listing.id) ? "was removed" : "was saved"} in your favorites.\`,
        type: "favorite",
        read: false,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
  }`,
  `  function toggleFavorite(listing: Listing) {
    const isFav = favorites.includes(listing.id);
    setFavorites((cur) => isFav ? cur.filter((id) => id !== listing.id) : [...cur, listing.id]);
    if (isLoggedIn) {
      if (isFav) removeFavorite(currentUser.id, listing.id);
      else addFavorite(currentUser.id, listing.id);
    }
  }`
);

// 2. addListing – persist to Supabase + upload photos
src = src.replace(
  `  function addListing(listing: Listing) {
    setListings((current) => [listing, ...current]);
    setUsers((current) =>
      current.map((user) =>
        user.id === currentUser.id ? { ...user, role: "owner", listedItems: user.listedItems + 1 } : user,
      ),
    );
    setCurrentUser({ ...currentUser, role: "owner", listedItems: currentUser.listedItems + 1 });
    setShowListingForm(false);
    setDashboardTab("listings");
    notify("Listing published. It is live in the marketplace.");
  }`,
  `  async function addListing(listing: Listing, imageFiles?: File[]) {
    // Optimistic update
    setListings((cur) => [listing, ...cur]);
    const updated = { ...currentUser, role: "owner" as const, listedItems: currentUser.listedItems + 1 };
    setCurrentUser(updated);
    setShowListingForm(false);
    setDashboardTab("listings");
    notify("Listing published. It is live in the marketplace.");
    if (isLoggedIn) {
      const saved = await createListing({ ...listing, ownerId: currentUser.id, ownerName: currentUser.name, ownerAvatar: currentUser.avatar, ownerRating: currentUser.rating }, imageFiles);
      if (saved) setListings((cur) => cur.map((l) => l.id === listing.id ? saved : l));
      await updateProfile(currentUser.id, { role: "owner", listedItems: updated.listedItems });
    }
  }`
);

// 3. requestBooking – persist to Supabase
src = src.replace(
  `  function requestBooking(listing: Listing, startDate: string, endDate: string, note: string) {
    const booking: Booking = {
      id: uid("book"),
      listingId: listing.id,
      renterId: currentUser.id,
      ownerId: listing.ownerId,
      startDate,
      endDate,
      status: "pending",
      note,
      createdAt: new Date().toISOString(),
    };
    setBookings((current) => [booking, ...current]);
    setNotifications((current) => [
      {
        id: uid("not"),
        title: "Booking request sent",
        body: \`Your request for \${listing.title} is pending owner approval.\`,
        type: "booking",
        read: false,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
    setBookingListing(null);
    setDashboardTab("bookings");
    notify("Booking request sent. The owner can accept or reject it.");
  }`,
  `  async function requestBooking(listing: Listing, startDate: string, endDate: string, note: string) {
    const booking: Booking = {
      id: uid("book"),
      listingId: listing.id,
      renterId: currentUser.id,
      ownerId: listing.ownerId,
      startDate,
      endDate,
      status: "pending",
      note,
      createdAt: new Date().toISOString(),
    };
    setBookings((cur) => [booking, ...cur]);
    setBookingListing(null);
    setDashboardTab("bookings");
    notify("Booking request sent. The owner can accept or reject it.");
    if (isLoggedIn) await createBooking(booking);
  }`
);

// 4. updateBooking – persist to Supabase
src = src.replace(
  `  function updateBooking(id: string, status: BookingStatus) {
    setBookings((current) => current.map((booking) => (booking.id === id ? { ...booking, status } : booking)));
    setNotifications((current) => [
      {
        id: uid("not"),
        title: \`Booking \${status}\`,
        body: \`The booking status was updated to \${status}.\`,
        type: "booking",
        read: false,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
    notify(\`Booking marked \${status}.\`);
  }`,
  `  async function updateBooking(id: string, status: BookingStatus) {
    setBookings((cur) => cur.map((b) => (b.id === id ? { ...b, status } : b)));
    notify(\`Booking marked \${status}.\`);
    if (isLoggedIn) await sbUpdateBookingStatus(id, status);
  }`
);

// 5. createOrOpenThread – persist to Supabase
src = src.replace(
  `  function createOrOpenThread(listing: Listing) {
    let thread = threads.find(
      (candidate) =>
        candidate.listingId === listing.id &&
        ((candidate.renterId === currentUser.id && candidate.ownerId === listing.ownerId) ||
          (candidate.ownerId === currentUser.id && candidate.renterId === listing.ownerId)),
    );

    if (!thread) {
      thread = {
        id: uid("thread"),
        listingId: listing.id,
        renterId: currentUser.id,
        ownerId: listing.ownerId,
        messages: [
          {
            id: uid("msg"),
            senderId: currentUser.id,
            body: \`Hi \${listing.ownerName}, I am interested in \${listing.title}. Is it available?\`,
            createdAt: new Date().toISOString(),
          },
        ],
      };
      setThreads((current) => [thread!, ...current]);
    }
    setChatListing(listing);
    setDashboardTab("messages");
  }`,
  `  async function createOrOpenThread(listing: Listing) {
    if (!isLoggedIn) { setAuthMode("login"); notify("Please log in to contact the owner."); return; }
    let thread = threads.find(
      (t) => t.listingId === listing.id &&
        ((t.renterId === currentUser.id && t.ownerId === listing.ownerId) ||
          (t.ownerId === currentUser.id && t.renterId === listing.ownerId)),
    );
    if (!thread) {
      const firstMsgId = uid("msg");
      thread = {
        id: uid("thread"),
        listingId: listing.id,
        renterId: currentUser.id,
        ownerId: listing.ownerId,
        messages: [{ id: firstMsgId, senderId: currentUser.id, body: \`Hi \${listing.ownerName}, I am interested in \${listing.title}. Is it available?\`, createdAt: new Date().toISOString() }],
      };
      setThreads((cur) => [thread!, ...cur]);
      if (isLoggedIn) {
        await createThread({ id: thread.id, listingId: thread.listingId, renterId: thread.renterId, ownerId: thread.ownerId });
        await sbSendMessage(thread.id, currentUser.id, thread.messages[0].body, firstMsgId);
      }
    }
    setChatListing(listing);
    setDashboardTab("messages");
  }`
);

// 6. sendMessage – persist to Supabase
src = src.replace(
  `  function sendMessage(threadId: string, body: string) {
    if (!body.trim()) return;
    setThreads((current) =>
      current.map((thread) =>
        thread.id === threadId
          ? {
              ...thread,
              messages: [
                ...thread.messages,
                {
                  id: uid("msg"),
                  senderId: currentUser.id,
                  body,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : thread,
      ),
    );
    setNotifications((current) => [
      {
        id: uid("not"),
        title: "Message sent",
        body: "Your chat is saved in Messages.",
        type: "message",
        read: false,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
  }`,
  `  async function sendMessage(threadId: string, body: string) {
    if (!body.trim()) return;
    const msgId = uid("msg");
    const msg = { id: msgId, senderId: currentUser.id, body, createdAt: new Date().toISOString() };
    setThreads((cur) => cur.map((t) => t.id === threadId ? { ...t, messages: [...t.messages, msg] } : t));
    if (isLoggedIn) await sbSendMessage(threadId, currentUser.id, body, msgId);
  }`
);

// 7. addReview – persist to Supabase
src = src.replace(
  `  function addReview(listingId: string, toUserId: string, body: string, rating: number) {
    setReviews((current) => [
      {
        id: uid("rev"),
        listingId,
        fromUserId: currentUser.id,
        toUserId,
        body,
        rating,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
    setNotifications((current) => [
      {
        id: uid("not"),
        title: "Review posted",
        body: "Thanks for helping the marketplace build trust.",
        type: "review",
        read: false,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
    notify("Review posted.");
  }`,
  `  async function addReview(listingId: string, toUserId: string, body: string, rating: number) {
    const rev = { id: uid("rev"), listingId, fromUserId: currentUser.id, toUserId, body, rating, createdAt: new Date().toISOString() };
    setReviews((cur) => [rev, ...cur]);
    notify("Review posted.");
    if (isLoggedIn) await createReview(rev);
  }`
);

// 8. deleteListing – persist to Supabase
src = src.replace(
  `  function deleteListing(id: string) {
    setListings((current) => current.filter((listing) => listing.id !== id));
    notify("Listing removed.");
  }`,
  `  async function deleteListing(id: string) {
    setListings((cur) => cur.filter((l) => l.id !== id));
    notify("Listing removed.");
    if (isLoggedIn) await sbDeleteListing(id);
  }`
);

// 9. Add onSignOut prop to Header call
src = src.replace(
  `        onAuth={setAuthMode}
        onList={() => setShowListingForm(true)}
        onDashboard={() => setDashboardTab("overview")}
        onAdmin={() => setDashboardTab("admin")}`,
  `        isLoggedIn={isLoggedIn}
        onAuth={setAuthMode}
        onSignOut={async () => { await signOut(); notify("Signed out."); }}
        onList={() => setShowListingForm(true)}
        onDashboard={() => setDashboardTab("overview")}
        onAdmin={() => setDashboardTab("admin")}`
);

fs.writeFileSync('src/components/RentifyApp.tsx', src.replace(/\n/g, '\r\n'), 'utf8');
console.log('Actions patched. Size:', src.length);
