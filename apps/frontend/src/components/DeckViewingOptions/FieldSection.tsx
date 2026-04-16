import {InputLabel, Stack} from "@mantine/core";
import type {ReactNode} from "react";

interface FieldSectionProps {
  label: ReactNode;
  children: ReactNode;
}

export function FieldSection({label, children}: FieldSectionProps) {
  return (
    <Stack gap={0}>
      <InputLabel size="xs">{label}</InputLabel>
      {children}
    </Stack>
  );
}

