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

// Group AI Prompts API
export interface GroupAIPrompt {
    id: number;
    prompt_order: number;
    prompt_text: string;
    prompt_type: 'follow_up' | 'reflection' | 'extension' | 'check_in';
    created_at: string;
}

export interface GroupAIRun {
    id: number;
    activity_group: number;
    run_reason: string;
    synthesized_summary_text: string;
    model_name: string;
    released_at: string | null;
    created_at: string;
    prompts: GroupAIPrompt[];
}

export interface GroupInfo {
    id: number;
    label: string;
    archived_at: string | null;
    ai_runs: GroupAIRun[];
}

export interface GroupMember {
    id: number;
    username: string;
    name: string;
    is_me: boolean;
}

export interface StudentGroupInfo {
    group: {
        id: number;
        label: string;
    };
    members: GroupMember[];
    has_prompts: boolean;
    is_released: boolean;
    summary: string;
    prompts: GroupAIPrompt[];
    last_updated: string | null;
}

export interface GenerateQuestionsResult {
    id: number;
    activity_group: number;
    run_reason: string;
    synthesized_summary_text: string;
    model_name: string;
    created_at: string;
    prompts: GroupAIPrompt[];
}

export interface GenerateAllQuestionsResult {
    total_groups: number;
    successful: number;
    failed: number;
    results: Array<{
        group_id: number;
        group_label: string;
        success: boolean;
        data?: GenerateQuestionsResult;
        error?: string;
    }>;
}

export interface ReleaseQuestionsResult {
    success: boolean;
    message: string;
    released_count: number;
    is_released: boolean;
}

export interface UpdatePromptResult {
    id: number;
    prompt_order: number;
    prompt_text: string;
    prompt_type: 'follow_up' | 'reflection' | 'extension' | 'check_in';
    created_at: string;
}

export const groupPromptsApi = {
    // Get current prompts for student's group in an assignment
    getStudentPrompts: (assignmentId: string | number): Promise<GroupAIPrompt[]> =>
        fetchWithAuth(`/activity-groups/assignments/${assignmentId}/prompts/`),

    // Get student's group info including members and prompts
    getStudentGroupInfo: (assignmentId: string | number): Promise<StudentGroupInfo> =>
        fetchWithAuth(`/activity-groups/assignments/${assignmentId}/my-group/`),

    // Get all groups with prompts for teacher view
    getTeacherGroups: (assignmentId: string | number): Promise<GroupInfo[]> =>
        fetchWithAuth(`/activity-groups/assignments/${assignmentId}/groups/`),

    // Generate discussion questions for a specific group (teacher only)
    generateGroupQuestions: (groupId: string | number, numQuestions: number = 4): Promise<GenerateQuestionsResult> =>
        fetchWithAuth(`/activity-groups/groups/${groupId}/generate-questions/`, {
            method: "POST",
            body: JSON.stringify({ num_questions: numQuestions }),
        }),

    // Generate discussion questions for all groups in an assignment (teacher only)
    generateAllGroupQuestions: (assignmentId: string | number, numQuestions: number = 4): Promise<GenerateAllQuestionsResult> =>
        fetchWithAuth(`/activity-groups/assignments/${assignmentId}/generate-all/`, {
            method: "POST",
            body: JSON.stringify({ num_questions: numQuestions }),
        }),

    // Release or un-release questions to students (teacher only)
    releaseQuestions: (assignmentId: string | number, release: boolean = true): Promise<ReleaseQuestionsResult> =>
        fetchWithAuth(`/activity-groups/assignments/${assignmentId}/release-questions/`, {
            method: "POST",
            body: JSON.stringify({ release }),
        }),

    // Update a specific prompt (teacher only)
    updatePrompt: (promptId: string | number, data: { prompt_text?: string; prompt_type?: string }): Promise<UpdatePromptResult> =>
        fetchWithAuth(`/activity-groups/prompts/${promptId}/`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),

    // Delete a specific prompt (teacher only)
    deletePrompt: (promptId: string | number): Promise<null> =>
        fetchWithAuth(`/activity-groups/prompts/${promptId}/`, {
            method: "DELETE",
        }),

    // Auto-group students using AI
    autoGroupStudents: (assignmentId: string | number, strategy: string = 'heterogeneous', groupSize: number = 4): Promise<{ success: boolean; groups_created: number; strategy: string }> =>
        fetchWithAuth(`/activity-groups/assignments/${assignmentId}/auto-group/`, {
            method: "POST",
            body: JSON.stringify({ strategy, group_size: groupSize }),
        }),
};

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

    // Summarize discussion
    summarizeTableDiscussion: (tableId: string | number): Promise<{ success: boolean; summary: any; table_id: number }> =>
        fetchWithAuth(`/activity-groups/tables/${tableId}/summarize/`, {
            method: "POST",
        }),
};
