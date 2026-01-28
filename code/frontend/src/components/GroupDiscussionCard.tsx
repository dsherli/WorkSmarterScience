import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { groupPromptsApi, type GroupAIPrompt } from "../api/groups";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { 
    MessageCircle, 
    Sparkles, 
    ArrowRight,
    Users,
    ChevronRight
} from "lucide-react";

interface GroupDiscussionCardProps {
    assignmentId: string | number;
    className?: string;
}

/**
 * A card component that shows students when there are group discussion questions available.
 * Shows a preview of the questions and a link to the full discussion page.
 */
export function GroupDiscussionCard({ assignmentId, className = "" }: GroupDiscussionCardProps) {
    const [prompts, setPrompts] = useState<GroupAIPrompt[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasQuestions, setHasQuestions] = useState(false);

    useEffect(() => {
        const fetchPrompts = async () => {
            try {
                const data = await groupPromptsApi.getStudentPrompts(assignmentId);
                setPrompts(data);
                setHasQuestions(data.length > 0);
            } catch (error) {
                console.error("Failed to fetch discussion prompts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPrompts();
    }, [assignmentId]);

    if (loading) {
        return (
            <Card className={`animate-pulse ${className}`}>
                <CardContent className="p-4">
                    <div className="h-20 bg-gray-100 rounded" />
                </CardContent>
            </Card>
        );
    }

    if (!hasQuestions) {
        return null; // Don't show anything if no questions available
    }

    return (
        <Card className={`overflow-hidden border-2 border-indigo-200 ${className}`}>
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-4 text-white">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    <h3 className="font-semibold">Group Discussion Available!</h3>
                </div>
                <p className="text-sm text-white/80 mt-1">
                    AI-generated questions based on your group's work
                </p>
            </div>

            <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex -space-x-2">
                        {/* Mock group member avatars */}
                        <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white text-xs">
                            👨‍🎓
                        </div>
                        <div className="w-8 h-8 rounded-full bg-pink-500 border-2 border-white flex items-center justify-center text-white text-xs">
                            👩‍🎓
                        </div>
                        <div className="w-8 h-8 rounded-full bg-purple-500 border-2 border-white flex items-center justify-center text-white text-xs">
                            🧑‍🎓
                        </div>
                    </div>
                    <span className="text-sm text-gray-600">
                        <Users className="w-4 h-4 inline mr-1" />
                        Your group is discussing
                    </span>
                </div>

                {/* Preview first question */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <Badge variant="secondary" className="mb-2">
                        <MessageCircle className="w-3 h-3 mr-1" />
                        Question 1 of {prompts.length}
                    </Badge>
                    <p className="text-sm text-gray-700 line-clamp-2">
                        {prompts[0]?.prompt_text || "Discussion question loading..."}
                    </p>
                </div>

                <Link to={`/dashboard/group-discussion/${assignmentId}`}>
                    <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
                        Join Discussion
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}

/**
 * A minimal banner-style component for inline use
 */
interface GroupDiscussionBannerProps {
    assignmentId: string | number;
    className?: string;
}

export function GroupDiscussionBanner({ assignmentId, className = "" }: GroupDiscussionBannerProps) {
    const [hasQuestions, setHasQuestions] = useState(false);
    const [questionCount, setQuestionCount] = useState(0);

    useEffect(() => {
        const fetchPrompts = async () => {
            try {
                const data = await groupPromptsApi.getStudentPrompts(assignmentId);
                setHasQuestions(data.length > 0);
                setQuestionCount(data.length);
            } catch (error) {
                console.error("Failed to fetch discussion prompts:", error);
            }
        };

        fetchPrompts();
    }, [assignmentId]);

    if (!hasQuestions) {
        return null;
    }

    return (
        <Link 
            to={`/dashboard/group-discussion/${assignmentId}`}
            className={`block ${className}`}
        >
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg hover:from-indigo-100 hover:to-purple-100 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">Group Discussion</p>
                        <p className="text-sm text-gray-500">
                            {questionCount} questions ready for discussion
                        </p>
                    </div>
                </div>
                <ChevronRight className="w-5 h-5 text-indigo-500" />
            </div>
        </Link>
    );
}
