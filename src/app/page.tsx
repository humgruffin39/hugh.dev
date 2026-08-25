import TextLink from "@/components/text-link";

const SITE_LINKS = [
  { href: "/crafts", label: "Crafts", newTab: false },
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
      className="relative z-10 w-full max-w-md px-0 py-12 sm:px-12 sm:py-16"
    >
      <div className="mx-auto w-full space-y-3 text-sm sm:max-w-[38ch]">
        <h1
          id="intro-title"
          className="home-stagger-item font-serif text-[28px] text-balance [--home-stagger-index:0]"
        >
          Hugh Fabre
        </h1>
        <p className="home-stagger-item leading-snug text-foreground/80 [--home-stagger-index:1]">
          Web Engineer / Designer
        </p>
        <div className="leading-relaxed text-foreground/95">
          <p className="home-stagger-item [--home-stagger-index:2]">
            I care about the details, from how an interface feels to the code
            and infrastructure behind it.
          </p>
          <p className="home-stagger-item [--home-stagger-index:3]">
            I like making things that feel good to use and hold up well under
            the hood.
          </p>
          <p className="home-stagger-item [--home-stagger-index:4]">
            If you’ve got something interesting in mind, I’m always keen to
            chat.
          </p>
        </div>
        <nav
          aria-label="Links"
          className="home-stagger-item flex justify-start gap-4 leading-snug font-medium [--home-stagger-index:5]"
          data-home-stagger-end="true"
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
