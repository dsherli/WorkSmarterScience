import React, { useState } from "react";
import { groupPromptsApi, type GroupInfo, type GenerateAllQuestionsResult } from "../api/groups";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { 
    Sparkles, 
    Loader2, 
    CheckCircle2, 
    XCircle, 
    RefreshCw,
    Users,
    MessageCircle,
    ChevronDown,
    ChevronUp,
    Brain,
    Zap,
} from "lucide-react";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "./ui/collapsible";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { toast } from "sonner";

interface TeacherAIQuestionsGeneratorProps {
    assignmentId: string | number;
    onQuestionsGenerated?: () => void;
}

export function TeacherAIQuestionsGenerator({ 
    assignmentId, 
    onQuestionsGenerated 
}: TeacherAIQuestionsGeneratorProps) {
    const [groups, setGroups] = useState<GroupInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [generatingGroupId, setGeneratingGroupId] = useState<number | null>(null);
    const [numQuestions, setNumQuestions] = useState<string>("4");
    const [results, setResults] = useState<GenerateAllQuestionsResult | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

    // Fetch groups for this assignment
    const fetchGroups = async () => {
        setLoading(true);
        try {
            const data = await groupPromptsApi.getTeacherGroups(assignmentId);
            setGroups(data);
        } catch (error) {
            console.error("Failed to fetch groups:", error);
            toast.error("Failed to load groups");
        } finally {
            setLoading(false);
        }
    };

    // Generate questions for all groups
    const handleGenerateAll = async () => {
        setGenerating(true);
        setResults(null);
        try {
            const result = await groupPromptsApi.generateAllGroupQuestions(
                assignmentId, 
                parseInt(numQuestions)
            );
            setResults(result);
            
            if (result.successful > 0) {
                toast.success(`Generated questions for ${result.successful} group(s)`);
                onQuestionsGenerated?.();
                fetchGroups(); // Refresh to show new prompts
            }
            
            if (result.failed > 0) {
                toast.warning(`${result.failed} group(s) failed - check if students have submitted`);
            }
        } catch (error) {
            console.error("Failed to generate questions:", error);
            toast.error("Failed to generate questions");
        } finally {
            setGenerating(false);
        }
    };

    // Generate questions for a single group
    const handleGenerateSingle = async (groupId: number) => {
        setGeneratingGroupId(groupId);
        try {
            await groupPromptsApi.generateGroupQuestions(groupId, parseInt(numQuestions));
            toast.success("Questions generated successfully!");
            onQuestionsGenerated?.();
            fetchGroups(); // Refresh
        } catch (error) {
            console.error("Failed to generate questions:", error);
            toast.error("Failed to generate questions - ensure students have submitted");
        } finally {
            setGeneratingGroupId(null);
        }
    };

    const toggleGroupExpanded = (groupId: number) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupId)) {
                newSet.delete(groupId);
            } else {
                newSet.add(groupId);
            }
            return newSet;
        });
    };

    // Get the latest prompts for a group
    const getLatestPrompts = (group: GroupInfo) => {
        if (!group.ai_runs || group.ai_runs.length === 0) return [];
        const latestRun = group.ai_runs[0]; // Already sorted by -created_at
        return latestRun.prompts || [];
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">AI Discussion Questions</CardTitle>
                            <CardDescription>
                                Generate follow-up questions based on student responses
                            </CardDescription>
                        </div>
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchGroups}
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4" />
                        )}
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Controls */}
                <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">
                            Questions per group:
                        </label>
                        <Select value={numQuestions} onValueChange={setNumQuestions}>
                            <SelectTrigger className="w-20">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="2">2</SelectItem>
                                <SelectItem value="3">3</SelectItem>
                                <SelectItem value="4">4</SelectItem>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="6">6</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        onClick={handleGenerateAll}
                        disabled={generating || groups.length === 0}
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Zap className="w-4 h-4 mr-2" />
                                Generate for All Groups
                            </>
                        )}
                    </Button>
                </div>

                {/* Results Summary */}
                {results && (
                    <div className={`p-4 rounded-lg ${
                        results.failed === 0 
                            ? 'bg-green-50 border border-green-200' 
                            : 'bg-amber-50 border border-amber-200'
                    }`}>
                        <div className="flex items-center gap-4">
                            {results.failed === 0 ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                                <XCircle className="w-5 h-5 text-amber-600" />
                            )}
                            <div>
                                <p className="font-medium">
                                    Generated questions for {results.successful} of {results.total_groups} groups
                                </p>
                                {results.failed > 0 && (
                                    <p className="text-sm text-amber-700 mt-1">
                                        {results.failed} group(s) failed - students may need to submit their work first
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Groups List */}
                {groups.length === 0 && !loading ? (
                    <div className="text-center py-8">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No groups found for this assignment</p>
                        <Button variant="link" onClick={fetchGroups} className="mt-2">
                            Load Groups
                        </Button>
                    </div>
                ) : (
                    <ScrollArea className="max-h-[500px]">
                        <div className="space-y-3">
                            {groups.map((group) => {
                                const prompts = getLatestPrompts(group);
                                const hasPrompts = prompts.length > 0;
                                const isExpanded = expandedGroups.has(group.id);

                                return (
                                    <Collapsible
                                        key={group.id}
                                        open={isExpanded}
                                        onOpenChange={() => toggleGroupExpanded(group.id)}
                                    >
                                        <div className="border rounded-lg overflow-hidden">
                                            <div className="flex items-center justify-between p-3 bg-white hover:bg-gray-50">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                        hasPrompts 
                                                            ? 'bg-green-100 text-green-600' 
                                                            : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                        {hasPrompts ? (
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        ) : (
                                                            <Users className="w-4 h-4" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{group.label}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {hasPrompts 
                                                                ? `${prompts.length} questions generated` 
                                                                : 'No questions yet'
                                                            }
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant={hasPrompts ? "outline" : "default"}
                                                        onClick={(e: React.MouseEvent) => {
                                                            e.stopPropagation();
                                                            handleGenerateSingle(group.id);
                                                        }}
                                                        disabled={generatingGroupId === group.id}
                                                        className={!hasPrompts ? "bg-indigo-500 hover:bg-indigo-600" : ""}
                                                    >
                                                        {generatingGroupId === group.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Sparkles className="w-4 h-4 mr-1" />
                                                                {hasPrompts ? 'Regenerate' : 'Generate'}
                                                            </>
                                                        )}
                                                    </Button>

                                                    {hasPrompts && (
                                                        <CollapsibleTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                {isExpanded ? (
                                                                    <ChevronUp className="w-4 h-4" />
                                                                ) : (
                                                                    <ChevronDown className="w-4 h-4" />
                                                                )}
                                                            </Button>
                                                        </CollapsibleTrigger>
                                                    )}
                                                </div>
                                            </div>

                                            <CollapsibleContent>
                                                {hasPrompts && (
                                                    <div className="p-3 pt-0 space-y-2 border-t bg-gray-50">
                                                        {/* Summary */}
                                                        {group.ai_runs[0]?.synthesized_summary_text && (
                                                            <div className="p-2 bg-indigo-50 rounded text-sm text-indigo-700 mb-3">
                                                                <div className="flex items-center gap-1 font-medium mb-1">
                                                                    <Brain className="w-3 h-3" />
                                                                    AI Summary
                                                                </div>
                                                                {group.ai_runs[0].synthesized_summary_text}
                                                            </div>
                                                        )}

                                                        {prompts.map((prompt, idx) => (
                                                            <div 
                                                                key={prompt.id}
                                                                className="p-2 bg-white rounded border"
                                                            >
                                                                <div className="flex items-start gap-2">
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        Q{idx + 1}
                                                                    </Badge>
                                                                    <Badge variant="outline" className="text-xs capitalize">
                                                                        {prompt.prompt_type.replace('_', ' ')}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-sm mt-2 text-gray-700">
                                                                    {prompt.prompt_text}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </CollapsibleContent>
                                        </div>
                                    </Collapsible>
                                );
                            })}
                        </div>
                    </ScrollArea>
                )}

                {/* Info Box */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                        <MessageCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-700">
                            <p className="font-medium">How it works:</p>
                            <ul className="mt-1 space-y-1 list-disc list-inside text-blue-600">
                                <li>AI analyzes each group's submitted answers</li>
                                <li>Questions are tailored based on common themes and gaps</li>
                                <li>Students see questions when accessing their group discussion</li>
                                <li>Regenerating replaces existing questions with new ones</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
