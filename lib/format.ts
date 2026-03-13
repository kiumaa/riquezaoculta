// Format price in Angolan style: 4.500 Kz
export function formatPrice(amount: number): string {
  // Use pt-BR which uses period as thousands separator
  return amount.toLocaleString("pt-BR");
}

// Format price with currency: 4.500 Kz
export function formatPriceKz(amount: number): string {
  return `${formatPrice(amount)} Kz`;
}
