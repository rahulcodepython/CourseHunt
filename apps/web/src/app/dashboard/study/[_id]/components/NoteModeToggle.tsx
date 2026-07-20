"use client";

interface NoteModeToggleProps {
	mode: "edit" | "preview";
	onChange: (mode: "edit" | "preview") => void;
}

export function NoteModeToggle({ mode, onChange }: NoteModeToggleProps) {
	const tabClass = (active: boolean) =>
		`px-3 py-1.5 text-[10px] font-bold border-none cursor-pointer ${
			active ? "bg-primary text-white" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
		}`;

	return (
		<div className="flex border rounded-md overflow-hidden">
			<button onClick={() => onChange("edit")} className={tabClass(mode === "edit")}>Write Markdown</button>
			<button onClick={() => onChange("preview")} className={tabClass(mode === "preview")}>Preview</button>
		</div>
	);
}
