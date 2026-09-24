import { connectToDB } from "../../shared/lib/db";
import { QnAModel } from "../../shared/models/QnA";
import { CourseModel } from "../../shared/models/Course";
import { notify } from "../notification/notification.service";

export async function answerQuestion(qnaId: string, teacherId: string, reply: string, images?: string[]) {
  await connectToDB();

  const qna = await QnAModel.findById(qnaId);
  if (!qna) {
    throw { status: 404, message: "প্রশ্ন পাওয়া যায়নি" };
  }

  qna.answers.push({
    teacher: teacherId as any,
    reply,
    images: images || [],
    date: new Date(),
  });

  await qna.save();

  const course = await CourseModel.findById(qna.course).select("title").lean();
  await notify({
    user: String(qna.student),
    type: "qna",
    title: "আপনার প্রশ্নের উত্তর এসেছে",
    message: `"${(course as { title?: string } | null)?.title || "কোর্স"}" কোর্সে আপনার প্রশ্নের উত্তর দেওয়া হয়েছে`,
    link: `/courses/${qna.course}/learn`,
  });

  return { message: "উত্তর দেওয়া হয়েছে", qna };
}
