-- CreateTable for Purchase Party & Entries
CREATE TABLE IF NOT EXISTS "PurchaseParty" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "PurchaseLedgerEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partyId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "narration" TEXT NOT NULL,
    "debit" REAL NOT NULL DEFAULT 0.0,
    "credit" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PurchaseLedgerEntry_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "PurchaseParty" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable for B2B Party & Entries
CREATE TABLE IF NOT EXISTS "B2BParty" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "B2BLedgerEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partyId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "narration" TEXT NOT NULL,
    "debit" REAL NOT NULL DEFAULT 0.0,
    "credit" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "B2BLedgerEntry_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "B2BParty" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "PurchaseParty_name_key" ON "PurchaseParty"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "B2BParty_name_key" ON "B2BParty"("name");
