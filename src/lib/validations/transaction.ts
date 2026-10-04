import { z } from "zod";

export const transactionFormSchema = z.object({
  description: z.string().min(2, "A descrição deve ter pelo menos 2 caracteres"),
  amount: z.coerce.number().positive("O valor deve ser maior que zero"),
  type: z.enum(["income", "expense"], {
    required_error: "Selecione o tipo da transação",
  }),
  category_id: z.string().min(1, "Selecione uma categoria"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (formato YYYY-MM-DD)"),
  payment_method: z.enum(["credito", "pix", "ticket"], {
    required_error: "Selecione a forma de pagamento",
  }),
  is_paid: z.boolean(),
  is_recurring: z.boolean(),
  notes: z.string().optional(),
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export const budgetFormSchema = z.object({
  category_id: z.string().min(1, "Selecione a categoria"),
  month_year: z.string().regex(/^\d{4}-\d{2}$/, "Formato inválido (YYYY-MM)"),
  target_amount: z.coerce.number().min(0, "O teto de gastos não pode ser negativo"),
});

export type BudgetFormValues = z.infer<typeof budgetFormSchema>;
