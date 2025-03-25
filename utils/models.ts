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
  created_at: number;
  updated_at: number;
  updated_by: string;
};

export type UserRolesView = {
  id: string
  roles: string[]
}
