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
  index: number;
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
  index: number;
  department?: AgentDepartment;
  department_id?: string;
  department_role?: DepartmentRole;
  departments?: DepartmentAgentRelation[];
};

export type DepartmentAgentRelation = {
  agent_id: string;
  department_id: string;
  role: DepartmentRole;
  created_at: number | string;
  added_by: string;
};

export type TransactionStatusHistoryMetadata =
  | { amount: number; [key: string]: any }
  | { [key: string]: any };

export type TransactionStatusHistory = {
  transaction_id: string;
  prev_status: TransactionStatus;
  curr_status: TransactionStatus;
  created_at?: number | string;
  created_by: string | null;
  metadata: TransactionStatusHistoryMetadata | null;
};

export type TransactionPinAttempt = {
  transaction_id: string;
  created_at?: number | string;
  created_by: string | null;
  pin_code: string | null;
};

export type Transaction = {
  id: string; // UUID
  currency: Currency;
  currency_id: number;
  code: string;
  department_id?: string;
  department?: AgentDepartment;
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
  status_history?: TransactionStatusHistory[];
  confirmation_attempts?: TransactionPinAttempt[];
  created_by: string; // UUID
  created_at: string; // timestamp with time zone
  sender?: {
    firstname: string;
    lastname: string;
    email?: string;
    phone: string;
    address: string;
  } | null; // jsonb, optional
  receiver?: {
    firstname: string;
    lastname: string;
    email?: string;
    phone: string;
    address: string;
  } | null; // jsonb, optional
  pin_code?: number; // integer
};

export type InternalTransaction = Transaction & {
  __internal?: {
    localId?: string; // Unique ID for offline transactions before they get a Supabase ID
    syncStatus?: "PENDING" | "SYNCED" | "ERROR" | "FAILED_PERMANENTLY"; // Status of sync
    operationType?: "ADD" | "UPDATE_STATUS"; // Type of operation for queued items
    originalId?: string; // Original Supabase ID for update operations
    errorMessage?: string; // Error message if sync failed
    lastAttemptTimestamp?: string; // Timestamp of last sync attempt for backoff
    retryCount?: number; // Number of automatic retry attempts made
    createdOffline?: boolean; // Flag if transaction was created offline
    syncedAt?: string; // Timestamp when transaction was successfully synced to Supabase
  };
};

export enum TransactionStatus {
  PENDING = "PENDING",
  CANCELED = "CANCELED",
  CONFIRMED = "CONFIRMED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
  PAID_OUT = "PAID_OUT",
  COMPLETED = "COMPLETED",
  BLOCKED = "BLOCKED",
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

export type TransactionsAnalytics =
  | AgentTransactionsAnalytics
  | DepartmentTransactionsAnalytics;

export type Report = {
  id: string;
  agent_id: string;
  department_id: string | null;
  title: string;
  description?: string;
  from_date: string | number;
  to_date: string | number;
  total_transactions: number;
  confirmed_transactions: number;
  pending_transactions: number;
  refunded_transactions: number;
  paid_out_transactions: number;
  completed_transactions: number;
  failed_transactions: number;
  canceled_transactions: number;
  blocked_transactions: number;
  confirmed_usd_amount: number;
  pending_usd_amount: number;
  failed_usd_amount: number;
  canceled_usd_amount: number;
  refunded_usd_amount: number;
  paid_out_usd_amount: number;
  completed_usd_amount: number;
  blocked_usd_amount: number;
  confirmed_earnings_usd: number;
  pending_earnings_usd: number;
  completed_earnings_usd: number;
  created_at: string | number;
};
