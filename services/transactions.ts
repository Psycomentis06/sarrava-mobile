/**
 * Functions related working with transactions
 */

import { Currency } from "@/utils/models";

export enum TransactionPricingTierFeeType {
  FIXED = "fixed",
  PERCENT = "percent",
}
export type TransactionPricingTier = {
  maxAmount: number;
  fee: number;
  feeType: TransactionPricingTierFeeType;
};

/**
 * Transaction cost pricing tiers
 */
export const PRICING_TIERS: TransactionPricingTier[] = [
  { maxAmount: 50, fee: 1, feeType: TransactionPricingTierFeeType.FIXED }, // $0–50: $1 flat fee
  { maxAmount: 200, fee: 2, feeType: TransactionPricingTierFeeType.FIXED }, // $51–200: $2 flat fee
  {
    maxAmount: 1000,
    fee: 0.01,
    feeType: TransactionPricingTierFeeType.PERCENT,
  }, // $201–1000: 1% fee
  {
    maxAmount: 5000,
    fee: 0.0075,
    feeType: TransactionPricingTierFeeType.PERCENT,
  }, // $1001–5000: 0.75% fee
  {
    maxAmount: 10000,
    fee: 0.005,
    feeType: TransactionPricingTierFeeType.PERCENT,
  }, // $5001–10000: 0.5% fee
  {
    maxAmount: Infinity,
    fee: 0.0045,
    feeType: TransactionPricingTierFeeType.PERCENT,
  }, // $10000+: 0.45% fee
];

/**
 * Government fixed transaction tax rate
 */
export const GOVERNMENT_TAX_RATE = 0.002;

/**
 * Get the exchange rate from a given currency to a given currency
 * @param from currency to convert from
 * @param to currency to convert to
 * @returns the exchange rate between the two currencies. If one of the currencies is missing
 * a 0 is returned
 */
export function getExchangeRate(from: Currency, to: Currency): number {
  if (!from || !to) {
    return 0;
  }
  const fromInUSD = 1 / from.to_dollar_rate;
  const toInUSD = 1 / to.to_dollar_rate;
  const exchangeRate = toInUSD / fromInUSD;
  return Math.round(exchangeRate * 1e6) / 1e6;
}

/**
 * Calculate the fees for a given transaction. Transaction should not be null or undefined.
 * NOTE: Calculated values are based on the USD values. You have to convert the fee values back to their
 * original currency otherwise values will be inconsistent and prices will be unreasonable
 * @param amount transaction amount in USD to calculate
 * @returns an object with operationCost, governmentTax, and totalFee
 */
export function calculateTransactionFees(amount: number) {
  if (amount == undefined || amount == null) {
    throw new Error("Can't calculate transaction fees: Amount is missing");
  }

  const tier = PRICING_TIERS.find((tier) => amount <= tier.maxAmount);
  if (!tier) {
    throw new Error("Can't calculate transaction fees: No tier was found");
  }

  let operationCost = 0;
  if (tier.feeType === TransactionPricingTierFeeType.FIXED) {
    operationCost = tier.fee;
  } else {
    operationCost = amount * tier.fee;
  }

  const governmentTax = amount * GOVERNMENT_TAX_RATE;

  return {
    operationCost,
    governmentTax,
    totalFee: operationCost + governmentTax,
    tier,
    governmentRate: GOVERNMENT_TAX_RATE,
  };
}
