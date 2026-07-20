import { Icon } from "@package/components/icon";

const LESSON_TYPE_ICON: Record<string, string> = {
	video: "IconVideo",
	document: "IconFileText",
	quiz: "IconHelp",
};

interface LessonTypeIconProps {
	type: string;
	className?: string;
}

/** Shared icon-per-lesson-type lookup, previously duplicated inline in
 *  CourseSidebar, LessonContentPlayer, and the tab icons in page.tsx. */
export function LessonTypeIcon({ type, className = "w-4 h-4" }: LessonTypeIconProps) {
	const iconName = LESSON_TYPE_ICON[type];
	if (!iconName) return null;
	return <Icon name={iconName as any} className={className} />;
}
