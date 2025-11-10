type Student = {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
};

type Enrollment = {
    id: number;
    joined_at: string;
    student: Student;
};

type Classroom = {
    id: number;
    name: string;
    code: string;
    status: string;
    grade_level: string;
    term: string | null;
    description: string | null;
    enrollments: Enrollment[];
};

export type { Student, Enrollment, Classroom };
