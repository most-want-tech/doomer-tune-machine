import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from '@phosphor-icons/react'
import type { EffectInfo } from '../types'

interface EffectControlProps {
  label: string
  value: number | boolean
  info: EffectInfo
  onChange: (value: number | boolean) => void
}

export function EffectControl({ label, value, info, onChange }: EffectControlProps) {
  const { type = 'slider', description, min = 0, max = 1, step = 0.01, format } = info

  if (type === 'switch') {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label>{label}</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info size={16} className="text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>{description}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Switch 
          checked={value as boolean} 
          onCheckedChange={onChange as (checked: boolean) => void}
        />
      </div>
    )
  }

  const displayValue = format ? format(value as number) : (value as number).toFixed(2)

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Label>{label}</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info size={16} className="text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>{description}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <span className="font-mono text-sm text-muted-foreground">
          {displayValue}
        </span>
      </div>
      <Slider
        value={[value as number]}
        onValueChange={(v) => onChange(v[0])}
        min={min}
        max={max}
        step={step}
      />
    </div>
  )
}
