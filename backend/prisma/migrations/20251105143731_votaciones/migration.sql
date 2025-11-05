-- CreateTable
CREATE TABLE "periodos_lectura" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clubId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "fechaFinVotacion" DATETIME NOT NULL,
    "fechaFinLectura" DATETIME NOT NULL,
    "libroGanadorId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "periodos_lectura_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "periodos_lectura_libroGanadorId_fkey" FOREIGN KEY ("libroGanadorId") REFERENCES "ClubBook" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "votacion_opciones" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "periodoId" INTEGER NOT NULL,
    "clubBookId" INTEGER NOT NULL,
    CONSTRAINT "votacion_opciones_periodoId_fkey" FOREIGN KEY ("periodoId") REFERENCES "periodos_lectura" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "votacion_opciones_clubBookId_fkey" FOREIGN KEY ("clubBookId") REFERENCES "ClubBook" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "votos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "opcionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "votos_opcionId_fkey" FOREIGN KEY ("opcionId") REFERENCES "votacion_opciones" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "votos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "periodos_lectura_libroGanadorId_key" ON "periodos_lectura"("libroGanadorId");

-- CreateIndex
CREATE UNIQUE INDEX "votacion_opciones_periodoId_clubBookId_key" ON "votacion_opciones"("periodoId", "clubBookId");

-- CreateIndex
CREATE UNIQUE INDEX "votos_opcionId_userId_key" ON "votos"("opcionId", "userId");
