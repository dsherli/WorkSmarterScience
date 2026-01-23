import React, { useState, useRef, useEffect } from "react";
import { groupsApi } from "../api/groups";

// fetchWithAuth helper for fetching classrooms
const fetchWithAuth = async (url: string) => {
    const token = localStorage.getItem("access_token");
    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
    };
    const res = await fetch(`/api${url}`, { headers });
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
};
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog";
import {
    Send,
    Grid3x3,
    Maximize2,
    ZoomIn,
    ZoomOut,
    Minimize2,
    Users,
} from "lucide-react";

interface Student {
    id: string;
    name: string;
    initials: string;
    tableId: string | null;
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
}

export default function TeacherGroupPage() {
    // Restored State
    const [selectedClassroom, setSelectedClassroom] = useState<string>("");
    const [numberOfTables, setNumberOfTables] = useState("");
    const [tables, setTables] = useState<Table[]>([]);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [newMessage, setNewMessage] = useState("");
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [assigningTable, setAssigningTable] = useState<Table | null>(null);
    const classroomRef = useRef<HTMLDivElement>(null);

    // New API State
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [allStudents, setAllStudents] = useState<Student[]>([]);

    // Fetch classrooms on mount
    useEffect(() => {
        fetchWithAuth("/classrooms/")
            .then((data) => {
                setClassrooms(data);
                if (data.length > 0 && !selectedClassroom) {
                    setSelectedClassroom(data[0].id.toString());
                }
            })
            .catch(console.error);
    }, []);

    // Fetch tables and students when classroom changes
    useEffect(() => {
        if (!selectedClassroom) return;

        // Fetch classroom details for students
        fetchWithAuth(`/classrooms/${selectedClassroom}/`)
            .then((data) => {
                const students = data.enrollments.map((en: any) => ({
                    id: en.student.id.toString(),
                    name: en.student.username, // or full name
                    initials: en.student.username.substring(0, 2).toUpperCase(),
                    tableId: en.assigned_table ? en.assigned_table.toString() : null, // Backend needs to send assigned_table in EnrollmentSerializer?
                    avatar: "👨‍🎓",
                    color: "from-blue-500 to-blue-600"
                }));
                // Wait, EnrollmentSerializer in backend does NOT include assigned_table yet?
                // I added it to MODEL, but did I add it to SERIALIZER?
                // Let's check serializer later. Assuming it's there or I need to add it.
                setAllStudents(students);
            });

        // Fetch tables
        groupsApi.getTables(selectedClassroom)
            .then((data) => {
                // Transform backend table to frontend shape
                const formattedTables = data.map((t: any) => ({
                    id: t.id.toString(),
                    name: t.name,
                    topic: "",
                    students: t.students.map((s: any) => ({
                        id: s.id.toString(),
                        name: s.name,
                        initials: s.initials,
                        avatar: s.avatar,
                        color: s.color
                    })),
                    messages: t.messages.map((m: any) => ({
                        id: m.id.toString(),
                        studentId: m.sender.toString(),
                        studentName: m.sender_name,
                        text: m.content,
                        timestamp: new Date(m.timestamp)
                    })),
                    position: { x: t.x_position, y: t.y_position, rotation: t.rotation }
                }));
                setTables(formattedTables);
            });

    }, [selectedClassroom]);

    // Polling for messages if selectedTable
    useEffect(() => {
        if (!selectedTable) return;

        const interval = setInterval(() => {
            groupsApi.getMessages(selectedTable.id)
                .then((msgs) => {
                    // Update messages for this table
                    setTables(prev => prev.map(t => {
                        if (t.id === selectedTable.id) {
                            const newMsgs = msgs.map((m: any) => ({
                                id: m.id.toString(),
                                studentId: m.sender.toString(),
                                studentName: m.sender_name,
                                text: m.content,
                                timestamp: new Date(m.timestamp)
                            }));
                            return { ...t, messages: newMsgs };
                        }
                        return t;
                    }));

                    // Also update selectedTable state
                    setSelectedTable(prev => {
                        if (prev && prev.id === selectedTable.id) {
                            const newMsgs = msgs.map((m: any) => ({
                                id: m.id.toString(),
                                studentId: m.sender.toString(),
                                studentName: m.sender_name,
                                text: m.content,
                                timestamp: new Date(m.timestamp)
                            }));
                            return { ...prev, messages: newMsgs };
                        }
                        return prev;
                    });
                });
        }, 5000);

        return () => clearInterval(interval);
    }, [selectedTable]);


    useEffect(() => {
        setTables([]);
        setSelectedTable(null);
        setNumberOfTables("");
        setZoom(1);
        setPan({ x: 0, y: 0 });
    }, [selectedClassroom]);

    const generateClassroomLayout = (count: number): Table[] => {
        const tables: Table[] = [];

        const startX = 280;
        const startY = 300;
        const spacingX = 380;
        const spacingY = 350;

        for (let i = 0; i < count && i < 12; i++) {
            const col = i % 3;
            const row = Math.floor(i / 3);

            tables.push({
                id: `table-${i + 1}`,
                name: `Table ${i + 1}`,
                topic: "",
                students: [],
                messages: [],
                position: {
                    x: startX + col * spacingX,
                    y: startY + row * spacingY,
                    rotation: 0,
                },
            });
        }

        return tables;
    };

    const handleCreateTables = () => {
        const num = parseInt(numberOfTables);
        if (num > 0 && num <= 12 && selectedClassroom) {
            const newTables = generateClassroomLayout(num);

            // Call API
            groupsApi.replaceTables(selectedClassroom, newTables)
                .then((createdTables: any[]) => {
                    const formattedTables = createdTables.map((t: any) => ({
                        id: t.id.toString(),
                        name: t.name,
                        topic: "",
                        students: [],
                        messages: [],
                        position: { x: t.x_position, y: t.y_position, rotation: t.rotation }
                    }));
                    setTables(formattedTables);

                    // Auto zoom logic (same as before)
                    let autoZoom = 1;
                    if (num >= 10) autoZoom = 0.6;
                    else if (num >= 7) autoZoom = 0.75;
                    else if (num >= 4) autoZoom = 0.9;
                    setZoom(autoZoom);
                    // Reset pan/zoom
                    setTimeout(() => {
                        if (classroomRef.current) {
                            const containerWidth = classroomRef.current.clientWidth;
                            const containerHeight = classroomRef.current.clientHeight;
                            const contentWidth = 1600;
                            const contentHeight = 1700;
                            const centerX = (containerWidth - contentWidth * autoZoom) / 2;
                            const centerY = (containerHeight - contentHeight * autoZoom) / 2;
                            setPan({ x: Math.max(0, centerX), y: Math.max(0, centerY) });
                        }
                    }, 0);
                });
        }
    };

    const handleAssignStudent = (studentId: string, tableId: string) => {
        if (!selectedClassroom) return;

        groupsApi.assignStudent(selectedClassroom, studentId, tableId)
            .then(() => {
                // Determine previous table to remove student from locally, or just refresh?
                // Refreshing tables is safer but slower.
                // Optimistic update:

                setTables((prevTables) =>
                    prevTables.map((table) => {
                        const isInThisTable = table.students.some((s) => s.id === studentId);
                        if (isInThisTable && table.id !== tableId) {
                            return { ...table, students: table.students.filter((s) => s.id !== studentId) };
                        }
                        if (table.id === tableId && !table.students.some(s => s.id === studentId)) {
                            const student = allStudents.find(s => s.id === studentId);
                            return { ...table, students: [...table.students, student!] };
                        }
                        return table;
                    })
                );

                // Refresh from server to be sure
                groupsApi.getTables(selectedClassroom)
                    .then((data) => {
                        const formattedTables = data.map((t: any) => ({
                            id: t.id.toString(),
                            name: t.name,
                            topic: "",
                            students: t.students.map((s: any) => ({
                                id: s.id.toString(),
                                name: s.name,
                                initials: s.initials,
                                avatar: s.avatar,
                                color: s.color
                            })),
                            messages: t.messages.map((m: any) => ({
                                id: m.id.toString(),
                                studentId: m.sender.toString(),
                                studentName: m.sender_name,
                                text: m.content,
                                timestamp: new Date(m.timestamp)
                            })),
                            position: { x: t.x_position, y: t.y_position, rotation: t.rotation }
                        }));
                        setTables(formattedTables);
                    });
            });
    };


    const handleSendMessage = () => {
        if (!selectedTable || !newMessage.trim()) return;

        groupsApi.sendMessage(selectedTable.id, newMessage)
            .then(() => {
                setNewMessage("");
                // Message list updates via polling or we could manually append
                // Let's manually append for immediate feedback
                /* 
                const message: Message = {
                    id: `temp-${Date.now()}`,
                    studentId: "teacher", 
                    studentName: "Teacher",
                    text: newMessage,
                    timestamp: new Date(),
                };
                */
                // Refetch messages immediately
                groupsApi.getMessages(selectedTable.id).then(msgs => {
                    const newMsgs = msgs.map((m: any) => ({
                        id: m.id.toString(),
                        studentId: m.sender.toString(),
                        studentName: m.sender_name,
                        text: m.content,
                        timestamp: new Date(m.timestamp)
                    }));
                    setTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, messages: newMsgs } : t));
                    setSelectedTable(prev => prev ? { ...prev, messages: newMsgs } : null);
                });
            });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0) {
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

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col bg-gradient-to-br from-slate-100 to-slate-200">
            <div className="bg-white border-b p-3 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        <div>
                            <h1 className="text-xl">Virtual Classroom</h1>
                        </div>

                        <div className="flex items-center gap-2">
                            <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
                                <SelectTrigger className="h-8 w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {classrooms.map((classroom) => (
                                        <SelectItem key={classroom.id} value={classroom.id}>
                                            {classroom.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Input
                                type="number"
                                min="1"
                                max="12"
                                placeholder="# Tables"
                                value={numberOfTables}
                                onChange={(e) => setNumberOfTables(e.target.value)}
                                className="h-8 w-24"
                            />

                            <Button
                                onClick={handleCreateTables}
                                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 h-8"
                                size="sm"
                            >
                                <Grid3x3 className="w-4 h-4 mr-1" />
                                Create
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-teal-600 border-teal-300">
                            {tables.length} tables
                        </Badge>
                        <Badge variant="outline" className="text-blue-600 border-blue-300">
                            {allStudents.length} students
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 relative overflow-hidden">
                    {tables.length === 0 ? (
                        <div
                            className="h-full flex items-center justify-center"
                            style={{
                                background: `linear-gradient(135deg, #3d2817 0 percent, #5a3825 100 percent)`,
                            }}
                        >
                            <Card className="p-12 max-w-md bg-white/95 backdrop-blur">
                                <div className="text-center space-y-4">
                                    <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto">
                                        <Grid3x3 className="w-10 h-10 text-teal-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl mb-2">Create Your Virtual Classroom</h3>
                                        <p className="text-gray-600 text-sm">
                                            Enter the number of tables and click Create to set up your space
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    ) : (
                        <>
                            <div
                                ref={classroomRef}
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
                                        transition: isPanning ? "none" : "transform 0.3s ease-out",
                                    }}
                                >
                                    <div className="relative" style={{ width: "1500px", height: "1600px", margin: "50px" }}>
                                        <div className="absolute inset-0">
                                            {tables.map((table) => (
                                                <VirtualTable
                                                    key={table.id}
                                                    table={table}
                                                    isSelected={selectedTable?.id === table.id}
                                                    onClick={() => {
                                                        setSelectedTable(table);
                                                        setAssigningTable(table);
                                                        setAssignDialogOpen(true);
                                                    }}
                                                    onAssignStudent={handleAssignStudent}
                                                    allStudents={allStudents}
                                                    tables={tables}
                                                    assignDialogOpen={assignDialogOpen && assigningTable?.id === table.id}
                                                    setAssignDialogOpen={setAssignDialogOpen}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute bottom-6 left-6 flex flex-col gap-2 bg-white rounded-lg shadow-lg p-2">
                                <Button size="sm" variant="outline" onClick={handleZoomIn}>
                                    <ZoomIn className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleResetView}>
                                    <Minimize2 className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleZoomOut}>
                                    <ZoomOut className="w-4 h-4" />
                                </Button>
                            </div>
                        </>
                    )}
                </div>

                <div className="bg-white border-l shadow-lg flex flex-col w-80">
                    {selectedTable ? (
                        <div className="flex flex-col h-full">
                            <div className="p-4 border-b bg-gradient-to-r from-teal-50 to-cyan-50">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-lg">{selectedTable.name}</h3>
                                    <Button size="sm" variant="ghost" onClick={() => setSelectedTable(null)}>
                                        <Maximize2 className="w-4 h-4" />
                                    </Button>
                                </div>
                                <p className="text-sm text-gray-600">
                                    {selectedTable.students.length} participants
                                </p>
                            </div>

                            <div className="p-4 border-b">
                                <Label className="text-xs text-gray-600 mb-3 block">Participants</Label>
                                <div className="space-y-2">
                                    {selectedTable.students.map((student) => (
                                        <div key={student.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                            <div
                                                className={`w-10 h-10 rounded-full bg-gradient-to-br ${student.color} flex items-center justify-center text-xl shadow-md`}
                                            >
                                                {student.avatar}
                                            </div>
                                            <span className="text-sm flex-1">{student.name}</span>
                                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                                        </div>
                                    ))}
                                    {selectedTable.students.length === 0 && (
                                        <p className="text-sm text-gray-500 text-center py-4">No students assigned yet</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col min-h-0">
                                <div className="p-4 pb-2">
                                    <Label className="text-xs text-gray-600">Discussion</Label>
                                </div>

                                <ScrollArea className="flex-1 px-4">
                                    {selectedTable.messages.length === 0 ? (
                                        <p className="text-sm text-gray-500 text-center py-8">No messages yet</p>
                                    ) : (
                                        <div className="space-y-3 pb-4">
                                            {selectedTable.messages.map((message) => (
                                                <div key={message.id} className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-teal-600">{message.studentName}</span>
                                                        <span className="text-xs text-gray-400">
                                                            {message.timestamp.toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                    <div className="bg-gray-50 p-2 rounded-lg text-sm">
                                                        {message.text}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </div>

                            <div className="p-4 border-t bg-gray-50">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Monitor or join discussion..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
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
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="p-4 border-b">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg">All Students</h3>
                                    <Badge variant="outline" className="text-teal-600 border-teal-300">
                                        {allStudents.length}
                                    </Badge>
                                </div>
                            </div>

                            <ScrollArea className="flex-1 p-4">
                                <div className="space-y-2">
                                    {allStudents.map((student) => {
                                        const assignedTable = tables.find((table) =>
                                            table.students.some((s) => s.id === student.id)
                                        );

                                        return (
                                            <div
                                                key={student.id}
                                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                            >
                                                <div
                                                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${student.color} flex items-center justify-center text-xl shadow-md`}
                                                >
                                                    {student.avatar}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm">{student.name}</div>
                                                    {assignedTable && (
                                                        <div className="text-xs text-gray-500">
                                                            {assignedTable.name}
                                                        </div>
                                                    )}
                                                </div>
                                                {assignedTable ? (
                                                    <Badge
                                                        variant="secondary"
                                                        className="bg-teal-100 text-teal-700 border-teal-200 text-xs"
                                                    >
                                                        Assigned
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-xs">
                                                        Unassigned
                                                    </Badge>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

interface VirtualTableProps {
    table: Table;
    isSelected: boolean;
    onClick: () => void;
    onAssignStudent: (studentId: string, tableId: string) => void;
    allStudents: Student[];
    tables: Table[];
    assignDialogOpen: boolean;
    setAssignDialogOpen: (open: boolean) => void;
}

function VirtualTable({
    table,
    isSelected,
    onClick,
    onAssignStudent,
    allStudents,
    tables,
    assignDialogOpen,
    setAssignDialogOpen,
}: VirtualTableProps) {
    return (
        <div
            className="absolute group"
            style={{
                left: `${table.position.x}px`,
                top: `${table.position.y}px`,
                width: "220px",
                height: "220px",
            }}
        >
            <div
                className={`relative cursor-pointer transition-all ${isSelected ? "scale-110 z-20" : "hover:scale-105 z-10"
                    }`}
                onClick={onClick}
            >
                <div className="relative w-full h-full rounded-full transition-all bg-gradient-to-br from-amber-700 via-amber-600 to-amber-800 shadow-lg">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="px-5 py-2 rounded-full text-base backdrop-blur-sm transition-all bg-amber-950/50 text-amber-100">
                            {table.name}
                        </div>
                    </div>

                    <div className="absolute bottom-5 left-5">
                        <Badge
                            variant="secondary"
                            className="text-sm shadow-md bg-white/95 text-amber-900"
                        >
                            <Users className="w-4 h-4 mr-1" />
                            {table.students.length}
                        </Badge>
                    </div>
                </div>

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

                        return (
                            <div key={student.id} className="absolute pointer-events-auto" style={position}>
                                <div className="relative group/student">
                                    <div
                                        className={`w-16 h-16 rounded-full bg-gradient-to-br ${student.color} flex items-center justify-center text-3xl ring-3 ring-white shadow-lg hover:ring-teal-400 transition-all hover:scale-110 cursor-pointer`}
                                    >
                                        {student.avatar}
                                    </div>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/student:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                        {student.name}
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

            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Students to {table.name}</DialogTitle>
                        <DialogDescription>
                            Click on students to assign them to this table
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="h-64">
                        <div className="space-y-2">
                            {allStudents.map((student) => {
                                const isInThisTable = table.students.some((s) => s.id === student.id);
                                const isInAnotherTable = tables.some(
                                    (t) =>
                                        t.id !== table.id &&
                                        t.students.some((s) => s.id === student.id)
                                );

                                return (
                                    <div
                                        key={student.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isInThisTable
                                            ? "bg-teal-100 border border-teal-300"
                                            : isInAnotherTable
                                                ? "bg-gray-100 text-gray-500"
                                                : "hover:bg-gray-50 border border-transparent"
                                            }`}
                                        onClick={() => onAssignStudent(student.id, table.id)}
                                    >
                                        <div
                                            className={`w-10 h-10 rounded-full bg-gradient-to-br ${student.color} flex items-center justify-center text-xl shadow-md`}
                                        >
                                            {student.avatar}
                                        </div>
                                        <span className="flex-1">{student.name}</span>

                                        {isInThisTable && (
                                            <Badge className="bg-teal-600">At Table</Badge>
                                        )}

                                        {isInAnotherTable && (
                                            <Badge variant="secondary">Other Table</Badge>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
}
