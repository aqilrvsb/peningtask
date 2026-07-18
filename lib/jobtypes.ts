// "Jenis Job" (job category) options per platform. "Semua" (All) is a filter-only
// pseudo-option and is never stored on a job.
export const JOB_TYPES: Record<string, string[]> = {
  TikTok:    ["Combo", "Followers", "Likes", "Comments", "Live", "Save", "Repost", "Share", "Affiliate"],
  Instagram: ["Combo", "Followers", "Likes", "Comments", "Repost", "Share"],
  Facebook:  ["Combo", "Follow", "Likes", "Comments", "Live", "Share", "Review"],
  YouTube:   ["Combo", "Subscribe", "Watch", "Likes", "Comment"],
  Threads:   ["Combo", "Followers", "Likes", "Comments", "Repost", "Quote"],
  Shopee:    ["Combo", "Followers", "Likes", "Comments", "Live", "Save", "Repost", "Share", "Affiliate"],
};

export const jobTypesFor = (platform: string): string[] => JOB_TYPES[platform] ?? [];
