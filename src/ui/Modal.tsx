import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  className?: string
  labelledBy?: string
  children: ReactNode
}

/** Native <dialog> wrapper: focus trapping, Escape to close, click on the backdrop to close. */
export function Modal({ open, onClose, className, labelledBy, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  const onBackdropClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === ref.current) onClose()
  }

  return (
    <dialog ref={ref} className={className} aria-labelledby={labelledBy} onClose={onClose} onClick={onBackdropClick}>
      {children}
    </dialog>
  )
}
