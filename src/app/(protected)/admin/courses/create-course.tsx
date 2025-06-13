"use client"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useApiHandler } from "@/hooks/useApiHandler"
import { CourseCardType } from "@/types/course.type"
import { Plus } from "lucide-react"
import React from 'react'
import { toast } from "sonner"

const CreateCourse = ({ onCreate }: { onCreate: (course: CourseCardType) => void }) => {
    const [title, setTitle] = React.useState('')
    const { isLoading, callApi } = useApiHandler();
    const [isOpen, setIsOpen] = React.useState(false);

    const createCourse = async () => {
        if (!title) {
            toast.error("Title is required");
            return;
        }

        const response = await fetch('/api/courses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            toast.error(errorData.error || "Failed to create course");
            return null;
        }

        return await response.json();
    }

    const handleSave = async () => {
        const data = await callApi(createCourse, () => {
            setTitle('');
            setIsOpen(false);
        });
        if (data) {
            toast.success(data.message || "Course created successfully");
            onCreate(data.course);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className='cursor-pointer'>
                    <Plus className="w-4 h-4 mr-2" />
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
                    <div className="grid gap-3">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <LoadingButton isLoading={isLoading} title="Saving changes...">
                        <Button onClick={handleSave}>Save changes</Button>
                    </LoadingButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default CreateCourse