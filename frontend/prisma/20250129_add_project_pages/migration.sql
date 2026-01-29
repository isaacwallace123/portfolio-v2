-- CreateTable
CREATE TABLE "project_pages" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isStartPage" BOOLEAN NOT NULL DEFAULT false,
    "position" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_connections" (
    "id" TEXT NOT NULL,
    "sourcePageId" TEXT NOT NULL,
    "targetPageId" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_pages_projectId_idx" ON "project_pages"("projectId");

-- CreateIndex
CREATE INDEX "project_pages_isStartPage_idx" ON "project_pages"("isStartPage");

-- CreateIndex
CREATE UNIQUE INDEX "project_pages_projectId_slug_key" ON "project_pages"("projectId", "slug");

-- CreateIndex
CREATE INDEX "page_connections_sourcePageId_idx" ON "page_connections"("sourcePageId");

-- CreateIndex
CREATE INDEX "page_connections_targetPageId_idx" ON "page_connections"("targetPageId");

-- AddForeignKey
ALTER TABLE "project_pages" ADD CONSTRAINT "project_pages_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_connections" ADD CONSTRAINT "page_connections_sourcePageId_fkey" FOREIGN KEY ("sourcePageId") REFERENCES "project_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_connections" ADD CONSTRAINT "page_connections_targetPageId_fkey" FOREIGN KEY ("targetPageId") REFERENCES "project_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;