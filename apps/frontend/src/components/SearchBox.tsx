import { TextInput, ActionIcon } from '@mantine/core';
import type { MantineSize } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import type { ReactNode } from 'react';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;

  onSearch?: (value: string) => void;
  placeholder?: string;
  label?: ReactNode;
  size?: MantineSize;
}

export function SearchBox({
                            value,
                            onChange,
                            onSearch = () => {},
                            placeholder,
                            label,
                            size = 'sm',
                          }: SearchBoxProps) {
  const onSubmit = () => {
    onSearch(value);
  };

  return (
    <TextInput
      value={value}
      size={size}
      placeholder={placeholder}
      label={value.trim().length > 0 ? label : undefined}
      onChange={(event) => onChange(event.currentTarget.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          onSubmit();
        }
      }}
      rightSection={
        <ActionIcon
          variant="gradient"
          size={size === 'xs' ? 'sm' : 'md'}
          onClick={onSubmit}
        >
          <IconSearch size={size === 'xs' ? 14 : 16} stroke={1.5} />
        </ActionIcon>
      }
    />
  );
}