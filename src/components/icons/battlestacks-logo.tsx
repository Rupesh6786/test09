
"use client";

import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

export function BattlestacksLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <g>
        <path
          d="M12 1.5C9.8 4.5 8.5 6.5 8 9c1 1.5 3 2.5 4 2.5s3-1 4-2.5c-.5-2.5-1.8-4.5-4-7.5Z"
          className="fill-primary animate-flame"
          style={{
            transformOrigin: 'bottom center',
            animationDelay: '0.1s',
          }}
        />
        <path
          d="M7.5 13.5 12 18l4.5-4.5L12 9l-4.5 4.5Z"
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="hsl(var(--background))"
        />
        <path
          d="m7.5 18 4.5 4.5 4.5-4.5L12 13.5 7.5 18Z"
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="hsl(var(--background))"
        />
      </g>
    </svg>
  );
}
