'use client';

import { MODEL_CONFIGS, type ModelId } from '@/types/ai-models';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ModelSelectorProps {
  value: ModelId;
  onValueChange: (value: ModelId) => void;
  disabled?: boolean;
}

export function ModelSelector({ value, onValueChange, disabled }: ModelSelectorProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent>
        {Object.values(MODEL_CONFIGS).map((config) => (
          <SelectItem key={config.id} value={config.id}>
            <div className="flex flex-col">
              <span className="font-medium">{config.name}</span>
              <span className="text-xs text-muted-foreground">{config.description}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

