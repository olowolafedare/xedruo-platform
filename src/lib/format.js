const symbols = { NGN: "₦", USD: "$", GBP: "£", EUR: "€", GHS: "₵", KES: "KSh", ZAR: "R" };

export function money(amount, currency = "NGN") {
  const s = symbols[currency] || "";
  return `${s}0`;
}

export function compact(n) {
  return Number(n || 0).toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 1 });
}