import BackgroundLoader from "@/components/background-loader";
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050608] px-6 py-16 sm:px-8">
      <div className="absolute inset-0">
        <BackgroundLoader />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 z-10 h-[min(20rem,48vh)] w-[min(76vw,36rem)] -translate-x-1/2 -translate-y-1/2 scale-110 bg-[radial-gradient(ellipse_at_center,rgba(5,7,11,0.66)_0%,rgba(5,7,11,0.44)_34%,rgba(5,7,11,0.18)_62%,rgba(5,7,11,0.04)_78%,transparent_100%)] blur-[18px]"
      />
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
            I care about the details, from how an interface feels to the code
            and infrastructure behind it. <br />I like making things that feel
            good to use and hold up well under the hood. <br />
            If you’ve got something interesting in mind, I’m always keen to
            chat.
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
    </main>
  );
}
