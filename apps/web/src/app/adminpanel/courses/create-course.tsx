"use client";

import { Icon } from "@package/components/icon";
import LoadingButton from "@package/components/loading-button";
import { Button } from "@package/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@package/ui/dialog";
import { useCreateCourseMutation } from "@package/query-hooks/courses.api";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import React from "react";
import { toast } from "sonner";

const CreateCourse = () => {
	const [title, setTitle] = React.useState("");
	const { isPending, execute } = useCreateCourseMutation();
	const [isOpen, setIsOpen] = React.useState(false);

	const handleSave = async () => {
		if (!title.trim()) {
			toast.error("Title is required");
			return;
		}
		const data = await execute({ title, language: "english", level: "beginner", status: "draft" });
		if (data) {
			setTitle("");
			setIsOpen(false);
			toast.success("Course created successfully");
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" className="cursor-pointer">
					<Icon name="IconPlus" className="w-5 h-5" />
					Add Course
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Create Course</DialogTitle>
				</DialogHeader>
				<div className="grid gap-4">
					<div className="grid gap-3 pt-4">
						<Label htmlFor="title">Title</Label>
						<Input id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} />
					</div>
				</div>
				<DialogFooter>
					<DialogClose asChild>
						<Button variant="outline">Cancel</Button>
					</DialogClose>
					<LoadingButton isLoading={isPending} title="Saving changes...">
						<Button onClick={handleSave}>Save changes</Button>
					</LoadingButton>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default CreateCourse;
