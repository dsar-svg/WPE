-- Fix order_payments.amount for cash USD payments
-- Before: amount = what the customer gave (e.g., $20)
-- After: amount = cashTotal = what was actually charged (e.g., $17)
-- Formula: new_amount = old_amount - change_amount

-- Step 1: Preview the changes
SELECT 
  o.id AS order_id,
  o.customer_name,
  o.total AS order_total,
  o.change_amount,
  op.amount AS old_amount,
  op.amount - o.change_amount AS new_amount,
  op.currency,
  o.created_at
FROM orders o
JOIN order_payments op ON op.order_id = o.id
WHERE o.payment_method = 'Efectivo'
  AND o.change_amount > 0
  AND op.payment_method = 'Efectivo'
  AND op.currency = 'USD'
  AND op.amount > o.change_amount
ORDER BY o.created_at DESC;

-- Step 2: Apply the fix (uncomment after verifying step 1)
-- UPDATE order_payments op
-- SET amount = amount - o.change_amount
-- FROM orders o
-- WHERE op.order_id = o.id
--   AND o.payment_method = 'Efectivo'
--   AND o.change_amount > 0
--   AND op.payment_method = 'Efectivo'
--   AND op.currency = 'USD'
--   AND op.amount > o.change_amount;
