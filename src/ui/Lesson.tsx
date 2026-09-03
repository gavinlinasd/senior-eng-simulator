import { GraduationCap } from 'lucide-react'
import { RichText } from './RichText'

export function Lesson({ lesson }: { lesson: { title: string; body: string } }) {
  return (
    <div className="lesson">
      <div className="lesson__title">
        <GraduationCap size={16} aria-hidden /> {lesson.title}
      </div>
      <p className="lesson__body">
        <RichText text={lesson.body} />
      </p>
    </div>
  )
}
