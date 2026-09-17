// Tiny stroke-icon set (Feather-style). Inline SVG so icons render identically
// on every OS - no emoji-font dependency.
const PATHS: Record<string, string> = {
  bolt: "M13 2 3 14h7l-1 8 11-13h-8l1-7z",
  tag: "M20.6 13.4 12 22 2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8zM7 7h.01",
  flag: "M4 22V4c4-2.5 8 2 12 0v9c-4 2.5-8-2-12 0",
  pen: "M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z",
  branch: "M6 3v12M6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a9 9 0 0 1-9 9",
  megaphone: "M3 11l14-6v14L3 13v-2zM11.6 16.8a3 3 0 1 1-5.8-1.6M17 8a4 4 0 0 1 0 8",
  ticket: "M4 8a2 2 0 0 1-2-2V4h20v2a2 2 0 0 0 0 4v2a2 2 0 0 0 0 4v2H2v-2a2 2 0 0 1 0-4v-2a2 2 0 0 0 0-4zM13 5v2m0 4v2m0 4v2",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  chart: "M3 3v18h18M8 17v-6m5 6V7m5 10v-9",
};

export default function Icon({ name, size = 18 }: { name: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name] ?? PATHS.grid} />
    </svg>
  );
}
