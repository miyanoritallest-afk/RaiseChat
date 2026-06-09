-- DmRoom に workspaceId カラムを追加
-- 既存データは最初に見つかったワークスペースへ仮割り当てし、NOT NULL 制約を後付けする

ALTER TABLE "DmRoom" ADD COLUMN "workspaceId" TEXT;

-- 既存行: ユーザーの所属ワークスペースから最初の1件を割り当てる
UPDATE "DmRoom" dr
SET "workspaceId" = (
  SELECT wm."workspaceId"
  FROM "DmRoomMember" drm
  JOIN "WorkspaceMember" wm ON wm."userId" = drm."userId"
  WHERE drm."dmRoomId" = dr.id
  LIMIT 1
);

-- 割り当てできなかった孤立DM（メンバーなし）は削除する
DELETE FROM "DmRoom" WHERE "workspaceId" IS NULL;

-- NOT NULL 制約を付与
ALTER TABLE "DmRoom" ALTER COLUMN "workspaceId" SET NOT NULL;

-- 外部キー制約を追加
ALTER TABLE "DmRoom" ADD CONSTRAINT "DmRoom_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
