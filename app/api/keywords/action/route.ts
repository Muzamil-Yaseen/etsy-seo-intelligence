import { NextResponse } from "next/server";
import { db, initializeDatabase } from "@/lib/db";
import { projectKeywords } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const KeywordActionSchema = z.object({
  projectId: z.string(),
  keywordId: z.string(),
  action: z.enum(["SELECT", "DESELECT", "REJECT", "UNREJECT", "UPDATE_NOTES"]),
  rejectionReason: z.enum(["IRRELEVANT", "MISLEADING", "TOO_COMPETITIVE", "WEAK_DEMAND", "LOW_CONFIDENCE", "NOT_APPLICABLE"]).optional(),
  userNotes: z.string().optional(),
});

export async function POST(request: Request) {
  await initializeDatabase();

  try {
    const json = await request.json();
    const data = KeywordActionSchema.parse(json);

    const existing = (
      await db
        .select()
        .from(projectKeywords)
        .where(
          and(
            eq(projectKeywords.projectId, data.projectId),
            eq(projectKeywords.keywordId, data.keywordId)
          )
        )
    )[0];

    const updates: Partial<typeof projectKeywords.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.action === "SELECT") {
      updates.isSelected = true;
      updates.isRejected = false;
      updates.rejectionReason = null;
    } else if (data.action === "DESELECT") {
      updates.isSelected = false;
    } else if (data.action === "REJECT") {
      updates.isRejected = true;
      updates.isSelected = false;
      updates.rejectionReason = data.rejectionReason || "NOT_APPLICABLE";
    } else if (data.action === "UNREJECT") {
      updates.isRejected = false;
      updates.rejectionReason = null;
    }

    if (data.userNotes !== undefined) {
      updates.userNotes = data.userNotes;
    }

    if (existing) {
      await db
        .update(projectKeywords)
        .set(updates)
        .where(eq(projectKeywords.id, existing.id));
    } else {
      await db.insert(projectKeywords).values({
        id: `pkw_${data.projectId}_${data.keywordId}`,
        projectId: data.projectId,
        keywordId: data.keywordId,
        isSelected: updates.isSelected ?? false,
        isRejected: updates.isRejected ?? false,
        rejectionReason: updates.rejectionReason ?? null,
        userNotes: updates.userNotes ?? null,
      });
    }

    return NextResponse.json({ success: true, action: data.action });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
