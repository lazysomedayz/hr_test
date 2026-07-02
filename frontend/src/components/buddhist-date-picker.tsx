import { CalendarIcon } from "lucide-react"
import { th } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  min?: string
  max?: string
  invalid?: boolean
  describedBy?: string
  disabled?: boolean
}

function parseDate(value?: string) {
  if (!value) return undefined
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatThaiDate(date: Date) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

export function BuddhistDatePicker({ value, onChange, placeholder = "เลือกวันที่", min, max, invalid, describedBy, disabled }: Props) {
  const selected = parseDate(value)
  const minDate = parseDate(min) ?? new Date(1950, 0, 1)
  const maxDate = parseDate(max) ?? new Date(2100, 11, 31)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          aria-invalid={invalid}
          aria-describedby={describedBy}
          disabled={disabled}
          variant="outline"
          className={cn("w-full justify-start font-normal", !selected && "text-muted-foreground")}
        >
          <CalendarIcon className="size-4" />
          {selected ? formatThaiDate(selected) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => date && onChange(toIsoDate(date))}
          locale={th}
          captionLayout="dropdown"
          startMonth={minDate}
          endMonth={maxDate}
          disabled={{ before: minDate, after: maxDate }}
          formatters={{
            formatCaption: (date) => new Intl.DateTimeFormat("th-TH", {
              month: "long",
              year: "numeric",
            }).format(date),
            formatYearDropdown: (date) => String(date.getFullYear() + 543),
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
