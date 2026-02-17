/** Budget row from DB */
export type Budget = {
  id: string;
  user_id: string;
  category_id: string;
  month: number;
  year: number;
  amount: number;
  created_at: string;
};

/** Budget with category name for display (join categories) */
export type BudgetWithCategory = Budget & {
  category_name: string;
};

/** Create budget: category_id, month, year, amount */
export type CreateBudgetInput = {
  category_id: string;
  month: number;
  year: number;
  amount: number;
};

/** Update budget: amount (and optionally month, year, category) */
export type UpdateBudgetInput = {
  amount?: number;
  month?: number;
  year?: number;
  category_id?: string;
};
