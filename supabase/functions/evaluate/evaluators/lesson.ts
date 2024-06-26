import {evaluateTrueOrFalse} from "./trueOrFalse.ts";
import {evaluateMultipleChoice} from "./multipleChoice.ts";
import {evaluateSlider} from "./slider.ts";
import {evaluateQualification} from "./qualification.ts";

interface CommonResult {
    score: number;
    isCorrect: boolean;
}

interface Answer {
    uuid: string,
    question: string,
    options: string,
    type: string
}

const evaluationRouter = {
    "trueorfalse": evaluateTrueOrFalse,
    "multiplechoice": evaluateMultipleChoice,
    "slider": evaluateSlider,
    "requirement": evaluateQualification
}

export const evaluateLesson = async (answers: Answer[], uuid: string, user: any, supabaseClient: any): Promise<any> => {
    const {errorHints, count} = await supabaseClient
        .from('user_hints')
        .select('*', {count: 'exact', head: true})
        .eq('lesson_id', uuid)

    if (errorHints) throw errorHints;

    let lessonFinished = false;
    let lessonStarted = true;
    let lessonFinishedFirstTime = false;

    const {data, error} = await supabaseClient
        .from('user_finished_lessons')
        .select('finished, is_started, finished_for_first_time')
        .eq('lesson_id', uuid)

    if (error) {
        throw error;
    }

    if (data && data[0]) {
        lessonFinished = data[0].finished;
        lessonStarted = data[0].is_started;

        if (lessonStarted && lessonFinished) {
            //lesson has been finished before and should be "started"
            const {data, error} = await supabaseClient
                .from('user_finished_lessons')
                .update({is_started: false, finished: true, finished_for_first_time: false})
                .eq('lesson_id', uuid)

            if (error) throw error;
        }
    } else {
        //lesson has not been finished yet
        const {data, error} = await supabaseClient
            .from('user_finished_lessons')
            .insert([
                {
                    user_id: user,
                    lesson_id: uuid,
                    finished: true,
                    is_started: false,
                    finished_for_first_time: true,
                    used_hints: count
                },
            ])

        //first time finishing: get points!
        lessonFinishedFirstTime = true;
        if (error) throw error;
    }

    const results: CommonResult[] = await evaluateAnswers(answers, uuid, user, supabaseClient);

    if (results.length > 0) {
        let usedHints = count > 0 ? count : 0;
        await persistTotalScore(results, uuid, user, usedHints, lessonFinishedFirstTime, supabaseClient);
    }

    return {
        lesson: uuid,
        results: results
    };
}

async function evaluateAnswers(answers: Answer[], lessonUUID: string, user: any, supabaseClient: any) {
    const results: CommonResult[] = [];
    for (const answer of answers) {
        const type = answer.type.toLowerCase();

        if (evaluationRouter[type]) {
            try {
                const result: CommonResult = await evaluationRouter[type](answer.uuid, answer.options, supabaseClient);
                if (result) {
                    await persistAnswerAndResult(answer, result, lessonUUID, user, supabaseClient);
                    results.push(result);
                }
            } catch (error) {
                if (error.message !== "Error: Answer does not ask for a qualification check.") {
                    throw error;
                }
                continue;
            }
        } else {
            throw new Error('Path not found: Path has to include the question type that shall be evaluated.');
        }
    }
    return results;
}

async function persistAnswerAndResult(answer: Answer, result: any, lessonUUID: string, user: any, supabaseClient: any) {
    const {data, error} = await supabaseClient
        .from('user_answers')
        .select('question_id, answer')
        .eq('lesson_id', lessonUUID)
        .eq('question_id', answer.uuid)

    if (error) throw error;

    if (data && data.length > 0) {
        const {data, error} = await supabaseClient
            .from('user_answers')
            .update({answer: answer.options, result: result})
            .eq('lesson_id', lessonUUID)
            .eq('question_id', answer.uuid)
        if (error) throw error;

    } else {
        const {data, error} = await supabaseClient
            .from('user_answers')
            .insert([
                {
                    user_id: user,
                    lesson_id: lessonUUID,
                    question_id: answer.uuid,
                    answer: answer.options,
                    result: result
                },
            ])
        if (error) throw error;
    }
}

async function persistTotalScore(results: CommonResult[], lessonId: string, user: any, usedHints: number, firstTime: boolean, supabaseClient: any) {
    let score = 0;

    results.forEach(res => {
        score += res.score;
    })

    if (usedHints > 0) {
        try {
            const hintMultiplier = 10;
            //subtract 10 points per hint
            score -= (usedHints * hintMultiplier);
            if (score < 0) {
                score = 0;
            }
        } catch (error: any) {
            throw error;
        }
    }
    try {
        if (firstTime) {

            const {updatedLessonUserPoints} = await supabaseClient
                .from('user_finished_lessons')
                .update({user_points: score})
                .eq("lesson_id", lessonId)
                .eq('user_id', user)

            const {data, error} = await supabaseClient
                .from('user_points')
                .select('points')
                .eq('user_id', user)
                .maybeSingle()

            if (data?.points) {
                score += data.points;

                const {updatedUserPoints} = await supabaseClient
                    .from('user_points')
                    .update({points: score})
                    .eq('user_id', user)
            } else {
                const {data, error} = await supabaseClient
                    .from('user_points')
                    .insert(
                        {
                            user_id: user,
                            points: score
                        },
                    )
            }
        } else {

            const {updatedLessonUserPoints} = await supabaseClient
                .from('user_finished_lessons')
                .update({new_user_points: score})
                .eq("lesson_id", lessonId)
                .eq('user_id', user)
        }
    } catch (error) {
        throw error;
    }
}
