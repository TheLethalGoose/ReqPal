import {supabase} from "@/plugins/supabase";
import {Lesson, QuestionDTO} from "@/types/lesson.types.ts";
import {Question} from "@/interfaces/Question.interfaces.ts";

class LessonServiceClass {

    public push = {
        uploadLesson: this.uploadLesson.bind(this),
    };

    public pull = {
        fetchLessons: this.fetchLessons,
        fetchLessonById: this.fetchLessonById.bind(this),
        fetchQuestionsForLesson: this.fetchQuestionsForLesson.bind(this),
        getLesson: this.getLesson.bind(this),
    };

    private async fetchLessons() {

        const {data, error} = await supabase
            .from('lessons')
            .select('*')

        if (error) throw error;

        if (data) {
            return data;
        }
    }

    private async fetchLessonById(lessonUUID: string) {

        const {data, error} = await supabase
            .from('lessons')
            .select('*')
            .eq('uuid', lessonUUID)
            .single()

        if (error) throw error;

        if (data) {
            return data;
        }
    }

    private async fetchQuestionsForLesson(lessonUUID: string) {

        const {data, error} = await supabase
            .from('questions')
            .select('uuid,lesson_uuid,question,question_type,options,hint,position')
            .eq('lesson_uuid', lessonUUID)

        if (error) throw error;

            if (data) {
                return data as Question[];
            }

    }

    private async uploadLesson(lesson: Lesson){
        const { error } = await supabase
            .rpc('create_lesson_from_json', {
                data: lesson
            })

        if (error) console.error(error)
    }
    private async getLesson(lessonUUID: string) {
        const { error, data } = await supabase
            .rpc('get_lesson_json', {
                p_lesson_uuid: lessonUUID
            })

        if (error) console.error(error)

        if (data) return data as Lesson;
    }

}

const LessonService = new LessonServiceClass();

export default LessonService;