import { notFound } from "next/navigation";
import { LessonView } from "@/components/lesson-view";
import { getLesson, LESSON_SLUGS } from "@/lib/lessons";

export function generateStaticParams() {
  return LESSON_SLUGS.map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = getLesson(slug);
  if (!lesson) {
    return { title: "Lesson not found" };
  }
  return {
    title: `${lesson.number} · ${lesson.title}`,
    description: lesson.summary,
  };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = getLesson(slug);
  if (!lesson) notFound();
  return <LessonView lesson={lesson} />;
}
