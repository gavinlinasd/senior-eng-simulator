/** Renders a copy string with **bold** spans. That's the whole markup language. */
export function RichText({ text }: { text: string }) {
  const parts = text.split('**')
  return <>{parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))}</>
}
