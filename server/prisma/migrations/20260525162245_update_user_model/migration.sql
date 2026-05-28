-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "passwordHash" TEXT,
    "pinHash" TEXT NOT NULL DEFAULT '',
    "name" TEXT,
    "dob" TEXT,
    "gender" TEXT,
    "height" TEXT,
    "weight" TEXT,
    "bloodType" TEXT,
    "allergies" TEXT NOT NULL DEFAULT '[]',
    "conditions" TEXT NOT NULL DEFAULT '[]',
    "pastSurgeries" TEXT NOT NULL DEFAULT '[]',
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyContactDetails" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("allergies", "bloodType", "conditions", "createdAt", "dob", "emergencyContactName", "emergencyContactPhone", "gender", "height", "id", "name", "pastSurgeries", "pinHash", "updatedAt", "weight") SELECT "allergies", "bloodType", "conditions", "createdAt", "dob", "emergencyContactName", "emergencyContactPhone", "gender", "height", "id", "name", "pastSurgeries", "pinHash", "updatedAt", "weight" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
