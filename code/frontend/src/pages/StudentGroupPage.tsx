import React, { useState, useRef, useEffect } from "react";
import { groupsApi, fetchWithAuth } from "../api/groups";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
    Send,
    MessageSquare,
    ArrowRight,
    Users,
    ZoomIn,
    ZoomOut,
    Minimize2,
} from "lucide-react";

interface Student {
    id: string;
    name: string;
    initials: string;
    avatar: string;
    color: string;
}

interface Table {
    id: string;
    name: string;
    topic: string;
    students: Student[];
    messages: Message[];
    position: { x: number; y: number; rotation: number };
}

interface Message {
    id: string;
    studentId: string;
    studentName: string;
    text: string;
    timestamp: Date;
    isMe: boolean;
}

const studentAvatars = [
    { char: "👨‍🎓", color: "from-blue-500 to-blue-600" },
    { char: "👩‍🎓", color: "from-pink-500 to-pink-600" },
    { char: "🧑‍🎓", color: "from-purple-500 to-purple-600" },
    { char: "👦", color: "from-green-500 to-green-600" },
    { char: "👧", color: "from-yellow-500 to-yellow-600" },
    { char: "🧒", color: "from-orange-500 to-orange-600" },
    { char: "👨‍💻", color: "from-cyan-500 to-cyan-600" },
    { char: "👩‍💻", color: "from-rose-500 to-rose-600" },
    { char: "🧑‍💻", color: "from-indigo-500 to-indigo-600" },
    { char: "👨‍🔬", color: "from-teal-500 to-teal-600" },
];

export default function GroupDiscussionStudent() {
    const [currentClassroomId, setCurrentClassroomId] = useState<string | null>(null);
    const [currentStudentId, setCurrentStudentId] = useState<string>("");
    const [currentStudentName, setCurrentStudentName] = useState<string>("");
    const [currentStudentInitials, setCurrentStudentInitials] = useState<string>("");
    const [currentStudentAvatar, setCurrentStudentAvatar] = useState<string>("👨‍🎓");
    const [currentStudentColor, setCurrentStudentColor] = useState<string>("from-blue-500 to-blue-600");

    const userIdRef = useRef<string>("");

    // Fetch User and Classroom
    useEffect(() => {
        // Fetch User ID
        fetchWithAuth("/auth/user/")
            .then(user => {
                const userId = user.id.toString();
                userIdRef.current = userId;
                setCurrentStudentId(userId);
                setCurrentStudentName(user.username); // Or user.first_name check
                setCurrentStudentInitials(user.username.substring(0, 2).toUpperCase());

                // Fetch My Classroom (assume first enrollment)
                // Or fetch /api/classrooms/ assuming student view returns enrolled classes
                return fetchWithAuth("/classrooms/");
            })
            .then(classrooms => {
                if (classrooms && classrooms.length > 0) {
                    setCurrentClassroomId(classrooms[0].id.toString());
                }
            })
            .catch(console.error);
    }, []);

    const [tables, setTables] = useState<Table[]>([]);

    // Poll for tables (and messages)
    useEffect(() => {
        if (!currentClassroomId) return;

        const fetchTables = () => {
            groupsApi.getTables(currentClassroomId).then(data => {
                const formattedTables = data.map((t: any) => ({
                    id: t.id.toString(),
                    name: t.name,
                    topic: "",
                    students: t.students.map((s: any) => ({
                        id: s.id.toString(),
                        name: s.name,
                        initials: s.initials,
                        avatar: s.avatar, // We need to generate avatar/color securely or consistently?
                        color: s.color // Backend should provide these ideally, or use consistent hash
                    })),
                    messages: t.messages.map((m: any) => ({
                        id: m.id.toString(),
                        studentId: m.sender.toString(),
                        studentName: m.sender_name,
                        text: m.content,
                        timestamp: new Date(m.timestamp),
                        isMe: m.sender.toString() === userIdRef.current
                    })),
                    position: { x: t.x_position, y: t.y_position, rotation: t.rotation }
                }));
                setTables(formattedTables);

                // Determine current table based on where I am seated
                const myTable = formattedTables.find((t: any) => t.students.some((s: any) => s.id === userIdRef.current));
                if (myTable) {
                    setCurrentTableId(myTable.id);
                    setSelectedTable(myTable);
                } else {
                    setCurrentTableId("");
                    // Keep selection if exploring
                }
            });
        };

        fetchTables();
        const interval = setInterval(fetchTables, 3000); // Poll every 3s
        return () => clearInterval(interval);
    }, [currentClassroomId]);

    const [currentTableId, setCurrentTableId] =
        useState("");
    const [selectedTable, setSelectedTable] =
        useState<Table | null>(null);
    const [newMessage, setNewMessage] = useState("");
    const [tableToJoin, setTableToJoin] = useState<Table | null>(
        null,
    );
    const [showMoveDialog, setShowMoveDialog] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    const handleTableClick = (table: Table) => {
        if (table.id === currentTableId) {
            setSelectedTable(table);
        } else {
            setTableToJoin(table);
            setShowMoveDialog(true);
        }
    };

    const handleJoinTable = () => {
        if (!tableToJoin || !currentClassroomId || !currentStudentId) return;

        groupsApi.assignStudent(currentClassroomId, currentStudentId, tableToJoin.id)
            .then(() => {
                setShowMoveDialog(false);
                setTableToJoin(null);
                // State update happens via polling in next cycle
                setCurrentTableId(tableToJoin.id);
                setSelectedTable(tableToJoin);
            });
    };

    const handleSendMessage = () => {
        if (!selectedTable || !newMessage.trim()) return;

        groupsApi.sendMessage(selectedTable.id, newMessage)
            .then(() => {
                setNewMessage("");
                // Messages update via polling
            });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (
            e.button === 0 &&
            !(e.target as HTMLElement).closest(".student-table")
        ) {
            setIsPanning(true);
            setPanStart({
                x: e.clientX - pan.x,
                y: e.clientY - pan.y,
            });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning) {
            setPan({
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y,
            });
        }
    };

    const handleMouseUp = () => {
        setIsPanning(false);
    };

    const handleZoomIn = () => {
        setZoom((prev) => Math.min(prev + 0.2, 2));
    };

    const handleZoomOut = () => {
        setZoom((prev) => Math.max(prev - 0.2, 0.5));
    };

    const handleResetView = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    const currentTable = tables.find(
        (t) => t.id === currentTableId,
    );

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col bg-gradient-to-br from-slate-100 to-slate-200">
            {/* Header Bar */}
            <div className="bg-white border-b p-3 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl">Virtual Classroom</h1>
                        <p className="text-xs text-gray-600">
                            Biology 101 - Period 1
                        </p>
                    </div>
                    <Card className="p-2 bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
                        <div className="flex items-center gap-2">
                            <div
                                className={`w-10 h-10 rounded-full bg-gradient-to-br ${currentStudentColor} flex items-center justify-center text-2xl ring-2 ring-teal-400 shadow-md`}
                            >
                                {currentStudentAvatar}
                            </div>
                            <div>
                                <div className="text-sm">
                                    {currentStudentName}
                                </div>
                                <div className="text-xs text-teal-600">
                                    {currentTable?.name || "Not seated"}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Instructions Banner */}
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                    <p className="text-xs">
                        Click on any table to join and collaborate. Drag to
                        pan, use zoom controls to navigate.
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Virtual Classroom Space */}
                <div className="flex-1 relative overflow-hidden">
                    <div
                        className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing bg-gray-200"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        <div
                            className="relative w-full h-full"
                            style={{
                                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                                transformOrigin: "0 0",
                                transition: isPanning
                                    ? "none"
                                    : "transform 0.3s ease-out",
                            }}
                        >
                            <div
                                className="relative"
                                style={{
                                    width: "1500px",
                                    height: "1600px",
                                    margin: "50px",
                                }}
                            >
                                {/* Tables */}
                                <div className="absolute inset-0">
                                    {tables.map((table) => {
                                        const isMyTable =
                                            table.id === currentTableId;
                                        const hasUnreadMessages =
                                            table.messages.length > 0 && !isMyTable;

                                        return (
                                            <VirtualTableStudent
                                                key={table.id}
                                                table={table}
                                                isMyTable={isMyTable}
                                                hasUnreadMessages={hasUnreadMessages}
                                                currentStudentId={currentStudentId}
                                                onClick={() => handleTableClick(table)}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Zoom Controls */}
                    <div className="absolute bottom-6 left-6 flex flex-col gap-2 bg-white rounded-lg shadow-lg p-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleZoomIn}
                        >
                            <ZoomIn className="w-4 h-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleResetView}
                        >
                            <Minimize2 className="w-4 h-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleZoomOut}
                        >
                            <ZoomOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="w-80 bg-white border-l shadow-lg flex flex-col">
                    {selectedTable ? (
                        <div className="flex flex-col h-full">
                            <div
                                className={`p-4 border-b ${selectedTable.id === currentTableId
                                    ? "bg-gradient-to-r from-teal-50 to-cyan-50"
                                    : "bg-gray-50"
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-lg">
                                        {selectedTable.name}
                                    </h3>
                                    {selectedTable.id === currentTableId && (
                                        <Badge className="bg-teal-600 text-xs">
                                            You're Here
                                        </Badge>
                                    )}
                                </div>
                                {selectedTable.topic && (
                                    <p className="text-sm text-gray-600 mb-1">
                                        Topic: {selectedTable.topic}
                                    </p>
                                )}
                                <p className="text-xs text-gray-500">
                                    {selectedTable.students.length}{" "}
                                    {selectedTable.students.length === 1
                                        ? "student"
                                        : "students"}
                                </p>
                            </div>

                            <div className="p-4 border-b">
                                <Label className="text-xs text-gray-600 mb-3 block">
                                    Who's at this table
                                </Label>
                                <div className="space-y-2">
                                    {selectedTable.students.map((student) => (
                                        <div
                                            key={student.id}
                                            className={`flex items-center gap-2 p-2 rounded-lg ${student.id === currentStudentId
                                                ? "bg-teal-100 border border-teal-300"
                                                : "bg-gray-50"
                                                }`}
                                        >
                                            <div
                                                className={`w-10 h-10 rounded-full bg-gradient-to-br ${student.color} flex items-center justify-center text-xl shadow-md ${student.id === currentStudentId
                                                    ? "ring-2 ring-yellow-400"
                                                    : ""
                                                    }`}
                                            >
                                                {student.avatar}
                                            </div>
                                            <span className="text-sm flex-1">
                                                {student.name}
                                                {student.id === currentStudentId &&
                                                    " (You)"}
                                            </span>
                                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                                        </div>
                                    ))}
                                    {selectedTable.students.length === 0 && (
                                        <p className="text-sm text-gray-500 text-center py-4">
                                            Empty table - be the first to join!
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col min-h-0">
                                <div className="p-4 pb-2">
                                    <Label className="text-xs text-gray-600">
                                        Discussion
                                    </Label>
                                </div>
                                <ScrollArea className="flex-1 px-4">
                                    {selectedTable.messages.length === 0 ? (
                                        <div className="text-center py-8">
                                            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500">
                                                No messages yet.
                                                {selectedTable.id === currentTableId
                                                    ? " Start the conversation!"
                                                    : " Join this table to participate."}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 pb-4">
                                            {selectedTable.messages.map((message) => (
                                                <div
                                                    key={message.id}
                                                    className={`space-y-1 ${message.isMe
                                                        ? "text-right"
                                                        : "text-left"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2 text-xs">
                                                        {!message.isMe && (
                                                            <>
                                                                <span className="text-teal-600">
                                                                    {message.studentName}
                                                                </span>
                                                                <span className="text-gray-400">
                                                                    {message.timestamp.toLocaleTimeString()}
                                                                </span>
                                                            </>
                                                        )}
                                                        {message.isMe && (
                                                            <>
                                                                <span className="text-gray-400 ml-auto">
                                                                    {message.timestamp.toLocaleTimeString()}
                                                                </span>
                                                                <span className="text-teal-600">
                                                                    You
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                    <div
                                                        className={`inline-block p-2 rounded-lg text-sm max-w-[80%] ${message.isMe
                                                            ? "bg-teal-600 text-white"
                                                            : "bg-gray-100"
                                                            }`}
                                                    >
                                                        {message.text}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </div>

                            <div className="p-4 border-t bg-gray-50">
                                {selectedTable.id === currentTableId ? (
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Type your message..."
                                            value={newMessage}
                                            onChange={(e) =>
                                                setNewMessage(e.target.value)
                                            }
                                            onKeyPress={(e) =>
                                                e.key === "Enter" && handleSendMessage()
                                            }
                                            className="text-sm"
                                        />
                                        <Button
                                            size="icon"
                                            onClick={handleSendMessage}
                                            className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                                        >
                                            <Send className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                                        onClick={() =>
                                            handleTableClick(selectedTable)
                                        }
                                    >
                                        <ArrowRight className="w-4 h-4 mr-2" />
                                        Move to This Table
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full p-6">
                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto">
                                    <MessageSquare className="w-8 h-8 text-teal-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg mb-2">
                                        Select a Table
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Click on any table in the classroom to view
                                        or join
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Move Dialog */}
            <AlertDialog
                open={showMoveDialog}
                onOpenChange={setShowMoveDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Move to {tableToJoin?.name}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            You're currently at {currentTable?.name}. Moving
                            to {tableToJoin?.name} will take you away from
                            your current discussion.
                            {tableToJoin?.students &&
                                tableToJoin.students.length > 0 && (
                                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                        <p className="text-sm mb-2">
                                            Students at {tableToJoin.name}:
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {tableToJoin.students.map((student) => (
                                                <div
                                                    key={student.id}
                                                    className="flex items-center gap-1 text-xs bg-white p-1 pr-2 rounded-full border"
                                                >
                                                    <div
                                                        className={`w-6 h-6 rounded-full bg-gradient-to-br ${student.color} flex items-center justify-center text-sm`}
                                                    >
                                                        {student.avatar}
                                                    </div>
                                                    <span>{student.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            {tableToJoin?.students &&
                                tableToJoin.students.length === 0 && (
                                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <p className="text-sm text-blue-700">
                                            This table is empty. You'll be the first
                                            one there!
                                        </p>
                                    </div>
                                )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Stay Here</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleJoinTable}
                            className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                        >
                            Move to Table
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

interface VirtualTableStudentProps {
    table: Table;
    isMyTable: boolean;
    hasUnreadMessages: boolean;
    currentStudentId: string;
    onClick: () => void;
}

function VirtualTableStudent({
    table,
    isMyTable,
    hasUnreadMessages,
    currentStudentId,
    onClick,
}: VirtualTableStudentProps) {
    return (
        <div
            className="absolute group student-table"
            style={{
                left: `${table.position.x}px`,
                top: `${table.position.y}px`,
                width: "220px",
                height: "220px",
            }}
        >
            <div
                className={`relative cursor-pointer transition-all ${isMyTable ? "scale-115 z-20" : "hover:scale-105 z-10"
                    }`}
                onClick={onClick}
            >
                <div
                    className={`relative w-full h-full rounded-full transition-all ${isMyTable
                        ? "bg-gradient-to-br from-teal-400 via-cyan-400 to-blue-400 shadow-2xl ring-4 ring-teal-300"
                        : "bg-gradient-to-br from-amber-700 via-amber-600 to-amber-800 shadow-xl hover:shadow-2xl"
                        }`}
                    style={{
                        boxShadow: isMyTable
                            ? "0 30px 60px rgba(20, 184, 166, 0.6), inset 0 4px 15px rgba(255,255,255,0.4), 0 -10px 25px rgba(0,0,0,0.15)"
                            : "0 20px 40px rgba(120,53,15,0.5), inset 0 3px 12px rgba(255,255,255,0.3), 0 -10px 20px rgba(0,0,0,0.2)",
                        animation: isMyTable
                            ? "pulse 3s ease-in-out infinite"
                            : "none",
                    }}
                >
                    <div className="absolute inset-3 rounded-full bg-gradient-to-br from-white/25 to-transparent" />
                    <div className="absolute inset-6 rounded-full bg-gradient-to-tl from-black/15 to-transparent" />
                    <div className="absolute inset-10 rounded-full border-4 border-white/10" />
                    <div className="absolute -bottom-5 left-10 right-10 h-6 bg-black/40 rounded-full blur-2xl" />

                    <div className="absolute inset-0 flex items-center justify-center">
                        <div
                            className={`px-5 py-2 rounded-full text-base backdrop-blur-sm transition-all ${isMyTable
                                ? "bg-white/95 text-teal-700 ring-2 ring-white shadow-lg"
                                : "bg-amber-950/50 text-amber-100"
                                }`}
                        >
                            {table.name}
                            {isMyTable && (
                                <div className="text-[10px] mt-0.5">
                                    You're here! ✨
                                </div>
                            )}
                        </div>
                    </div>

                    {hasUnreadMessages && (
                        <div className="absolute top-5 right-5">
                            <div className="w-5 h-5 bg-red-500 rounded-full animate-pulse ring-2 ring-white shadow-lg" />
                        </div>
                    )}

                    {table.messages.length > 0 && isMyTable && (
                        <div className="absolute top-5 right-5">
                            <div className="w-5 h-5 bg-green-500 rounded-full animate-pulse ring-2 ring-white shadow-lg" />
                        </div>
                    )}

                    <div className="absolute bottom-5 left-5">
                        <Badge
                            variant="secondary"
                            className={`text-sm shadow-md ${isMyTable
                                ? "bg-white text-teal-700"
                                : "bg-white/95 text-amber-900"
                                }`}
                        >
                            <Users className="w-4 h-4 mr-1" />
                            {table.students.length}
                        </Badge>
                    </div>

                    {table.students.length === 0 && (
                        <div className="absolute bottom-5 right-5">
                            <Badge
                                variant="outline"
                                className="text-xs bg-white/80"
                            >
                                Empty
                            </Badge>
                        </div>
                    )}
                </div>

                {/* Students */}
                <div className="absolute inset-0 pointer-events-none">
                    {table.students.slice(0, 8).map((student, idx) => {
                        const positions = [
                            {
                                top: "-15%",
                                left: "50%",
                                transform: "translateX(-50%)",
                            },
                            { top: "7%", right: "-12%" },
                            {
                                top: "50%",
                                right: "-15%",
                                transform: "translateY(-50%)",
                            },
                            { bottom: "7%", right: "-12%" },
                            {
                                bottom: "-15%",
                                left: "50%",
                                transform: "translateX(-50%)",
                            },
                            { bottom: "7%", left: "-12%" },
                            {
                                top: "50%",
                                left: "-15%",
                                transform: "translateY(-50%)",
                            },
                            { top: "7%", left: "-12%" },
                        ];

                        const position = positions[idx % positions.length];
                        const isMe = student.id === currentStudentId;

                        return (
                            <div
                                key={student.id}
                                className="absolute"
                                style={position}
                            >
                                <div className="relative group/student">
                                    <div
                                        className={`w-16 h-16 rounded-full bg-gradient-to-br ${student.color} flex items-center justify-center text-3xl shadow-2xl hover:scale-125 transition-all cursor-pointer ${isMe
                                            ? "ring-4 ring-yellow-400 animate-bounce-slow"
                                            : "ring-3 ring-white hover:ring-teal-400"
                                            }`}
                                        style={{
                                            boxShadow:
                                                "0 10px 25px rgba(0,0,0,0.4), 0 3px 6px rgba(0,0,0,0.3)",
                                        }}
                                    >
                                        {student.avatar}
                                    </div>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/student:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                        {student.name} {isMe && "(You)"}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {table.students.length > 8 && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            <div className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center text-base text-teal-700 ring-2 ring-teal-200">
                                +{table.students.length - 8}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {!isMyTable && (
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap text-center opacity-0 group-hover:opacity-100 transition-opacity z-30">
                    <span className="text-xs text-white bg-gray-900 px-3 py-1 rounded-full shadow-lg">
                        {table.students.length === 0
                            ? "Click to join"
                            : "Move here"}
                    </span>
                </div>
            )}
        </div>
    );
}