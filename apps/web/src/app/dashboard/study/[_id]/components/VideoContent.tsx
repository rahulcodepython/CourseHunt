export function VideoContent({ videoUrl }: { videoUrl: string }) {
	return (
		<div className="relative aspect-video bg-black flex items-center justify-center">
			<video src={videoUrl} controls className="w-full h-full object-contain" />
		</div>
	);
}
