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
  created_at: string|null;
  updated_at: string|null;
  updated_by: string |null;
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
  created_at: string;
  profile_picture?: string | null;
  currency?: number | null;
};
