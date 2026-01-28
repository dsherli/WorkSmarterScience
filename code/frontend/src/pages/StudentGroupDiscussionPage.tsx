import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchWithAuth, groupPromptsApi, type GroupAIPrompt, type StudentGroupInfo } from "../api/groups";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Separator } from "../components/ui/separator";
import {
    Send,
    MessageCircle,
    Users,
    Lightbulb,
    RefreshCw,
    ArrowLeft,
    Clock,
    CheckCircle2,
    Circle,
    Sparkles,
    Brain,
    Target,
    HelpCircle,
} from "lucide-react";

// Types
interface GroupMember {
    id: string;
    name: string;
    avatar: string;
    isOnline: boolean;
}

interface DiscussionMessage {
    id: string;
    promptId: number;
    studentId: string;
    studentName: string;
    text: string;
    timestamp: Date;
    isMe: boolean;
}

interface GroupData {
    id: string;
    name: string;
    members: GroupMember[];
    summary?: string;
}

// Prompt type icons and colors
const promptTypeConfig = {
    follow_up: { 
        icon: MessageCircle, 
        color: "bg-blue-100 text-blue-700 border-blue-200",
        label: "Follow-Up",
        gradient: "from-blue-500 to-cyan-500"
    },
    reflection: { 
        icon: Brain, 
        color: "bg-purple-100 text-purple-700 border-purple-200",
        label: "Reflection",
        gradient: "from-purple-500 to-pink-500"
    },
    extension: { 
        icon: Target, 
        color: "bg-green-100 text-green-700 border-green-200",
        label: "Extension",
        gradient: "from-green-500 to-emerald-500"
    },
    check_in: { 
        icon: HelpCircle, 
        color: "bg-orange-100 text-orange-700 border-orange-200",
        label: "Check-In",
        gradient: "from-orange-500 to-amber-500"
    },
};

// Avatar emojis for students
const studentAvatars = ["👨‍🎓", "👩‍🎓", "🧑‍🎓", "👦", "👧", "🧒", "👨‍💻", "👩‍💻"];

// Avatar colors for consistent student display
const avatarColors = [
    "bg-gradient-to-br from-blue-400 to-blue-600",
    "bg-gradient-to-br from-pink-400 to-pink-600",
    "bg-gradient-to-br from-purple-400 to-purple-600",
    "bg-gradient-to-br from-green-400 to-green-600",
    "bg-gradient-to-br from-yellow-400 to-yellow-600",
    "bg-gradient-to-br from-orange-400 to-orange-600",
    "bg-gradient-to-br from-teal-400 to-teal-600",
    "bg-gradient-to-br from-indigo-400 to-indigo-600",
];

const getAvatarColor = (id: string) => {
    const hash = id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return avatarColors[hash % avatarColors.length];
};

const getAvatarEmoji = (id: string) => {
    const hash = id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return studentAvatars[hash % studentAvatars.length];
};

export default function StudentGroupDiscussionPage() {
    const { assignmentId } = useParams<{ assignmentId: string }>();
    const navigate = useNavigate();

    // User state
    const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
    
    // Group state
    const [group, setGroup] = useState<GroupData | null>(null);
    const [prompts, setPrompts] = useState<GroupAIPrompt[]>([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<string>("");
    
    // Discussion state
    const [activePromptId, setActivePromptId] = useState<number | null>(null);
    const [messages, setMessages] = useState<Map<number, DiscussionMessage[]>>(new Map());
    const [newMessage, setNewMessage] = useState("");
    const [completedPrompts, setCompletedPrompts] = useState<Set<number>>(new Set());
    
    // Refresh state
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const previousGroupId = useRef<string | null>(null);

    // Fetch current user
    useEffect(() => {
        fetchWithAuth("/auth/user/")
            .then((user) => {
                setCurrentUser({
                    id: user.id.toString(),
                    name: user.username || user.first_name || "Student",
                });
            })
            .catch(console.error);
    }, []);

    // Fetch group info including prompts from the new API endpoint
    const fetchData = async () => {
        if (!assignmentId) return;
        
        try {
            setIsRefreshing(true);
            
            // Use the new combined endpoint that returns group info + prompts
            const groupInfo: StudentGroupInfo = await groupPromptsApi.getStudentGroupInfo(assignmentId);
            
            // Set group data
            const groupData: GroupData = {
                id: groupInfo.group.id.toString(),
                name: groupInfo.group.label,
                members: groupInfo.members.map(m => ({
                    id: m.id.toString(),
                    name: m.name || m.username,
                    avatar: getAvatarEmoji(m.id.toString()),
                    isOnline: true, // Could be enhanced with real presence tracking
                })),
                summary: groupInfo.summary,
            };
            
            // Check if group changed
            if (previousGroupId.current && previousGroupId.current !== groupData.id) {
                // Group changed! Clear old data
                setMessages(new Map());
                setCompletedPrompts(new Set());
                setActivePromptId(null);
            }
            
            previousGroupId.current = groupData.id;
            setGroup(groupData);
            setPrompts(groupInfo.prompts);
            setSummary(groupInfo.summary || "");
            
            if (groupInfo.prompts.length > 0 && activePromptId === null) {
                setActivePromptId(groupInfo.prompts[0].id);
            }
            
            setLastRefresh(new Date());
        } catch (err) {
            console.error("Failed to fetch group info:", err);
            // Fallback: try fetching just prompts
            try {
                const promptsData = await groupPromptsApi.getStudentPrompts(assignmentId);
                setPrompts(promptsData);
                if (promptsData.length > 0 && activePromptId === null) {
                    setActivePromptId(promptsData[0].id);
                }
            } catch (fallbackErr) {
                console.error("Failed to fetch prompts:", fallbackErr);
            }
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (currentUser) {
            fetchData();
        }
    }, [assignmentId, currentUser]);

    // Poll for updates every 15 seconds
    useEffect(() => {
        if (!currentUser) return;
        
        const interval = setInterval(() => {
            fetchData();
        }, 15000);
        
        return () => clearInterval(interval);
    }, [assignmentId, currentUser]);

    // Handle sending a message
    const handleSendMessage = () => {
        if (!newMessage.trim() || !activePromptId || !currentUser) return;

        const message: DiscussionMessage = {
            id: `msg-${Date.now()}`,
            promptId: activePromptId,
            studentId: currentUser.id,
            studentName: currentUser.name,
            text: newMessage.trim(),
            timestamp: new Date(),
            isMe: true,
        };

        setMessages((prev) => {
            const updated = new Map(prev);
            const existing = updated.get(activePromptId) || [];
            updated.set(activePromptId, [...existing, message]);
            return updated;
        });

        setNewMessage("");
        
        // TODO: Send to backend
        // groupsApi.sendDiscussionMessage(activePromptId, newMessage);
    };

    // Handle marking prompt as discussed
    const handleMarkComplete = (promptId: number) => {
        setCompletedPrompts((prev) => {
            const updated = new Set(prev);
            if (updated.has(promptId)) {
                updated.delete(promptId);
            } else {
                updated.add(promptId);
            }
            return updated;
        });
    };

    // Get prompt config
    const getPromptConfig = (type: GroupAIPrompt['prompt_type']) => {
        return promptTypeConfig[type] || promptTypeConfig.follow_up;
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading discussion questions...</p>
                </div>
            </div>
        );
    }

    // No prompts available
    if (prompts.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
                <div className="max-w-2xl mx-auto">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    
                    <Card className="text-center py-12">
                        <CardContent>
                            <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-gray-700 mb-2">
                                No Discussion Questions Yet
                            </h2>
                            <p className="text-gray-500 mb-4">
                                Your teacher hasn't generated discussion questions for your group yet.
                                Check back soon!
                            </p>
                            <Button onClick={fetchData} variant="outline">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Refresh
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const activePrompt = prompts.find(p => p.id === activePromptId);
    const progress = (completedPrompts.size / prompts.length) * 100;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            {/* Header */}
            <div className="bg-white border-b shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                            <div>
                                <h1 className="text-lg font-semibold text-gray-900">
                                    Group Discussion
                                </h1>
                                <p className="text-sm text-gray-500">
                                    {group?.name || "Loading..."}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Progress indicator */}
                            <div className="hidden sm:flex items-center gap-2">
                                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <span className="text-xs text-gray-500">
                                    {completedPrompts.size}/{prompts.length} discussed
                                </span>
                            </div>

                            {/* Refresh button */}
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={fetchData}
                                disabled={isRefreshing}
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Left Sidebar - Group Members */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-20">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Users className="w-4 h-4 text-teal-600" />
                                    Your Group
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="space-y-3">
                                    {group?.members.map((member) => (
                                        <div 
                                            key={member.id}
                                            className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                                                member.id === currentUser?.id 
                                                    ? 'bg-teal-50 border border-teal-200' 
                                                    : 'hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="relative">
                                                <div className={`w-10 h-10 rounded-full ${getAvatarColor(member.id)} flex items-center justify-center text-white text-lg shadow-sm`}>
                                                    {member.avatar}
                                                </div>
                                                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                                                    member.isOnline ? 'bg-green-500' : 'bg-gray-300'
                                                }`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {member.name}
                                                    {member.id === currentUser?.id && (
                                                        <span className="text-teal-600 ml-1">(You)</span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {member.isOnline ? 'Online' : 'Offline'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Separator className="my-4" />

                                {/* Last refresh time */}
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <Clock className="w-3 h-3" />
                                    Updated {lastRefresh.toLocaleTimeString()}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content - Questions & Discussion */}
                    <div className="lg:col-span-3">
                        {/* AI Generated Banner */}
                        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl p-4 mb-6 text-white">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="font-semibold">AI-Generated Discussion Questions</h2>
                                    <p className="text-sm text-white/80 mt-1">
                                        These questions were created based on your group's previous answers 
                                        to help deepen your understanding. Discuss each question with your team!
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* AI Summary of Group Responses */}
                        {summary && (
                            <Card className="mb-6 border-indigo-200 bg-indigo-50/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-indigo-700">
                                        <Brain className="w-4 h-4" />
                                        AI Analysis of Your Group's Work
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        {summary}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Questions Tabs */}
                        <Tabs 
                            value={activePromptId?.toString() || ""} 
                            onValueChange={(v: string) => setActivePromptId(parseInt(v))}
                            className="space-y-4"
                        >
                            <TabsList className="w-full flex-wrap h-auto p-1 bg-white border shadow-sm">
                                {prompts.map((prompt, index) => {
                                    const config = getPromptConfig(prompt.prompt_type);
                                    const Icon = config.icon;
                                    const isCompleted = completedPrompts.has(prompt.id);
                                    
                                    return (
                                        <TabsTrigger 
                                            key={prompt.id}
                                            value={prompt.id.toString()}
                                            className="flex-1 min-w-[120px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
                                        >
                                            <div className="flex items-center gap-2">
                                                {isCompleted ? (
                                                    <CheckCircle2 className="w-4 h-4 text-green-500 data-[state=active]:text-white" />
                                                ) : (
                                                    <Icon className="w-4 h-4" />
                                                )}
                                                <span>Q{index + 1}</span>
                                            </div>
                                        </TabsTrigger>
                                    );
                                })}
                            </TabsList>

                            {prompts.map((prompt) => {
                                const config = getPromptConfig(prompt.prompt_type);
                                const Icon = config.icon;
                                const promptMessages = messages.get(prompt.id) || [];
                                const isCompleted = completedPrompts.has(prompt.id);

                                return (
                                    <TabsContent key={prompt.id} value={prompt.id.toString()}>
                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                            {/* Question Card */}
                                            <Card className="h-fit">
                                                <CardHeader>
                                                    <div className="flex items-start justify-between">
                                                        <Badge className={`${config.color} border`}>
                                                            <Icon className="w-3 h-3 mr-1" />
                                                            {config.label}
                                                        </Badge>
                                                        <Button
                                                            variant={isCompleted ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => handleMarkComplete(prompt.id)}
                                                            className={isCompleted ? "bg-green-500 hover:bg-green-600" : ""}
                                                        >
                                                            {isCompleted ? (
                                                                <>
                                                                    <CheckCircle2 className="w-4 h-4 mr-1" />
                                                                    Discussed
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Circle className="w-4 h-4 mr-1" />
                                                                    Mark Discussed
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                    <CardTitle className="text-lg mt-3">
                                                        Question {prompt.prompt_order}
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className={`p-4 rounded-lg bg-gradient-to-r ${config.gradient} bg-opacity-10`}>
                                                        <p className="text-gray-800 leading-relaxed text-lg">
                                                            {prompt.prompt_text}
                                                        </p>
                                                    </div>

                                                    {/* Tips section */}
                                                    <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                                        <div className="flex items-start gap-2">
                                                            <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                                            <div>
                                                                <p className="text-sm font-medium text-amber-800">Discussion Tips</p>
                                                                <ul className="text-xs text-amber-700 mt-1 space-y-1">
                                                                    <li>• Share your initial thoughts first</li>
                                                                    <li>• Build on others' ideas</li>
                                                                    <li>• Ask clarifying questions</li>
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            {/* Discussion Card */}
                                            <Card className="flex flex-col h-[500px]">
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                                        <MessageCircle className="w-4 h-4 text-teal-600" />
                                                        Group Discussion
                                                        {promptMessages.length > 0 && (
                                                            <Badge variant="secondary" className="ml-auto">
                                                                {promptMessages.length} messages
                                                            </Badge>
                                                        )}
                                                    </CardTitle>
                                                </CardHeader>
                                                
                                                <ScrollArea className="flex-1 px-4">
                                                    {promptMessages.length === 0 ? (
                                                        <div className="h-full flex items-center justify-center text-center py-12">
                                                            <div>
                                                                <MessageCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                                                <p className="text-gray-500 text-sm">
                                                                    No messages yet.
                                                                </p>
                                                                <p className="text-gray-400 text-xs mt-1">
                                                                    Start the discussion!
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4 pb-4">
                                                            {promptMessages.map((msg) => (
                                                                <div
                                                                    key={msg.id}
                                                                    className={`flex gap-3 ${msg.isMe ? 'flex-row-reverse' : ''}`}
                                                                >
                                                                    <div className={`w-8 h-8 rounded-full ${getAvatarColor(msg.studentId)} flex items-center justify-center text-white text-sm flex-shrink-0`}>
                                                                        {msg.studentName.charAt(0)}
                                                                    </div>
                                                                    <div className={`max-w-[75%] ${msg.isMe ? 'text-right' : ''}`}>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            {!msg.isMe && (
                                                                                <span className="text-xs font-medium text-gray-700">
                                                                                    {msg.studentName}
                                                                                </span>
                                                                            )}
                                                                            <span className="text-xs text-gray-400">
                                                                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                            </span>
                                                                            {msg.isMe && (
                                                                                <span className="text-xs font-medium text-teal-600">
                                                                                    You
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className={`p-3 rounded-2xl text-sm ${
                                                                            msg.isMe 
                                                                                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-tr-sm' 
                                                                                : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                                                                        }`}>
                                                                            {msg.text}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </ScrollArea>

                                                {/* Message Input */}
                                                <div className="p-4 border-t bg-gray-50">
                                                    <div className="flex gap-2">
                                                        <Input
                                                            placeholder="Share your thoughts..."
                                                            value={newMessage}
                                                            onChange={(e) => setNewMessage(e.target.value)}
                                                            onKeyPress={(e) => {
                                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                                    e.preventDefault();
                                                                    handleSendMessage();
                                                                }
                                                            }}
                                                            className="flex-1"
                                                        />
                                                        <Button 
                                                            onClick={handleSendMessage}
                                                            disabled={!newMessage.trim()}
                                                            className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                                                        >
                                                            <Send className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Card>
                                        </div>
                                    </TabsContent>
                                );
                            })}
                        </Tabs>

                        {/* Bottom Navigation */}
                        <div className="mt-6 flex items-center justify-between">
                            <Button
                                variant="outline"
                                disabled={!activePrompt || prompts.indexOf(activePrompt) === 0}
                                onClick={() => {
                                    if (activePrompt) {
                                        const currentIndex = prompts.indexOf(activePrompt);
                                        if (currentIndex > 0) {
                                            setActivePromptId(prompts[currentIndex - 1].id);
                                        }
                                    }
                                }}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Previous Question
                            </Button>

                            <div className="flex items-center gap-2">
                                {prompts.map((prompt) => (
                                    <button
                                        key={prompt.id}
                                        onClick={() => setActivePromptId(prompt.id)}
                                        className={`w-3 h-3 rounded-full transition-all ${
                                            prompt.id === activePromptId
                                                ? 'bg-teal-500 scale-125'
                                                : completedPrompts.has(prompt.id)
                                                    ? 'bg-green-400'
                                                    : 'bg-gray-300 hover:bg-gray-400'
                                        }`}
                                    />
                                ))}
                            </div>

                            <Button
                                disabled={!activePrompt || prompts.indexOf(activePrompt) === prompts.length - 1}
                                onClick={() => {
                                    if (activePrompt) {
                                        const currentIndex = prompts.indexOf(activePrompt);
                                        if (currentIndex < prompts.length - 1) {
                                            setActivePromptId(prompts[currentIndex + 1].id);
                                        }
                                    }
                                }}
                                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                            >
                                Next Question
                                <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
