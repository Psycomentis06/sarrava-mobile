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
  created_at: string | number | null;
  updated_at: string | number | null;
  updated_by: string | null;
};

export enum DepartmentRole {
  MANAGER = "MANAGER",
  STAFF = "STAFF",
  TECHNICIAN = "TECHNICIAN",
  SUPERVISOR = "SUPERVISOR",
}

export type AgentDepartment = {
  id: string;
  name: string;
  country: string;
  country_ar: string;
  country_code: string;
  city: string;
  zipcode: string;
  address: string;
  created_at: number | string | null;
  updated_at: number | string | null;
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
  created_by?: string | UserProfile; // either user profile id or the user profile object
  created_at: string;
  profile_picture?: string | null;
  currency?: number | null;
  department?: AgentDepartment;
  department_id?: string;
  department_role?: DepartmentRole;
};

export type TransactionInternalMetadata = {
  localId?: string;
  originalId?: string;
  syncStatus: "PENDING" | "SYNCED" | "ERROR";
  errorMessage?: string;
  createdOffline?: boolean;
  operationType?: "UPDATE_STATUS" | "ADD_NEW_TRANSACTION";
  lastSyncAttempt?: number | string;
};
export type Transaction = {
  id: string; // UUID
  currency: Currency;
  currency_id: number;
  amount_usd: number; // numeric
  original_amount: number; // numeric
  operation_cost_usd: number; // calculated between price percent_rate and price_fixed_rate
  operation_cost_original: number; // calculated between price percent_rate and price_fixed_rate
  operation_tax_usd: number; // DEPRECATED
  operation_tax_original: number; // DEPRECATED
  price_percent_rate: number; // percentage between 0 and 1
  price_fixed_rate: number; // fixed price in current transaction currency
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
  pin_code?: number; // integer
  __internal?: TransactionInternalMetadata;
};

export enum TransactionStatus {
  PENDING = "PENDING",
  CANCELED = "CANCELED",
  CONFIRMED = "CONFIRMED",
  FAILED = "FAILED",
}

export type BaseTransactionsAnalytics = {
  total_transactions: number;
  confirmed_transactions: number;
  pending_transactions: number;
  failed_transactions: number;
  canceled_transactions: number;
  confirmed_usd_amount: number;
  pending_usd_amount: number;
  failed_usd_amount: number;
  canceled_usd_amount: number;
  confirmed_earnings_usd: number;
  confirmed_tax_fees_usd: number;
  pending_earnings_usd: number;
  pending_tax_fees_usd: number;
  avg_confirmed_transaction_usd: number;
  first_transaction_date: number | string;
  last_transaction_date: number | string;
  success_rate_percent: number;
  current_month_confirmed_transactions: number;
  current_month_confirmed_usd_amount: number;
  current_month_earnings_usd: number;
};

export type AgentTransactionsAnalytics = BaseTransactionsAnalytics & {
  agent_id?: string;
  agent?: UserProfile;
};

export type DepartmentTransactionsAnalytics = BaseTransactionsAnalytics & {
  department_id?: string;
  department?: AgentDepartment;
};

export type TransactionsAnalytics = AgentTransactionsAnalytics | DepartmentTransactionsAnalytics

export type Report = {
  id: string; // UUID
  agent_id: string; // UUID
  title: string; // Text
  description?: string; // Text (optional)
  from_date: string | number; // Date
  to_date: string | number; // Date
  total_transactions: number; // Integer
  confirmed_transactions: number; // Integer
  pending_transactions: number; // Integer
  failed_transactions: number; // Integer
  canceled_transactions: number; // Integer
  confirmed_usd_amount: number; // Numeric
  confirmed_earnings_usd: number; // Numeric
  created_at?: Date; // Timestamp (optional)
};
