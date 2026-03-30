import { prisma } from './prisma';

export async function appendEvaluationMessage(
  evaluationId: string,
  message: { role: 'admin' | 'client'; text: string; at: string; name?: string }
) {
  const msgJson = JSON.stringify(message);
  await prisma.$executeRaw`
    UPDATE "Evaluation"
    SET "messages" = COALESCE("messages", '[]'::jsonb) || ${msgJson}::jsonb,
        "updatedAt" = NOW()
    WHERE "id" = ${evaluationId}
  `;
}

export async function setMessageReaction(
  evaluationId: string,
  messageIndex: number,
  reaction: string | null
) {
  const path = `{${messageIndex},reaction}`;
  if (reaction) {
    await prisma.$executeRaw`
      UPDATE "Evaluation"
      SET "messages" = jsonb_set("messages", ${path}::text[], ${JSON.stringify(reaction)}::jsonb),
          "updatedAt" = NOW()
      WHERE "id" = ${evaluationId}
    `;
  } else {
    await prisma.$executeRaw`
      UPDATE "Evaluation"
      SET "messages" = "messages" #- ${path}::text[],
          "updatedAt" = NOW()
      WHERE "id" = ${evaluationId}
    `;
  }
}
