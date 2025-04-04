// entity/database models

export type Currency = {
  id: number;
  name: string;
  ar_name: string;
  sign: string;
  to_dollar_rate: number;
  country: string;
  country_code: string;
  flag: string;
  flag_url: string;
  created_at: string | null;
  updated_at: string | null;
  updated_by: string | null;
};

export type UserRolesView = {
  id: string;
  roles: string[];
};

export type UserProfile = {
  id: string;
  user_id: string;
  firstname?: string | null;
  lastname?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  created_by?: string | UserProfile;
  created_at: string;
  profile_picture?: string | null;
  currency?: number | null;
};

export type Transaction = {
  id: string; // UUID
  currency: Currency;
  amount_usd: number; // numeric
  original_amount: number; // numeric
  exchange_rate: number; // numeric
  is_paid_full?: boolean | null; // boolean, optional
  first_installment?: number | null; // numeric, optional
  status: TransactionStatus; // text
  created_by: string; // UUID
  created_at: string; // timestamp with time zone
  sender?: {
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
    address: string;
  } | null; // jsonb, optional
  receiver?: {
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
    address: string;
  } | null; // jsonb, optional
  pin_code: number; // integer
};

export enum TransactionStatus {
  PENDING,
  CANCELED,
  CONFIRMED,
  FAILED,
}
