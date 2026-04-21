## Packages
framer-motion | Complex layout animations and transitions
clsx | Conditional class names utility (standard)
tailwind-merge | Class merging utility (standard)
diff | For visualizing text differences if needed on frontend (though backend provides formattedDiff)
lucide-react | Icons (already in base, but ensuring it's noted)

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  display: ["var(--font-display)"],
  body: ["var(--font-body)"],
  mono: ["var(--font-mono)"],
}
