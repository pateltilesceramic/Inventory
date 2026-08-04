CREATE TABLE IF NOT EXISTS "CatalogueDesign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "finish" TEXT NOT NULL,
    "facesCount" INTEGER NOT NULL DEFAULT 4,
    "faces" TEXT NOT NULL,
    "qrImage" TEXT,
    "qrUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
