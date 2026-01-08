## Packages
framer-motion | For smooth page transitions and micro-interactions
clsx | Utility for constructing className strings conditionally
tailwind-merge | Utility for merging Tailwind classes efficiently

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  display: ["var(--font-display)"],
  body: ["var(--font-body)"],
}

Integration:
- WebSocket connects to /ws relative to current host
- WebRTC uses public STUN server: stun:stun.l.google.com:19302
