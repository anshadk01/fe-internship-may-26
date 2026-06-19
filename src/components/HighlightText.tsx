/**
 * HighlightText
 *
 * Splits `text` around occurrences of `highlight` and wraps each match in a
 * <mark> element. Case-insensitive. Safe against special regex characters in
 * user input (e.g. typing "c++" won't throw a SyntaxError).
 *
 * Usage:
 *   <HighlightText text={item.name} highlight={query} />
 */

interface HighlightTextProps {
  text: string
  highlight: string
  /** Tailwind class applied to matched segments. Defaults to yellow. */
  markClassName?: string
}

export function HighlightText({
  text,
  highlight,
  markClassName = 'bg-yellow-400/30 text-yellow-200 rounded-sm px-0.5',
}: HighlightTextProps) {
  // Nothing to highlight — return text as-is.
  if (!highlight.trim()) return <span>{text}</span>

  // Escape regex metacharacters so "c++" or "re?" don't throw.
  const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  // Capturing group keeps the matched segments in the resulting array.
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = text.split(regex)

  return (
    <span>
      {parts.map((part, index) =>
        // re-test each part; the regex alternates match / non-match / match…
        regex.test(part) ? (
          <mark key={index} className={markClassName}>
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  )
}