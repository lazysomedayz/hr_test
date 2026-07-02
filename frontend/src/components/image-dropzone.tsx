import { useRef, useState, type DragEvent } from "react"
import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react"
import { api, fileUrl } from "@/api"
import { Button } from "@/components/ui/button"

type Props = {
  value?: string
  onChange: (path: string) => void
  onError: (message: string) => void
}

export function ImageDropzone({ value, onChange, onError }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)

  const upload = async (file?: File) => {
    if (!file) return
    setUploading(true)
    try {
      const result = await api.uploadImage(file)
      onChange(result.path)
    } catch (error) {
      onError(error instanceof Error ? error.message : "อัปโหลดรูปไม่สำเร็จ")
    } finally {
      setUploading(false)
    }
  }

  const drop = (event: DragEvent) => {
    event.preventDefault()
    setDragging(false)
    void upload(event.dataTransfer.files[0])
  }

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-lg border p-3">
        <img src={fileUrl(value)} alt="รูปพนักงาน" className="size-20 rounded-md object-cover" />
        <div className="flex-1 text-sm text-muted-foreground">อัปโหลดรูปเรียบร้อยแล้ว</div>
        <Button type="button" variant="ghost" size="icon" onClick={() => onChange("")}>
          <Trash2 className="size-4" />
        </Button>
      </div>
    )
  }

  return (
    <div
      onDragEnter={(event) => { event.preventDefault(); setDragging(true) }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={drop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed p-6 text-center transition ${
        dragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/60"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => void upload(event.target.files?.[0])}
      />
      {uploading ? <LoaderCircle className="mb-2 size-7 animate-spin text-primary" /> : <ImagePlus className="mb-2 size-7 text-muted-foreground" />}
      <p className="text-sm font-medium">{uploading ? "กำลังอัปโหลด..." : "ลากรูปมาวาง หรือคลิกเพื่อเลือก"}</p>
      <p className="mt-1 text-xs text-muted-foreground">ไม่บังคับ · JPG, PNG หรือ WebP · ไม่เกิน 5 MB</p>
    </div>
  )
}
