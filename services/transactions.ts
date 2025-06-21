/**
 * Functions related working with transactions
 */

import {
  AgentDepartment,
  Currency,
  Transaction,
  UserProfile,
} from "@/utils/models";

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

export function generateTransactionHTML(trx: Transaction, id: string): string {
  const formattedDate = new Date(trx.created_at).toLocaleString();

  const receiver = `
  <div class="contact">
    <div style="font-weight: 500;">${trx.receiver?.firstname} ${
    trx.receiver?.lastname
  }</div>
    <div>${trx.receiver?.phone ?? ""}</div>
    <div>${trx.receiver?.email ?? ""}</div>
    <div>${trx.receiver?.address ?? ""}</div>
  </div>
`;

  const sender = `
  <div class="contact">
    <div>${trx.sender?.firstname} ${trx.sender?.lastname}</div>
    <div>${trx.sender?.phone ?? ""}</div>
    <div>${trx.sender?.email ?? ""}</div>
    <div>${trx.sender?.address ?? ""}</div>
  </div>
`;

  const fullAmountUSD = Math.round(trx.amount_usd);
  const fullAmountOriginal = Math.round(trx.original_amount);
  const currencySign = trx.currency.sign;

  const firstInstallmentUSD = Math.round(
    (trx.first_installment ?? 0) * trx.exchange_rate
  );
  const firstInstallmentOriginal = Math.round(trx.first_installment ?? 0);

  const remainingUSD = Math.round(
    trx.amount_usd - (trx.first_installment ?? 0) * trx.exchange_rate
  );
  const remainingOriginal = Math.round(
    trx.original_amount - (trx.first_installment ?? 0)
  );

  const extraCostUSD =
    Math.round((trx.operation_cost_usd + trx.operation_tax_usd) * 100) / 100;
  const extraCostOriginal =
    Math.round(
      (trx.operation_cost_original + trx.operation_tax_original) * 100
    ) / 100;

  const exchangeSVG = `
    <svg class="exchange-icon" viewBox="0 0 48 24" fill="none">
      <path fill="#444" fill-rule="evenodd" d="m13.414 19.172 6-6 1.414 1.414L12.414 23 4 14.586l1.414-1.414 6 6V1.586h2v17.586Z" clip-rule="evenodd"/>
      <path fill="#444" fill-rule="evenodd" d="m34.586 4.828-6 6-1.414-1.414L35.586 1 44 9.414l-1.414 1.414-6-6v17.586h-2V4.828Z" clip-rule="evenodd"/>
    </svg>
  `;

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>تفاصيل المعاملة</title>
  <style>
    body {
      font-family: sans-serif;
      background: #fff;
      padding: 10px;
      direction: rtl;
    }
    .contact {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .card {
      background: white;
      padding: 15px;
      border-radius: 10px;
      max-width: 800px;
      margin: auto;
      box-shadow: 0 0 3px rgba(0,0,0,0.1);
    }
    .row {
      display: flex;
      margin-bottom: 10px;
    }
    .label {
      width: 30%;
      font-weight: bold;
      color: #3628B7;
    }
    .value {
      width: 70%;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .value-content {
      display: flex;
      flex-direction: column;
    }
    .usd {
      color: #3628B7;
      font-size: 18px;
    }
    .original {
      color: #00897B;
    }
    .error {
      color: #E53935;
    }
    .separator {
      border-top: 1px dashed rgba(0,0,0,0.3);
      margin: 20px 0;
    }
    .pin {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 15px;
    }
    .pin input {
      padding: 6px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      width: 100px;
      text-align: center;
    }
    .exchange-icon {
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }
  </style>
</head>
<body>
  <div class="card">
    <h2>ملخص المعاملة</h2>

    <div class="row"><div class="label">عدد المعاملة</div><div class="value">#${id}</div></div>
    <div class="row"><div class="label">بتاريخ :</div><div class="value">${formattedDate}</div></div>

    <div class="row"><div class="label">المستفيد</div><div class="value">${receiver}</div></div>
    <div class="row"><div class="label">المرسل</div><div class="value">${sender}</div></div>

    <div class="separator"></div>

    <div class="row">
      <div class="label">المبلغ الجملي</div>
      <div class="value">
        <div class="value-content">
          <div class="usd">${fullAmountUSD} USD</div>
          <div class="original">${fullAmountOriginal} ${currencySign}</div>
        </div>
        ${exchangeSVG}
      </div>
    </div>

    <div class="row">
      <div class="label">${
        trx.is_paid_full
          ? "تم أستلام المبلغ كاملا"
          : "تم أستلام القسط الأوّل بقيمة"
      }</div>
      <div class="value">
        <div class="value-content">
          <div class="usd">${
            trx.is_paid_full ? fullAmountUSD : firstInstallmentUSD
          } USD</div>
          <div class="original">${
            trx.is_paid_full ? fullAmountOriginal : firstInstallmentOriginal
          } ${currencySign}</div>
        </div>
        ${exchangeSVG}
      </div>
    </div>

    <div class="row">
      <div class="label">المبلغ المتبقي</div>
      <div class="value">
        <div class="value-content">
          <div class="usd error">${
            trx.is_paid_full ? "0" : remainingUSD
          } USD</div>
          <div class="original">${
            trx.is_paid_full
              ? `0 ${currencySign}`
              : `${remainingOriginal} ${currencySign}`
          }</div>
        </div>
        ${exchangeSVG}
      </div>
    </div>

    <div class="row">
      <div class="label">سعر المعاملة (سعر أضافي)</div>
      <div class="value">
        <div class="value-content">
          <div class="usd error">${extraCostUSD} USD</div>
          <div class="original">${extraCostOriginal} ${currencySign}</div>
        </div>
        ${exchangeSVG}
      </div>
    </div>

    <div class="separator"></div>

    <div class="pin">
      <div class="label">الرمز السرّي للمعاملة</div>
      <!--<input type="text" value="${trx.pin_code ?? ""}" readonly />-->
      <input class="value" type="text" value="*️⃣*️⃣*️⃣*️⃣*️⃣*️⃣" readonly />
    </div>
  </div>
</body>
</html>
`;
}

export function generateTransactionCode(
  agent: UserProfile,
  department: AgentDepartment
): string {
  const agentCode = agent.index || 0;
  const depCode = department.index || 0;
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();
  const shortYear = year % 100;
  const dateValues = [
    { value: day, prefix: 1 },
    { value: month, prefix: 2 },
    { value: shortYear, prefix: 3 },
  ];
  dateValues.sort((a, b) => a.value - b.value);
  const dateCode = dateValues
    .map((item) => `${item.prefix}${item.value.toString().padStart(2, "0")}`)
    .join("");
  const randomDigits = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `${depCode.toString().padStart(3, "0")}${agentCode
    .toString()
    .padStart(3, "0")}${dateCode}${randomDigits}`;
}
