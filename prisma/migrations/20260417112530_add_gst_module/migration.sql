-- CreateTable
CREATE TABLE "Buyer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "gstNumber" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT NOT NULL DEFAULT 'Telangana',
    "phone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TaxInvoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNo" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "buyerId" TEXT,
    "buyerName" TEXT NOT NULL,
    "buyerGst" TEXT,
    "buyerAddress" TEXT,
    "buyerPhone" TEXT,
    "placeOfSupply" TEXT NOT NULL DEFAULT 'Telangana',
    "paymentMode" TEXT NOT NULL DEFAULT 'CASH',
    "totalBaseAmount" REAL NOT NULL DEFAULT 0.0,
    "totalTaxAmount" REAL NOT NULL DEFAULT 0.0,
    "grandTotal" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TaxInvoice_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TaxInvoiceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hsnCode" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" REAL NOT NULL DEFAULT 0.0,
    "taxRate" REAL NOT NULL DEFAULT 18.0,
    "taxAmount" REAL NOT NULL DEFAULT 0.0,
    CONSTRAINT "TaxInvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "TaxInvoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TaxInvoice_invoiceNo_key" ON "TaxInvoice"("invoiceNo");
