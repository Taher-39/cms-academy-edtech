import { connectToDB } from "../../shared/lib/db";
import { CategoryModel } from "../../shared/models/Category";

export async function listCategories() {
  await connectToDB();
  const categories = await CategoryModel.find({}).sort({ name: 1 }).lean();
  return { categories };
}

export async function createCategory(data: { name: string; description?: string }) {
  await connectToDB();

  const existing = await CategoryModel.findOne({ name: data.name.trim() });
  if (existing) {
    throw { status: 409, message: "এই নামে ক্যাটাগরি ইতিমধ্যে আছে" };
  }

  const category = await CategoryModel.create({
    name: data.name.trim(),
    description: data.description,
  });

  return { message: "ক্যাটাগরি তৈরি করা হয়েছে", category };
}

export async function updateCategory(
  categoryId: string,
  data: { name?: string; description?: string }
) {
  await connectToDB();

  const category = await CategoryModel.findByIdAndUpdate(
    categoryId,
    { ...data, name: data.name?.trim() },
    { new: true, runValidators: true }
  );

  if (!category) {
    throw { status: 404, message: "ক্যাটাগরি পাওয়া যায়নি" };
  }

  return { message: "ক্যাটাগরি আপডেট করা হয়েছে", category };
}

export async function deleteCategory(categoryId: string) {
  await connectToDB();

  const category = await CategoryModel.findByIdAndDelete(categoryId);
  if (!category) {
    throw { status: 404, message: "ক্যাটাগরি পাওয়া যায়নি" };
  }

  return { message: "ক্যাটাগরি মুছে ফেলা হয়েছে" };
}
