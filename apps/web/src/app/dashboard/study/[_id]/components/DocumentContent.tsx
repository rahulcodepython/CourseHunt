export function DocumentContent({ content }: { content: string }) {
	return (
		<div className="p-6 prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
			{content}
		</div>
	);
}
