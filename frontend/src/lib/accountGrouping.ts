import type { ConnectionProvider } from '@/types/integration';

export interface DiscoveredAccount {
  accountId: string;
  accountName: string;
  provider: ConnectionProvider;
}

export interface ExistingCompany {
  id: string;
  name: string;
  connections: {
    provider: ConnectionProvider;
    externalAccountId: string;
    externalAccountName: string | null;
  }[];
}

export interface AccountGroup {
  id: string; // temp id for UI
  companyName: string;
  existingCompanyId: string | null;
  skip: boolean;
  accounts: DiscoveredAccount[];
}

const PLATFORM_SUFFIXES = [
  'tiktok', 'instagram', 'insta', 'facebook', 'fb', 'youtube', 'yt',
  'official', 'hu', 'hungary', 'page', 'pages', 'channel',
];

/**
 * Normalize an account name for fuzzy matching:
 * - lowercase
 * - remove platform-related suffixes
 * - strip underscores, hyphens, dots, spaces
 */
export function normalizeName(name: string): string {
  let n = name.toLowerCase().trim();

  // Remove common separators for suffix matching
  for (const suffix of PLATFORM_SUFFIXES) {
    // Remove as standalone word or with separators
    n = n.replace(new RegExp(`[\\s_\\-.]?${suffix}[\\s_\\-.]?`, 'g'), ' ');
  }

  // Collapse whitespace and trim
  n = n.replace(/[\s_\-.]+/g, '').trim();

  return n;
}

/**
 * Group discovered accounts by name similarity and existing connections.
 */
export function groupAccounts(
  discovered: DiscoveredAccount[],
  existingCompanies: ExistingCompany[]
): AccountGroup[] {
  const groups: AccountGroup[] = [];
  const assigned = new Set<string>(); // "provider:accountId"

  // Build a lookup: externalAccountId+provider → company
  const connectionToCompany = new Map<string, ExistingCompany>();
  for (const company of existingCompanies) {
    for (const conn of company.connections) {
      connectionToCompany.set(`${conn.provider}:${conn.externalAccountId}`, company);
    }
  }

  // Phase 1: Match accounts that already have an IntegrationConnection
  const companyGroupMap = new Map<string, AccountGroup>();

  for (const account of discovered) {
    const key = `${account.provider}:${account.accountId}`;
    const existingCompany = connectionToCompany.get(key);

    if (existingCompany) {
      assigned.add(key);
      if (!companyGroupMap.has(existingCompany.id)) {
        companyGroupMap.set(existingCompany.id, {
          id: `existing-${existingCompany.id}`,
          companyName: existingCompany.name,
          existingCompanyId: existingCompany.id,
          skip: false,
          accounts: [],
        });
      }
      companyGroupMap.get(existingCompany.id)!.accounts.push(account);
    }
  }

  // Add existing company groups
  for (const group of companyGroupMap.values()) {
    groups.push(group);
  }

  // Phase 2: Group remaining accounts by normalized name
  const nameGroups = new Map<string, DiscoveredAccount[]>();

  for (const account of discovered) {
    const key = `${account.provider}:${account.accountId}`;
    if (assigned.has(key)) continue;

    const normalized = normalizeName(account.accountName);
    if (!nameGroups.has(normalized)) {
      nameGroups.set(normalized, []);
    }
    nameGroups.get(normalized)!.push(account);
    assigned.add(key);
  }

  // Convert name groups into AccountGroups
  let groupIdx = 0;
  for (const [, accounts] of nameGroups) {
    // Try to find a matching existing company by normalized name
    const normalizedAccName = normalizeName(accounts[0].accountName);
    const matchingCompany = existingCompanies.find(
      c => normalizeName(c.name) === normalizedAccName && !companyGroupMap.has(c.id)
    );

    // Pick the best display name (longest original name)
    const bestName = accounts.reduce(
      (best, a) => (a.accountName.length > best.length ? a.accountName : best),
      accounts[0].accountName
    );

    groups.push({
      id: `new-${groupIdx++}`,
      companyName: matchingCompany?.name || cleanDisplayName(bestName),
      existingCompanyId: matchingCompany?.id || null,
      skip: false,
      accounts,
    });
  }

  return groups;
}

/**
 * Clean up an account name for use as a company name.
 * Removes platform suffixes but keeps it readable.
 */
function cleanDisplayName(name: string): string {
  let clean = name.trim();
  // Remove trailing platform identifiers
  for (const suffix of ['TikTok', 'Instagram', 'Facebook', 'YouTube', 'Official', 'Page', 'Channel']) {
    clean = clean.replace(new RegExp(`\\s*[-_]?\\s*${suffix}\\s*$`, 'i'), '');
  }
  return clean.trim() || name.trim();
}
