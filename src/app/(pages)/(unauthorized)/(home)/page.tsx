import { getBaseUrl } from "@/action"
import CourseCard from "@/components/course-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CourseCardType } from "@/types/course.type"
import { ArrowRight, Award, BookOpen, CheckCircle, Download, Play, Star, Users } from "lucide-react"
import { cookies } from "next/headers"
import Image from "next/image"
import Link from "next/link"


const testimonials = [
    {
        name: "Alex Rodriguez",
        role: "Software Developer",
        content: "CourseHunt transformed my career. The courses are well-structured and the instructors are top-notch!",
        rating: 5,
        avatar: "/placeholder.svg?height=60&width=60",
    },
    {
        name: "Emily Davis",
        role: "Data Analyst",
        content: "I landed my dream job after completing the Python course. Highly recommended!",
        rating: 5,
        avatar: "/placeholder.svg?height=60&width=60",
    },
    {
        name: "David Wilson",
        role: "Freelancer",
        content: "The practical projects helped me build a strong portfolio. Amazing platform!",
        rating: 5,
        avatar: "/placeholder.svg?height=60&width=60",
    },
]

const brands = [
    { name: "Google", logo: "/placeholder.svg?height=60&width=120" },
    { name: "Microsoft", logo: "/placeholder.svg?height=60&width=120" },
    { name: "Amazon", logo: "/placeholder.svg?height=60&width=120" },
    { name: "Meta", logo: "/placeholder.svg?height=60&width=120" },
    { name: "Netflix", logo: "/placeholder.svg?height=60&width=120" },
]

export default async function Home() {
    const baseurl = await getBaseUrl()
    const cookieStore = await cookies();

    const response = await fetch(`${baseurl}/api/courses/all`, {
        headers: {
            'Content-Type': 'application/json',
            'Cookie': cookieStore.getAll().map(cookie => `${cookie.name}=${cookie.value}`).join('; ')
        },
    })

    const courses: CourseCardType[] = response.ok ? await response.json() : []

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                                    Master New Skills with
                                    <span className="text-primary"> CourseHunt</span>
                                </h1>
                                <p className="text-xl text-muted-foreground">
                                    Join thousands of learners and advance your career with our expert-led courses. Learn at your own
                                    pace, anywhere, anytime.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button size="lg" className="text-lg px-8 text-white bg-green-600 hover:bg-green-700 cursor-pointer">
                                    Start Learning Today
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </div>
                            <div className="flex items-center gap-8 pt-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold">50K+</div>
                                    <div className="text-sm text-muted-foreground">Students</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">200+</div>
                                    <div className="text-sm text-muted-foreground">Courses</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">4.8★</div>
                                    <div className="text-sm text-muted-foreground">Rating</div>
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <Image
                                src="/placeholder.svg?height=500&width=600"
                                alt="Learning illustration"
                                width={600}
                                height={500}
                                className="rounded-2xl shadow-2xl"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center space-y-4 mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold">About CourseHunt</h2>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                            We're on a mission to democratize education and make high-quality learning accessible to everyone,
                            everywhere.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <h3 className="text-2xl font-bold">Empowering Learners Worldwide</h3>
                            <p className="text-muted-foreground">
                                Founded in 2020, CourseHunt has grown to become one of the leading online learning platforms. We partner
                                with industry experts and top educators to bring you courses that are practical, up-to-date, and
                                designed to help you achieve your goals.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    <span>Expert-curated curriculum</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    <span>Hands-on projects and assignments</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    <span>24/7 community support</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    <span>Lifetime access to course materials</span>
                                </div>
                            </div>
                        </div>
                        <div className="w-full flex justify-end">
                            <Image
                                src="/placeholder.svg?height=400&width=500"
                                alt="About us"
                                width={500}
                                height={400}
                                className="rounded-lg"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Goals Section */}
            <section className="py-20 bg-muted/50">
                <div className="container mx-auto px-4">
                    <div className="text-center space-y-4 mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold">Our Goals</h2>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                            We're committed to transforming lives through education and creating opportunities for everyone.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <Card className="text-center">
                            <CardHeader>
                                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                                <CardTitle>Accessibility</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Make quality education accessible to learners from all backgrounds and locations worldwide.
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="text-center">
                            <CardHeader>
                                <Award className="h-12 w-12 text-primary mx-auto mb-4" />
                                <CardTitle>Excellence</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Maintain the highest standards in course quality, instructor expertise, and learning outcomes.
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="text-center">
                            <CardHeader>
                                <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
                                <CardTitle>Innovation</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Continuously innovate our platform and teaching methods to enhance the learning experience.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Key Features */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center space-y-4 mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold">Why Choose CourseHunt?</h2>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                            Discover the features that make our platform the best choice for your learning journey.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="text-center space-y-4">
                            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                                <Play className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold">HD Video Content</h3>
                            <p className="text-muted-foreground">
                                Crystal clear video lectures with professional production quality.
                            </p>
                        </div>
                        <div className="text-center space-y-4">
                            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                                <Download className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold">Offline Access</h3>
                            <p className="text-muted-foreground">Download courses and learn offline, anywhere, anytime.</p>
                        </div>
                        <div className="text-center space-y-4">
                            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                                <Award className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold">Certificates</h3>
                            <p className="text-muted-foreground">Earn industry-recognized certificates upon course completion.</p>
                        </div>
                        <div className="text-center space-y-4">
                            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                                <Users className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold">Community</h3>
                            <p className="text-muted-foreground">Join a vibrant community of learners and instructors.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Courses */}
            <section className="py-20 bg-muted/50">
                <div className="container mx-auto px-4">
                    <div className="text-center space-y-4 mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold">Featured Courses</h2>
                        <p className="text-xl text-muted-foreground">
                            Discover our most popular courses chosen by thousands of students.
                        </p>
                    </div>
                    {
                        courses.length === 0 ? <div className="text-center py-2">
                            <h3 className="text-xl font-semibold">No courses found</h3>
                        </div> : <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {
                                courses.map((course, index) => (
                                    <CourseCard
                                        key={index}
                                        courseData={course}
                                    />
                                ))
                            }
                        </div>
                    }
                    <div className="text-center mt-12">
                        <Link href="/courses">
                            <Button size="lg" variant="outline" className="cursor-pointer">
                                View All Courses
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center space-y-4 mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold">What Our Students Say</h2>
                        <p className="text-xl text-muted-foreground">
                            Don't just take our word for it. Here's what our students have to say.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <Card key={index}>
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <Image
                                            src={testimonial.avatar || "/placeholder.svg"}
                                            alt={testimonial.name}
                                            width={60}
                                            height={60}
                                            className="rounded-full"
                                        />
                                        <div>
                                            <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                                            <CardDescription>{testimonial.role}</CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        ))}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">"{testimonial.content}"</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Brand Collaboration */}
            <section className="py-20 bg-muted/50">
                <div className="container mx-auto px-4">
                    <div className="text-center space-y-4 mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold">Trusted by Industry Leaders</h2>
                        <p className="text-xl text-muted-foreground">Our graduates work at top companies worldwide.</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
                        {brands.map((brand, index) => (
                            <Image
                                key={index}
                                src={brand.logo || "/placeholder.svg"}
                                alt={brand.name}
                                width={120}
                                height={60}
                                className="grayscale hover:grayscale-0 transition-all"
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Form */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="max-w-2xl mx-auto">
                        <div className="text-center space-y-4 mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold">Get in Touch</h2>
                            <p className="text-xl text-muted-foreground">
                                Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                            </p>
                        </div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Contact Us</CardTitle>
                                <CardDescription>Fill out the form below and we'll get back to you within 24 hours.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name</Label>
                                        <Input id="name" placeholder="Your full name" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" type="email" placeholder="your@email.com" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="subject">Subject</Label>
                                    <Input id="subject" placeholder="What's this about?" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="message">Message</Label>
                                    <Textarea id="message" placeholder="Tell us more..." rows={5} />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full">Send Message</Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </section>
        </div>
    )
}
