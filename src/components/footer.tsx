import { BookOpen } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-muted py-12">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <BookOpen className="h-8 w-8 text-primary" />
                            <span className="text-2xl font-bold">CourseHunt</span>
                        </div>
                        <p className="text-muted-foreground">Empowering learners worldwide with high-quality online education.</p>
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-semibold">Courses</h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <div>Web Development</div>
                            <div>Data Science</div>
                            <div>Mobile Development</div>
                            <div>Design</div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-semibold">Company</h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <div>About Us</div>
                            <div>Careers</div>
                            <div>Press</div>
                            <div>Contact</div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-semibold">Support</h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <div>Help Center</div>
                            <div>Community</div>
                            <div>Privacy Policy</div>
                            <div>Terms of Service</div>
                        </div>
                    </div>
                </div>
                <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
                    <p>&copy; 2024 CourseHunt. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}