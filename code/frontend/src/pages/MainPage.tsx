import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { BookOpen, Users, MessageSquare, Award, Sparkles, GraduationCap } from "lucide-react";

interface MainPageProps {
    onSignUp: () => void;
    onSignIn: () => void;
}

export function MainPage({ onSignUp, onSignIn }: MainPageProps) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50">
            {/* Navigation */}
            <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-lg flex items-center justify-center">
                                <GraduationCap className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl">WorkSmartScience</span>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="ghost">About</Button>
                            <Button onClick={onSignIn} className="bg-teal-600 hover:bg-teal-700 text-white">Sign In</Button>
                            <Button onClick={onSignUp} className="bg-teal-600 hover:bg-teal-700 text-white">Sign Up</Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-100 text-teal-700 rounded-full mb-6">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm">AI-Powered Learning Platform</span>
                    </div>
                    <h1 className="text-5xl mb-6">
                        Transform Your Science Classroom with AI
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                        Empower students with intelligent hints, automated feedback, and collaborative learning experiences.
                        Make teaching more effective and learning more engaging.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Button size="lg" onClick={onSignUp} className="text-lg px-8 bg-teal-600 hover:bg-teal-700">
                            Get Started Free
                        </Button>
                        <Button size="lg" variant="outline" className="bg-white text-lg px-8 border-teal-600 text-teal-700 hover:bg-teal-50">
                            Watch Demo
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
                    <Card className="p-6 text-center border-none shadow-lg">
                        <div className="text-3xl mb-2">10K+</div>
                        <div className="text-gray-600">Active Students</div>
                    </Card>
                    <Card className="p-6 text-center border-none shadow-lg">
                        <div className="text-3xl mb-2">500+</div>
                        <div className="text-gray-600">Teachers</div>
                    </Card>
                    <Card className="p-6 text-center border-none shadow-lg">
                        <div className="text-3xl mb-2">95%</div>
                        <div className="text-gray-600">Satisfaction Rate</div>
                    </Card>
                </div>
            </section>

            {/* Features Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center mb-16">
                    <h2 className="text-4xl mb-4">Powerful Features for Modern Learning</h2>
                    <p className="text-xl text-gray-600">Everything you need to create an engaging science classroom</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<BookOpen className="w-8 h-8" />}
                        title="Interactive Activities"
                        description="Distribute engaging science activities and track student progress in real-time."
                        color="from-teal-500 to-cyan-600"
                    />
                    <FeatureCard
                        icon={<Sparkles className="w-8 h-8" />}
                        title="AI-Powered Hints"
                        description="Students get intelligent hints that guide them towards solutions without giving away answers."
                        color="from-cyan-500 to-blue-600"
                    />
                    <FeatureCard
                        icon={<Award className="w-8 h-8" />}
                        title="Automated Grading"
                        description="AI provides instant feedback on student work, which teachers can review and customize."
                        color="from-emerald-500 to-teal-600"
                    />
                    <FeatureCard
                        icon={<MessageSquare className="w-8 h-8" />}
                        title="Smart Discussions"
                        description="AI groups students with similar answers to facilitate meaningful peer discussions."
                        color="from-blue-500 to-cyan-600"
                    />
                    <FeatureCard
                        icon={<Users className="w-8 h-8" />}
                        title="Classroom Management"
                        description="Easily organize students into classrooms and manage multiple classes effortlessly."
                        color="from-teal-500 to-emerald-600"
                    />
                    <FeatureCard
                        icon={<GraduationCap className="w-8 h-8" />}
                        title="Progress Tracking"
                        description="Monitor student performance and identify areas where they need additional support."
                        color="from-cyan-500 to-teal-600"
                    />
                </div>
            </section>

            {/* CTA Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <Card className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-12 text-center border-none">
                    <h2 className="text-4xl mb-4">Ready to Transform Your Classroom?</h2>
                    <p className="text-xl mb-8 text-teal-100">Join thousands of teachers using AI to enhance student learning</p>
                    <Button size="lg" variant="secondary" className="text-lg px-8 bg-white text-teal-700 hover:bg-teal-50" onClick={onSignUp}>
                        Start Free Trial
                    </Button>
                </Card>
            </section>

            {/* Footer */}
            <footer className="border-t bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center text-gray-600">
                        <p>© 2025 WorkSmartScience. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    color: string;
}

function FeatureCard({ icon, title, description, color }: FeatureCardProps) {
    return (
        <Card className="p-6 hover:shadow-xl transition-shadow border-none shadow-md">
            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white mb-4`}>
                {icon}
            </div>
            <h3 className="text-xl mb-3">{title}</h3>
            <p className="text-gray-600">{description}</p>
        </Card>
    );
}
