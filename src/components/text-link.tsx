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
      className="text-[#ededed] underline decoration-current underline-offset-2 opacity-85 transition-opacity duration-150 ease-out hover:opacity-95 focus-visible:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ededed]"
      href={href}
      rel={newTab ? "noopener noreferrer" : undefined}
      target={newTab ? "_blank" : undefined}
    >
      {children}
    </Link>
  );
}
