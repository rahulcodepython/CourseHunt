"use client";

import { Icon } from "@package/components/icon";

export interface TabItem {
	id: string;
	name: string;
	icon: string;
}

interface TabsNavProps {
	tabs: TabItem[];
	activeTab: string;
	onChange: (id: string) => void;
}

export function TabsNav({ tabs, activeTab, onChange }: TabsNavProps) {
	return (
		<div className="border-b flex gap-4 overflow-x-auto">
			{tabs.map((tab) => {
				const isActive = activeTab === tab.id;
				return (
					<button
						key={tab.id}
						onClick={() => onChange(tab.id)}
						className={`flex items-center gap-2 pb-3 text-xs font-semibold cursor-pointer border-none bg-transparent transition-colors ${
							isActive ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
						}`}
					>
						<Icon name={tab.icon as any} className="w-4.5 h-4.5" />
						{tab.name}
					</button>
				);
			})}
		</div>
	);
}
