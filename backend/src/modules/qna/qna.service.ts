import { connectToDB } from "../../shared/lib/db";
import { QnAModel } from "../../shared/models/QnA";

export async function answerQuestion(qnaId: string, teacherId: string, reply: string) {
  await connectToDB();

  const qna = await QnAModel.findById(qnaId);
  if (!qna) {
    throw { status: 404, message: "প্রশ্ন পাওয়া যায়নি" };
  }

  qna.answers.push({
    teacher: teacherId as any,
    reply,
    date: new Date(),
  });

  await qna.save();

  return { message: "উত্তর দেওয়া হয়েছে", qna };
}
