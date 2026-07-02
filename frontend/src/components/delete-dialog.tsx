import { useState } from "react"
import { AlertTriangle } from "lucide-react"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type Props = {
  open: boolean
  title: string
  description: string
  blockedReason?: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}

export function DeleteDialog({ open, title, description, blockedReason, onOpenChange, onConfirm }: Props) {
  const [deleting, setDeleting] = useState(false)

  const confirm = async () => {
    setDeleting(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" />
          </div>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
          {blockedReason && (
            <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">{blockedReason}</p>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction
            disabled={deleting || Boolean(blockedReason)}
            onClick={(event) => { event.preventDefault(); void confirm() }}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleting ? "กำลังลบ..." : "ลบถาวร"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
