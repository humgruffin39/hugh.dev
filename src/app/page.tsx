import TextLink from "@/components/text-link";

const SITE_LINKS = [
  { href: "/crafts", label: "/Crafts", newTab: false },
  { href: "mailto:me@hugh.dev", label: "Email", newTab: true },
  { href: "https://x.com/humgruffin39", label: "Twitter", newTab: true },
  {
    href: "https://github.com/humgruffin39",
    label: "GitHub",
    newTab: true,
  },
] as const;

export default function Home() {
  return (
    <section
      aria-labelledby="intro-title"
      className="relative z-10 w-full max-w-md px-8 py-12 sm:px-12 sm:py-16"
    >
      <div className="mx-auto w-full max-w-[38ch] space-y-3">
        <h1
          id="intro-title"
          className="font-signifier text-[28px] text-balance text-[#ededed]"
        >
          Hugh Fabre
        </h1>
        <p className="font-sans text-sm leading-snug text-[#ededed]/80">
          Web Engineer / Designer
        </p>
        <p className="font-sans text-sm leading-relaxed text-pretty text-[#ededed]/95">
          I care about the details, from how an interface feels to the code and
          infrastructure behind it. <br />I like making things that feel good to
          use and hold up well under the hood. <br />
          If you’ve got something interesting in mind, I’m always keen to chat.
        </p>
        <nav
          aria-label="Links"
          className="flex justify-start gap-4 font-sans text-sm leading-snug font-medium"
        >
          {SITE_LINKS.map(({ href, label, newTab }) => (
            <TextLink key={href} href={href} newTab={newTab}>
              {label}
            </TextLink>
          ))}
        </nav>
      </div>
    </section>
  );
}
