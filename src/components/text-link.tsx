import Link from "next/link";
import type { ReactNode } from "react";

type TextLinkProps = {
  children: ReactNode;
  href: string;
  newTab?: boolean;
};

export default function TextLink({
  children,
  href,
  newTab = false,
}: TextLinkProps) {
  return (
    <Link
      className="group text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
      href={href}
      rel={newTab ? "noopener noreferrer" : undefined}
      target={newTab ? "_blank" : undefined}
    >
      <span className="underline decoration-current underline-offset-2 opacity-85 transition-opacity duration-150 ease-out group-hover:opacity-95 group-focus-visible:opacity-95">
        {children}
      </span>
      {newTab ? (
        <svg
          aria-hidden="true"
          className="ml-0.5 inline-block size-3 translate-y-0.5 text-foreground/95"
          fill="none"
          focusable="false"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M18.25 15.25V5.75M18.25 5.75H8.75M18.25 5.75L6 18"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
          />
        </svg>
      ) : null}
    </Link>
  );
}
