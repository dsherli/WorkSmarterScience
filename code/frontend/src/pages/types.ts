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

type ScienceActivitySubmission = {
    id: number;
    activity_id: number;
    student_id: number;
    teacher_id: number;
    submitted_at: string | null;
    status: string;
    score: number | null;
    feedback_overview: string | null;
    attempt_number: number;
    // Answers are now in a separate normalized table
    answers?: ActivityAnswer[];
}

type ActivityAnswer = {
    id: number;
    submission_id: number;
    question_number: number;
    question_text: string;
    student_answer: string | null;
    ai_feedback: string | null;
    teacher_feedback: string | null;
    score: number | null;
    updated_at: string;
}

export type { Student, Enrollment, Classroom, ScienceActivitySubmission, ActivityAnswer };
