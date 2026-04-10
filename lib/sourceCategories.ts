export interface SourceCategory {
  id: string;
  label: string;
  domains: string[];
}

export const SOURCE_CATEGORIES: SourceCategory[] = [
  {
    id: 'gov-politics',
    label: 'Gov / Politics',
    domains: ['calmatters.org', 'digitaldemocracy.calmatters.org']
  },
  {
    id: 'journalism',
    label: 'Journalism',
    domains: [
      'propublica.org',
      'documentcloud.org',
      'muckrock.com',
      'revealnews.org',
      'themarkup.org'
    ]
  },
  {
    id: 'legal',
    label: 'Legal',
    domains: [
      'lexisnexis.com',
      'pacer.gov',
      'pacer.uscourts.gov',
      'courtlistener.com'
    ]
  },
  {
    id: 'archive',
    label: 'Archive',
    domains: ['web.archive.org']
  },
  {
    id: 'reference',
    label: 'Reference',
    domains: ['docs.google.com', 'helpx.adobe.com', 'blog.adobe.com', 'openai.com', 'chatgpt.com']
  }
];

/**
 * Flat ordered domain list for deterministic per-domain priority sorting.
 * Earlier index = higher priority, exactly matching the task spec order.
 */
export const PRIORITY_ORDERED_DOMAINS: string[] = SOURCE_CATEGORIES.flatMap((c) => c.domains);

export const ALL_TRUSTED_DOMAINS = PRIORITY_ORDERED_DOMAINS;

export function matchesDomain(hostname: string, trusted: string): boolean {
  return hostname === trusted || hostname.endsWith('.' + trusted);
}

export function getCategoryForDomain(hostname: string): SourceCategory | undefined {
  return SOURCE_CATEGORIES.find((cat) =>
    cat.domains.some((d) => matchesDomain(hostname, d))
  );
}
