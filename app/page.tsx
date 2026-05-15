import { PickerShowcase } from "@/components/picker-showcase"

const EXAMPLE_PHRASES = [
  "tomorrow",
  "next Friday",
  "in 3 days",
  "May 20",
  "next week",
  "this month",
  "last year",
  "Janury 15",
]

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-16 px-6 py-20 sm:py-28">
        <header className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Standalone · No API key · No LLM
          </div>

          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Pick dates by typing them.
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
            Type{" "}
            <span className="font-medium text-foreground">
              &ldquo;next Friday&rdquo;
            </span>{" "}
            or{" "}
            <span className="font-medium text-foreground">
              &ldquo;this month&rdquo;
            </span>{" "}
            and the calendar follows. Built on{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-base">
              chrono-node
            </code>{" "}
            with smart typo correction and natural-language range
            understanding — entirely client-and-server, no model in the loop.
          </p>
        </header>

        <PickerShowcase />

        <section className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Phrases to try
          </h2>
          <ul className="flex flex-wrap gap-2">
            {EXAMPLE_PHRASES.map((p) => (
              <li
                key={p}
                className="rounded-md border border-border bg-card px-2.5 py-1 font-mono text-sm text-muted-foreground"
              >
                {p}
              </li>
            ))}
          </ul>
        </section>

        <footer className="border-t border-border pt-6 text-xs text-muted-foreground">
          Built with chrono-node, React 19, and shadcn/ui.
        </footer>
      </main>
    </div>
  )
}
