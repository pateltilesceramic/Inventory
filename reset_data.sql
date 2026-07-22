-- Wipe all data from child tables first to avoid foreign key conflicts
DELETE FROM "StockLog";
DELETE FROM "BillItem";
DELETE FROM "PurchaseLedgerEntry";
DELETE FROM "B2BLedgerEntry";
DELETE FROM "TaxInvoiceItem";

-- Wipe all data from parent tables
DELETE FROM "Bill";
DELETE FROM "Inventory";
DELETE FROM "PurchaseParty";
DELETE FROM "B2BParty";
DELETE FROM "TaxInvoice";
DELETE FROM "Buyer";
DELETE FROM "TaxProduct";
DELETE FROM "DynamicQR";

-- Optional: reset any system settings if desired (or leave untouched so company info is kept)
-- DELETE FROM "SystemSetting";
