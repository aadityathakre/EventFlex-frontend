// Centralized image maps for organizer UI
// Uses files placed in public/cards_images and public/events pics

export const getEventTypeImage = (type) => {
  const t = (type || "").toLowerCase();
  const base = "/events%20pics";
  const map = {
    wedding: `${base}/marrige.png`,
    function: `${base}/function.png`,
    corporate: `${base}/corporate.png`,
    festival: `${base}/exhibition.png`,
    exhibition: `${base}/exhibition.png`,
    hackathon: `${base}/hackethon.png`,
    workshop: `${base}/workshop.png`,
    webinar: `${base}/webinar.png`,
    networking: `${base}/networking.png`,
    fundraiser: `${base}/networking.png`,
    retreat: `${base}/retrete.png`,
  };
  return map[t] || `${base}/exhibition.png`;
};

export const getCardImage = (key) => {
  const base = "/cards_images";
  const gigBase = "/gig-card-imaes";
  const map = {
    // Existing keys
    events: `${base}/host.png`,
    hostStatus: `${base}/host.png`,
    wallet: `${base}/wallet.png`,
    myPools: `${base}/pool.png`,
    poolApplications: `${base}/poolApplication.png`,
    manageGigs: `${base}/gigs.png`,
    escrow: `${base}/escrow.png`,
    // Host dashboard specific modules
    createEvent: `${base}/host.png`,
    findOrganizers: `${base}/gigs.png`,
    payments: `${base}/wallet.png`,
    organizerStatus: `${base}/poolApplication.png`,
    organizerPools: `${base}/pool.png`,
    // Gig dashboard modules (images stored in public/gig-card-images)
    gigNearbyEvents: `${gigBase}/nearbyEvents.png`,
    gigApplications: `${gigBase}/applicationStatus.png`,
    gigMyEvents: `${gigBase}/event.png`,
    gigWallet: `${gigBase}/wallet.png`,
    gigAttendance: `${gigBase}/attendence.png`,
    gigDisputes: `${gigBase}/dispute.png`,
    gigBadges: `${gigBase}/badge.png`,
    gigFeedbacks: `${gigBase}/feedback.png`,
  };
  return map[key] || `${base}/escrow.png`;
};
