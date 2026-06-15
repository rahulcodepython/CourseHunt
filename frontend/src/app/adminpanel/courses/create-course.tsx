"use client";

import { Icon } from "@/components/icon";


import LoadingButton from "@/components/loading-button"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import { useCreateCourseMutation } from "@/hooks/api"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import React from 'react'
import { toast } from "sonner"

const CreateCourse = () => {
    const [title, setTitle] = React.useState('')
    const { isPending, createCourse } = useCreateCourseMutation();
    const [isOpen, setIsOpen] = React.useState(false);

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error("Title is required");
            return;
        }

        const data = await createCourse({ title });
        if (data) {
            setTitle('');
            setIsOpen(false);
            toast.success("Course created successfully");
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className='cursor-pointer'>
                    <Icon name="IconPlus" className="w-5 h-5" />
                    Add Course
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        Create Course
                    </DialogTitle>
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
    )
}

export default CreateCourse
