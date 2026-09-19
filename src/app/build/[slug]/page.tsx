import { notFound } from "next/navigation";
import { BuildLessonView } from "@/components/build-lesson-view";
import { BUILD_SLUGS, getBuildLesson } from "@/lib/build-lessons";
import { readPythonLesson } from "@/lib/read-python";

export function generateStaticParams() {
  return BUILD_SLUGS.map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = getBuildLesson(slug);
  if (!lesson) return { title: "Build lesson not found" };
  return { title: `${lesson.number} · ${lesson.title}`, description: lesson.summary };
}

export default async function BuildLessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = getBuildLesson(slug);
  if (!lesson) notFound();
  const source = await readPythonLesson(lesson.file);
  return <BuildLessonView lesson={lesson} source={source} />;
}
