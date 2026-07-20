/** Minimal markdown -> HTML for the notes preview. Extracted out of
 *  NotesTab so it's testable / reusable on its own. */
export function parseMarkdown(text: string): string {
	if (!text) return "";
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold my-2 text-foreground">$1</h3>')
		.replace(/^## (.*$)/gim, '<h2 class="text-base font-bold my-3 text-foreground">$1</h2>')
		.replace(/^# (.*$)/gim, '<h1 class="text-lg font-bold my-4 text-foreground">$1</h1>')
		.replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>")
		.replace(/\*(.*)\*/gim, "<em>$1</em>")
		.replace(/`([^`]+)`/gim, '<code class="bg-muted px-1 rounded text-xs font-mono">$1</code>')
		.replace(/\n/g, "<br />");
}
