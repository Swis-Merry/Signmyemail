export interface SocialNetwork {
  label: string;
  color: string;
  placeholder: string;
}

export const SOCIAL_NETWORKS: Record<string, SocialNetwork> = {
  linkedin: { label: "LinkedIn", color: "#0A66C2", placeholder: "https://www.linkedin.com/in/username" },
  instagram: { label: "Instagram", color: "#E4405F", placeholder: "https://www.instagram.com/username" },
  facebook: { label: "Facebook", color: "#0866FF", placeholder: "https://www.facebook.com/page" },
  x: { label: "X", color: "#000000", placeholder: "https://x.com/username" },
  youtube: { label: "YouTube", color: "#FF0000", placeholder: "https://www.youtube.com/@channel" },
  tiktok: { label: "TikTok", color: "#000000", placeholder: "https://www.tiktok.com/@username" },
  whatsapp: { label: "WhatsApp", color: "#25D366", placeholder: "https://wa.me/971500000000" },
  telegram: { label: "Telegram", color: "#26A5E4", placeholder: "https://t.me/username" },
  threads: { label: "Threads", color: "#000000", placeholder: "https://www.threads.net/@username" },
  pinterest: { label: "Pinterest", color: "#BD081C", placeholder: "https://www.pinterest.com/username" },
  snapchat: { label: "Snapchat", color: "#F7D600", placeholder: "https://www.snapchat.com/add/username" },
  github: { label: "GitHub", color: "#181717", placeholder: "https://github.com/username" },
  behance: { label: "Behance", color: "#1769FF", placeholder: "https://www.behance.net/username" },
  dribbble: { label: "Dribbble", color: "#EA4C89", placeholder: "https://dribbble.com/username" },
  medium: { label: "Medium", color: "#000000", placeholder: "https://medium.com/@username" },
  vimeo: { label: "Vimeo", color: "#1AB7EA", placeholder: "https://vimeo.com/username" },
};
