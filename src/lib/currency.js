// Xedruo fixed pricing rate: 1 USD = ₦1,300. Naira prices remain unchanged;
// international USD prices are calculated upward from the existing NGN price.
export const NGN_TO_USD = 1300;

export function ngnToUsd(ngn) {
  return (ngn / NGN_TO_USD).toFixed(0);
}

export function dualPrice(ngn) {
  return `₦${Number(ngn).toLocaleString()} (~$${ngnToUsd(ngn)})`;
}