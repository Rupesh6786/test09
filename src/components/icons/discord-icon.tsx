import type { SVGProps } from "react";

export function DiscordIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2c-5.52 0-10 4.48-10 10s4.48 10 10 10c2.76 0 5.26-1.12 7.07-2.93A9.96 9.96 0 0 0 22 12c0-5.52-4.48-10-10-10z" />
      <path d="M8.5 14.5s.5-1 1-1.5c-1.5-.5-2.5-1.5-2.5-3C7 8.12 7.88 7 9.5 7s2.5 1.12 2.5 2.5v.5" />
      <path d="M15.5 14.5s-.5-1-1-1.5c1.5-.5 2.5-1.5 2.5-3C17 8.12 16.12 7 14.5 7S12 8.12 12 9.5v.5" />
    </svg>
  );
}