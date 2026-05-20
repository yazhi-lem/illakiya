import type { Lesson } from '../types';

type TutorPaneProps = {
  lessons: Lesson[];
};

export function TutorPane({ lessons }: TutorPaneProps) {
  return (
    <section className="tutorPane">
      {lessons.map((lesson) => (
        <article key={lesson.id} className="lessonCard">
          <h2>{lesson.title}</h2>
          <p>{lesson.goal}</p>
          <div className="ghostKeys" aria-label="குறியீட்டு விசை மேலமைப்பு">
            {lesson.keys.map((key, index) => (
              <span key={`${lesson.id}-${index}`} className="ghostKey">
                {key}
              </span>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}
