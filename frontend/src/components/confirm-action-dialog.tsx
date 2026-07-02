import { useState } from "react"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type Props = {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  destructive?: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}

export function ConfirmActionDialog({
  open, title, description, confirmLabel, destructive, onOpenChange, onConfirm,
}: Props) {
  const [working, setWorking] = useState(false)

  const confirm = async () => {
    setWorking(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setWorking(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction
            disabled={working}
            className={destructive ? "bg-destructive text-white hover:bg-destructive/90" : ""}
            onClick={(event) => { event.preventDefault(); void confirm() }}
          >
            {working ? "กำลังดำเนินการ..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
