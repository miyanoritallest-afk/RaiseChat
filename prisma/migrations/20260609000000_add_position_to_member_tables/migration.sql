-- AlterTable: ChannelMember に position カラムを追加
ALTER TABLE "ChannelMember" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: DmRoomMember に position カラムを追加
ALTER TABLE "DmRoomMember" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

-- 既存の ChannelMember に初期 position を割り当て
-- ユーザーごとに isDefault desc → name asc の順で連番を付与
UPDATE "ChannelMember" cm
SET "position" = sub.row_num - 1
FROM (
  SELECT
    cm2.id,
    ROW_NUMBER() OVER (
      PARTITION BY cm2."userId"
      ORDER BY c."isDefault" DESC, c."name" ASC
    ) AS row_num
  FROM "ChannelMember" cm2
  JOIN "Channel" c ON c.id = cm2."channelId"
) sub
WHERE cm.id = sub.id;

-- 既存の DmRoomMember に初期 position を割り当て
-- ユーザーごとに createdAt desc の順で連番を付与
UPDATE "DmRoomMember" drm
SET "position" = sub.row_num - 1
FROM (
  SELECT
    drm2.id,
    ROW_NUMBER() OVER (
      PARTITION BY drm2."userId"
      ORDER BY dr."createdAt" DESC
    ) AS row_num
  FROM "DmRoomMember" drm2
  JOIN "DmRoom" dr ON dr.id = drm2."dmRoomId"
) sub
WHERE drm.id = sub.id;
