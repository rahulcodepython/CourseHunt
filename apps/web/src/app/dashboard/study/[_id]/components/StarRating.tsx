"use client";

import { Icon } from "@package/components/icon";

interface StarRatingProps {
	value: number;
	onChange: (value: number) => void;
	max?: number;
}

export function StarRating({ value, onChange, max = 5 }: StarRatingProps) {
	return (
		<div className="flex items-center gap-1.5">
			{Array.from({ length: max }, (_, i) => i + 1).map((star) => (
				<button key={star} onClick={() => onChange(star)} className="p-1 cursor-pointer border-none bg-transparent">
					<Icon
						name="IconStar"
						className={`w-6 h-6 ${star <= value ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground hover:text-yellow-500"}`}
					/>
				</button>
			))}
		</div>
	);
}
