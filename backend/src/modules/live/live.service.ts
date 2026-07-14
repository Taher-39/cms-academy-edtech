import { connectToDB } from "../../shared/lib/db";
import { LiveClassModel } from "../../shared/models/LiveClass";

export async function updateLiveClass(
  liveId: string,
  payload: { title: string; dateTime: Date; meetLink: string },
  _actorUserId: string,
  _actorRole: string
): Promise<{ message: string; liveClass: any }> {

  await connectToDB();

  const updated = await LiveClassModel.findByIdAndUpdate(
    liveId,
    {
      title: payload.title,
      dateTime: payload.dateTime,
      meetLink: payload.meetLink,
    },
    { new: true }
  );

  if (!updated) {
    throw { status: 404, message: "লাইভ ক্লাস পাওয়া যায়নি" };
  }

  return { message: "লাইভ ক্লাস আপডেট করা হয়েছে", liveClass: updated };
}

export async function deleteLiveClass(
  liveId: string,
  _actorUserId: string,
  _actorRole: string
): Promise<{ message: string }> {

  await connectToDB();

  const deleted = await LiveClassModel.findByIdAndDelete(liveId);
  if (!deleted) {
    throw { status: 404, message: "লাইভ ক্লাস পাওয়া যায়নি" };
  }

  return { message: "লাইভ ক্লাস মুছে ফেলা হয়েছে" };
}

export async function attachRecording(
  liveClassId: string,
  lectureId: string
): Promise<{ message: string; liveClass: any }> {

  await connectToDB();

  const liveClass = await LiveClassModel.findByIdAndUpdate(
    liveClassId,
    { recordedLecture: lectureId },
    { new: true }
  );

  if (!liveClass) {
    throw { status: 404, message: "লাইভ ক্লাস পাওয়া যায়নি" };
  }

  return { message: "রেকর্ডেড লেকচার সংযুক্ত করা হয়েছে", liveClass };
}

