import { Check, Clock, Play, Star, Users } from "lucide-react"
import Image from "next/image"

import { getBaseUrl } from "@/action"
import EnrollButton from "@/components/enroll-button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CourseSingleType } from "@/types/course.type"

export default async function CourseSingle({ params }: { params: Promise<{ _id: string }> }) {
    const baseurl = await getBaseUrl()
    const { _id } = await params;

    const response = await fetch(`${baseurl}/api/courses/single/${_id}`, {
        next: {
            revalidate: 60, // Revalidate every 60 seconds
        },
    })

    const course: CourseSingleType | null = response.ok ? await response.json() : null;

    const testimonials = [
        {
            name: "Sarah Johnson",
            role: "Frontend Developer at Google",
            content:
                "This course completely transformed my career. The instructor explains complex concepts in a way that's easy to understand, and the projects are incredibly practical.",
            avatar: "/placeholder.svg?height=40&width=40",
            rating: 5,
        },
        {
            name: "Michael Chen",
            role: "Full Stack Developer",
            content:
                "Best web development course I've ever taken. The curriculum is up-to-date and covers everything you need to know to become a professional developer.",
            avatar: "/placeholder.svg?height=40&width=40",
            rating: 5,
        },
        {
            name: "Emily Rodriguez",
            role: "Software Engineer at Microsoft",
            content:
                "The hands-on approach and real-world projects make this course stand out. I landed my dream job just 3 months after completing it!",
            avatar: "/placeholder.svg?height=40&width=40",
            rating: 5,
        },
    ]

    return (
        !course ? <div className="min-h-screen bg-background flex items-start justify-center my-12">
            <p className="text-lg text-muted-foreground">Course not found</p>
        </div> :
            <div className="min-h-screen bg-background">
                {/* Hero Section */}
                <div className="py-12">
                    <div className="container mx-auto px-4">
                        <div className="grid lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 flex flex-col">
                                <div className="mb-4">
                                    <Badge variant="secondary" className="mb-2">
                                        {course.category}
                                    </Badge>
                                    <h1 className="text-3xl md:text-4xl font-bold mb-4">{course.title}</h1>
                                    <p className="text-lg text-muted-foreground mb-6">{course.description}</p>
                                </div>

                                <div className="flex flex-wrap items-center gap-6 mb-6">
                                    <div className="flex items-center gap-1">
                                        <span className="font-semibold text-lg">{course.rating}</span>
                                        <div className="flex">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-4 h-4 ${i < Math.floor(course.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-sm text-muted-foreground">({course.reviews} reviews)</span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Users className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm">{course.students.toLocaleString()} students</span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm">{course.duration} total</span>
                                    </div>
                                </div>

                                <div className="flex-1 aspect-video">
                                    <video controls className="w-full rounded-lg h-[500px]" src={course.previewVideoUrl.url || '/demo-video.mp4'} />
                                </div>
                            </div>

                            <div className="lg:col-span-1">
                                <Card className="sticky top-4 py-0">
                                    <CardContent className="p-6">
                                        <div className="aspect-video mb-4 rounded-lg overflow-hidden">
                                            <Image
                                                src={course.imageUrl.url || "/placeholder.svg"}
                                                alt={course.title}
                                                width={400}
                                                height={225}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-3xl font-bold">₹{course.price}</span>
                                                <span className="text-lg text-muted-foreground line-through">${course.originalPrice}</span>
                                                <Badge variant="destructive">{course.discount} off</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">Limited time offer!</p>
                                        </div>

                                        <EnrollButton _id={course._id} className="w-full" />
                                        <div className="text-center text-sm text-muted-foreground">30-day money-back guarantee</div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-12">
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-12">
                            {/* About This Course */}
                            <section>
                                <h2 className="text-2xl font-bold mb-4">About This Course</h2>
                                <p className="text-muted-foreground leading-relaxed">{course.longDescription}</p>
                            </section>

                            {/* What You'll Learn */}
                            <section>
                                <h2 className="text-2xl font-bold mb-6">What You'll Learn</h2>
                                <div className="grid md:grid-cols-2 gap-3">
                                    {course.whatYouWillLearn.map((item, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                            <span className="text-sm">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Course Content */}
                            <section>
                                <h2 className="text-2xl font-bold mb-6">Course Content</h2>
                                <div className="mb-4 text-sm text-muted-foreground">
                                    {course.chaptersCount} sections •{" "}
                                    {course.lessonsCount} lectures • {course.duration}{" "}
                                    total length
                                </div>

                                <Accordion type="single" collapsible className="w-full">
                                    {course.chapters.map((chapter, chapterIndex) => (
                                        <AccordionItem key={chapterIndex} value={`chapter-${chapterIndex}`}>
                                            <AccordionTrigger className="text-left">
                                                <div className="flex justify-between items-center w-full pr-4">
                                                    <span className="font-medium">{chapter.title}</span>
                                                    <span className="text-sm text-muted-foreground">{chapter.lessons.length} lectures</span>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="space-y-2 pt-2">
                                                    {chapter.lessons.map((lesson, lessonIndex) => (
                                                        <div
                                                            key={lessonIndex}
                                                            className="flex items-center justify-between py-2 px-4 hover:bg-muted/50 rounded-md"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <Play className="w-4 h-4 text-muted-foreground" />
                                                                <span className="text-sm">{lesson.title}</span>
                                                            </div>
                                                            <span className="text-sm text-muted-foreground">{lesson.duration}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </section>

                            {/* Testimonials */}
                            <section>
                                <h2 className="text-2xl font-bold mb-6">Student Testimonials</h2>
                                <div className="space-y-6">
                                    {testimonials.map((testimonial, index) => (
                                        <Card key={index}>
                                            <CardContent className="p-6">
                                                <div className="flex items-start gap-4">
                                                    <Avatar>
                                                        <AvatarImage src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.name} />
                                                        <AvatarFallback>
                                                            {testimonial.name
                                                                .split(" ")
                                                                .map((n) => n[0])
                                                                .join("")}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <h4 className="font-semibold">{testimonial.name}</h4>
                                                            <div className="flex">
                                                                {[...Array(testimonial.rating)].map((_, i) => (
                                                                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mb-2">{testimonial.role}</p>
                                                        <p className="text-sm leading-relaxed">{testimonial.content}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </section>

                            {/* FAQ */}
                            <section>
                                <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
                                <Accordion type="single" collapsible className="w-full">
                                    {course.faq.map((faq, index) => (
                                        <AccordionItem key={index} value={`faq-${index}`}>
                                            <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                                            <AccordionContent>
                                                <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </section>
                        </div>

                        {/* Sidebar - Instructor Info */}
                        <div className="lg:col-span-1">
                            <Card className="sticky top-4">
                                <CardHeader>
                                    <CardTitle>Instructor</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4 mb-4">
                                        <Avatar className="w-16 h-16">
                                            <AvatarImage src="/placeholder.svg?height=64&width=64" alt="John Doe" />
                                            <AvatarFallback>JD</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-semibold">John Doe</h3>
                                            <p className="text-sm text-muted-foreground">Senior Full Stack Developer</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Experience:</span>
                                            <span>8+ years</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Students:</span>
                                            <span>50,000+</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Courses:</span>
                                            <span>12</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Rating:</span>
                                            <div className="flex items-center gap-1">
                                                <span>4.9</span>
                                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                                        John is a passionate educator and experienced developer who has worked with companies like Google and
                                        Microsoft. He specializes in modern web technologies and has helped thousands of students launch their
                                        careers in tech.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
    )
}
