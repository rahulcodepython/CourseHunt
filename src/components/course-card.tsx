import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { CourseCardType } from "@/types/course.type"
import { Clock, Star, Users } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function CourseCard({ courseData, edit = null, study = null }: {
    courseData: CourseCardType,
    edit?: null | React.ReactNode,
    study?: null | React.ReactNode
}) {
    return (
        <div className="w-full max-w-sm mx-auto h-full hover:scale-105 transition-transform duration-300">
            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 pt-0 pb-1 h-full justify-between">
                <CardHeader className="p-0">
                    <div className="relative">
                        <Image
                            src={courseData.imageUrl.length !== 0 ? courseData.imageUrl : "/placeholder.svg"}
                            alt={courseData.title}
                            width={400}
                            height={200}
                            className="w-full h-48 object-cover"
                        />
                        <Badge className="absolute top-3 left-3 bg-green-600 hover:bg-green-700 text-white">
                            {courseData.category}
                        </Badge>
                        <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-semibold">
                            {courseData.discount}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-4">
                    <div className="space-y-4">
                        <Link href={`/courses/${courseData._id}`} className="font-bold text-lg leading-tight line-clamp-2">{courseData.title}</Link>

                        <p className="text-sm text-muted-foreground line-clamp-3">{courseData.description}</p>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{courseData.duration}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>{courseData.students} students</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`w-4 h-4 ${star <= Math.round(courseData.rating)
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "fill-gray-200 text-gray-200"
                                            }`}
                                    />
                                ))}
                            </div>
                            <span className="text-sm font-medium">{courseData.rating}</span>
                            <span className="text-sm text-muted-foreground">({courseData.reviews} reviews)</span>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="p-4 pt-0">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-green-600">${courseData.price}</span>
                            <span className="text-sm text-muted-foreground line-through">${courseData.originalPrice}</span>
                        </div>
                        {
                            edit ? edit : study ? study : <Button className="bg-green-600 hover:bg-green-700 text-white cursor-pointer">
                                Enroll Now
                            </Button>
                        }
                    </div>
                </CardFooter>
            </Card>
        </div>
    );

}
