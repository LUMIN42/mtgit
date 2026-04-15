import {TextInput, type MantineSize} from "@mantine/core";
import {useDebouncedValue} from "@mantine/hooks";
import {useEffect, useState} from "react";

interface DebouncedTextInputProps {
  value: string;
  onDebouncedChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  size?: MantineSize;
  debounceMs?: number;
}

export function DebouncedTextInput({
  value,
  onDebouncedChange,
  placeholder,
  label,
  size = "sm",
  debounceMs = 200,
}: DebouncedTextInputProps) {
  const [draftValue, setDraftValue] = useState(value);
  const [debouncedValue] = useDebouncedValue(draftValue, debounceMs);

  useEffect(() => {
    setDraftValue(value);
  }, [value]);

  useEffect(() => {
    onDebouncedChange(debouncedValue);
  }, [debouncedValue, onDebouncedChange]);

  return (
    <TextInput
      value={draftValue}
      size={size}
      placeholder={placeholder}
      aria-label={label}
      onChange={(event) => setDraftValue(event.currentTarget.value)}
    />
  );
}

