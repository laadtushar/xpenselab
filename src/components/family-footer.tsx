import { FAMILY_FOUNDER, FAMILY_SIBLINGS, FAMILY_STUDIO } from '@/lib/family';

/**
 * The "LabyNator family" block: the studio, the sibling apps and the builder.
 * Plain links on purpose: same tab, no nofollow (these are the owner's own
 * sites), each pointing straight at the canonical URL. The list lives in
 * `lib/family.ts`.
 */
export function FamilyFooter() {
  return (
    <section
      aria-label="LabyNator family"
      className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground md:items-start md:text-left"
    >
      <p>
        Part of{' '}
        <a
          href={FAMILY_STUDIO.url}
          className="font-semibold text-foreground underline-offset-4 hover:underline"
        >
          {FAMILY_STUDIO.name}
        </a>
      </p>
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 md:justify-start">
        {FAMILY_SIBLINGS.map((app) => (
          <li key={app.id}>
            <a
              href={app.url}
              className="transition-colors hover:text-foreground hover:underline underline-offset-4"
            >
              {app.name} — {app.blurb}
            </a>
          </li>
        ))}
      </ul>
      <p>
        Built by{' '}
        <a
          href={FAMILY_FOUNDER.url}
          className="font-semibold text-foreground underline-offset-4 hover:underline"
        >
          {FAMILY_FOUNDER.name}
        </a>
      </p>
    </section>
  );
}
