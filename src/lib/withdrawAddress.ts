import { AddressEntry } from '../components/AddressBook';

const BOOK_KEY = 'address_book';
const ID_KEY = 'usdc_wallet_id';
const LEGACY_KEY = 'usdc_wallet';

function readAddressBook(): AddressEntry[] {
  try {
    const raw = localStorage.getItem(BOOK_KEY);
    return raw ? (JSON.parse(raw) as AddressEntry[]) : [];
  } catch {
    return [];
  }
}

export function getSelectedWithdrawEntry(): AddressEntry | null {
  const id = localStorage.getItem(ID_KEY);
  if (!id) return null;
  const book = readAddressBook();
  return book.find(e => e.id === id) ?? null;
}

export function setSelectedWithdrawAddressId(entry: AddressEntry): void {
  localStorage.setItem(ID_KEY, entry.id);
  localStorage.setItem(LEGACY_KEY, entry.address);
}

export function clearSelectedWithdrawAddress(): void {
  localStorage.removeItem(ID_KEY);
}

export function migrateLegacyUsdcWallet(): void {
  if (localStorage.getItem(ID_KEY)) return;
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (!legacy) return;
  const book = readAddressBook();
  const match = book.find(e => e.address.toLowerCase() === legacy.toLowerCase());
  if (!match) return;
  localStorage.setItem(ID_KEY, match.id);
  localStorage.removeItem(LEGACY_KEY);
}
