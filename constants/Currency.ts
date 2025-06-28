import { Currency } from "@/utils/models";

export const DefaultCurrency: Currency = {
  id: 0,
  name: "Dollar",
  sign: "USD",
  to_dollar_rate: 1,
  country: "United States",
  flag: "🇺🇸",
  created_at: Date.now().toLocaleString(),
  updated_at: Date.now().toLocaleString(),
  updated_by: null,
  ar_name: "الدّولار",
  country_code: "us",
  flag_url:
    "https://www.countryflags.com/wp-content/uploads/united-states-of-america-flag-png-large.png",
};
