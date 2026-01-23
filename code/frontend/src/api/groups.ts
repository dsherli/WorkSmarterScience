const BASE_URL = "/api";

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem("access_token");
    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const response = await fetch(`${BASE_URL}${url}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }

    if (response.status === 204) return null;
    return response.json();
}

export interface Table {
    id: string | number;
    name: string;
    position: { x: number; y: number; rotation: number };
    students: any[]; // Defined in page components, can be refined
    messages: any[];
}

export const groupsApi = {
    // Get all tables for a classroom
    getTables: (classroomId: string | number) =>
        fetchWithAuth(`/classrooms/${classroomId}/tables/`),

    // Create tables (bulk)
    createTables: (classroomId: string | number, tables: any[]) =>
        fetchWithAuth(`/classrooms/${classroomId}/tables/`, {
            method: "POST",
            body: JSON.stringify(tables),
        }),

    // Replace tables (query param)
    replaceTables: (classroomId: string | number, tables: any[]) =>
        fetchWithAuth(`/classrooms/${classroomId}/tables/?replace=true`, {
            method: "POST",
            body: JSON.stringify(tables),
        }),

    // Update single table
    updateTable: (tableId: string | number, data: any) =>
        fetchWithAuth(`/classrooms/tables/${tableId}/`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),

    // Assign student
    assignStudent: (classroomId: string | number, studentId: string | number, tableId: string | number | null) =>
        fetchWithAuth(`/classrooms/${classroomId}/tables/assign/`, {
            method: "POST",
            body: JSON.stringify({ student_id: studentId, table_id: tableId }),
        }),
    // Backend url: path("tables/assign/", AssignStudentToTableView.as_view(), name="table-assign"),
    // Wait, AssignStudentToTableView takes classroom_id in URL? 
    // No, I defined `path("tables/assign/", AssignStudentToTableView.as_view(), name="table-assign")` which uses POST data.
    // Actually, let's double check backend implementation of AssignStudentToTableView.
    // It uses `request.data.get("student_id")` and `request.data.get("table_id")` but it calls `get_object_or_404(Classroom, pk=classroom_id)`.
    // WAIT. `classrooms/views.py`: `def post(self, request, classroom_id):`
    // But the URL I registered is `path("tables/assign/", ...)` ??
    // It DOES NOT capture classroom_id.
    // I made a mistake in urls.py or views.py signature.

    // Messages
    getMessages: (tableId: string | number) =>
        fetchWithAuth(`/classrooms/tables/${tableId}/messages/`),

    sendMessage: (tableId: string | number, text: string) =>
        fetchWithAuth(`/classrooms/tables/${tableId}/messages/`, {
            method: "POST",
            body: JSON.stringify({ content: text }),
        }),
};
