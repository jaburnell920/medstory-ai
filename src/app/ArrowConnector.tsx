// components/ArrowConnector.tsx
export default function ArrowConnector() {
  return (
    <svg
      width="20"
      height="64"
      viewBox="0 0 20 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="ml-0" // ← adjust this to ml-0 or ml-1 as needed
    >
      {/* Line with space above it */}
      <line
        x1="10"
        y1="12" // space between number and tail
        x2="10"
        y2="54"
        stroke="#38b8ff"
        strokeWidth="2"
      />
      <path
        d="M5 54 L10 64 L15 54 Z" // ← closed path with 'Z'
        fill="#38b8ff" // ← solid fill
      />
    </svg>
  );
}
