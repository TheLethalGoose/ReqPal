import {Database} from "@/types/supabase.ts";
import {LearningGoal} from "@/types/learningGoals.ts";

export type LessonDTO = Database["public"]["Tables"]["lessons"]["Row"];
export type QuestionDTO = Database["public"]["Tables"]["questions"]["Row"];

export type Question = {
    [key: string]: any;
    uuid: string;
    question: string | null;
    options: string[] | null;
    hint: string | null;
    points?: number | null;

    solution?: any | null;
    position?: number | null;
    type?: string | null;
}

export type Lesson = {
    lessonDTO: LessonDTO,
    isFinished: boolean,
    isStarted: boolean,
    hasSavedProgress: boolean,
    userScore: number,
    learningGoal: LearningGoal | null

    creatorAvatar?: string,
    creatorUsername?: string,
}

export type LessonForm = {
    uuid: string;
    title: string;
    description: string;
    questions: Question[];
    learningGoalId: string | null;
}

export type LessonAnswer = {
    uuid: string,
    answers: any[]
}

export type UserAnswer = {
    question_id: string,
    answer: string[]
}

export type UserResult = {
    result: { score: number, results: any, isCorrect: boolean }
}

export type LessonStatistic = {
    finished: boolean,
    user_points: number
}