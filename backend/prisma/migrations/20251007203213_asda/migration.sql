/*
  Warnings:

  - You are about to drop the `_ClubBooks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `bookId` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `clubId` on the `Comment` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "_ClubBooks_B_index";

-- DropIndex
DROP INDEX "_ClubBooks_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_ClubBooks";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "ClubBook" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clubId" INTEGER NOT NULL,
    "bookId" INTEGER NOT NULL,
    "estado" TEXT NOT NULL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addedById" INTEGER NOT NULL,
    CONSTRAINT "ClubBook_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClubBook_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClubBook_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Comment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "clubBookId" INTEGER,
    CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comment_clubBookId_fkey" FOREIGN KEY ("clubBookId") REFERENCES "ClubBook" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Comment" ("content", "createdAt", "id", "userId") SELECT "content", "createdAt", "id", "userId" FROM "Comment";
DROP TABLE "Comment";
ALTER TABLE "new_Comment" RENAME TO "Comment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ClubBook_clubId_bookId_key" ON "ClubBook"("clubId", "bookId");
