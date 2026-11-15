export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function maskTC(tc: string, masked: boolean = true): string {
  if (!tc) return '-';
  if (!masked || tc.length !== 11) return tc;
  return tc.slice(0, 3) + '*****' + tc.slice(8);
}

export function formatPhone(phone: string): string {
  if (!phone) return '-';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `0 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `0 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9, 11)}`;
  }
  return phone;
}

export function formatPhoneInput(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (!digits) return '';

  if (!digits.startsWith('0')) {
    digits = '0' + digits;
  }

  digits = digits.slice(0, 11);

  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  if (digits.length <= 9) return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`;
}

/**
 * Normalizes text for Turkish search (handles ı/i, İ/I, ş/s, ğ/g, ü/u, ö/o, ç/c and removes symbols)
 */
export function normalizeText(text?: string): string {
  if (!text) return '';
  return text
    .toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/i̇/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Checks if search query matches the target string with Turkish character tolerance
 */
export function searchMatches(target?: string, query?: string): boolean {
  if (!query || !query.trim()) return true;
  if (!target) return false;

  const q = query.trim().toLocaleLowerCase('tr-TR');
  const t = target.toLocaleLowerCase('tr-TR');
  if (t.includes(q)) return true;

  const qNorm = normalizeText(query);
  const tNorm = normalizeText(target);
  return tNorm.includes(qNorm);
}

/**
 * Checks if number query matches (e.g. phone, TC, barcode)
 */
export function numberMatches(target?: string, query?: string): boolean {
  if (!query || !query.trim()) return true;
  if (!target) return false;
  const qClean = query.replace(/\D/g, '');
  if (!qClean) return false;
  const tClean = target.replace(/\D/g, '');
  return tClean.includes(qClean);
}

function compareOrdersOldestFirst(a: any, b: any, ordersArray?: any[]): number {
  const dateA = (a.orderDate || (a.createdAt ? String(a.createdAt).slice(0, 10) : '')).slice(0, 10);
  const dateB = (b.orderDate || (b.createdAt ? String(b.createdAt).slice(0, 10) : '')).slice(0, 10);

  if (dateA !== dateB) {
    return dateA.localeCompare(dateB);
  }

  const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
  if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
    return timeA - timeB;
  }

  if (ordersArray) {
    // ordersArray stores newest at index 0, so a higher index is older
    return ordersArray.indexOf(b) - ordersArray.indexOf(a);
  }

  return 0;
}

/**
 * Finds all orders belonging to a customer sorted from oldest to newest (1st, 2nd, 3rd pair)
 */
export function getCustomerOrderList(
  orders: any[],
  customer?: { id?: string; tcNo?: string; phone?: string; fullName?: string }
): any[] {
  if (!customer) return [];
  const custTcClean = customer.tcNo?.replace(/\D/g, '');

  // Strict match by TC Kimlik No (with fallback to customer.id if an earlier order had no TC)
  if (custTcClean && custTcClean.length >= 2) {
    return orders
      .filter((o) => {
        const orderTc = o.customer?.tcNo?.replace(/\D/g, '');
        return orderTc === custTcClean || (Boolean(customer.id) && !orderTc && o.customer?.id === customer.id);
      })
      .sort((a, b) => compareOrdersOldestFirst(a, b, orders));
  }

  // Fallback to customer.id only if TC is not yet entered
  if (customer.id) {
    return orders
      .filter((o) => o.customer?.id === customer.id)
      .sort((a, b) => compareOrdersOldestFirst(a, b, orders));
  }

  return [];
}

/**
 * Finds which order index (1. Gözlük, 2. Gözlük, vb.) this order is for the customer
 */
export function getOrderIndexForCustomer(
  orders: any[],
  order: any
): { index: number; total: number; allOrders: any[] } {
  if (!order) return { index: 1, total: 1, allOrders: [] };
  const all = getCustomerOrderList(orders, order.customer);
  const idx = all.findIndex((o) => o.id === order.id);
  return {
    index: idx >= 0 ? idx + 1 : 1,
    total: all.length,
    allOrders: all,
  };
}
