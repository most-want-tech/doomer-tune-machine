import type { ChangeEvent, RefObject } from 'react'
import { Label } from '@/components/ui/label'

interface VideoImageUploadProps {
  imagePreviewUrl: string | null
  imageInputRef: RefObject<HTMLInputElement | null>
  isDisabled: boolean
  onImageInput: (event: ChangeEvent<HTMLInputElement>) => void
}

export function VideoImageUpload({
  imagePreviewUrl,
  imageInputRef,
  isDisabled,
  onImageInput,
}: VideoImageUploadProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm">Video Image</Label>
      <p className="text-xs text-muted-foreground">
        Choose a JPG, PNG, or GIF that will stay centered in the video export.
      </p>

      <div
        onClick={() => !isDisabled && imageInputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-4 text-center cursor-pointer transition-colors ${
          isDisabled ? 'opacity-60 pointer-events-none' : 'hover:border-primary/60'
        }`}
      >
        <input
          ref={imageInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif"
          className="hidden"
          onChange={onImageInput}
        />
        {imagePreviewUrl ? (
          <img
            src={imagePreviewUrl}
            alt="Video artwork preview"
            className="h-32 w-full object-contain"
          />
        ) : (
          <span className="text-sm text-muted-foreground">Click to add image</span>
        )}
      </div>
    </div>
  )
}
