import { CloseButton, Group, Text, UnstyledButton } from '@mantine/core';

interface ClickableTagRowProps {
  tag: string;
  onClick: (tag: string) => void;
}

export function ClickableTagRow({ tag, onClick }: ClickableTagRowProps) {
  return (
	<UnstyledButton
	  type="button"
	  onClick={() => onClick(tag)}
	  style={{
		width: '100%',
		display: 'block',
		borderRadius: 'var(--mantine-radius-sm)',
	  }}
	>
	  <Group
		justify="space-between"
		align="center"
		wrap="nowrap"
		px="sm"
		py={8}
		style={{
		  width: '100%',
		  border: '1px solid var(--mantine-color-gray-3)',
		  borderRadius: 'var(--mantine-radius-sm)',
		  backgroundColor: 'var(--mantine-color-white)',
		  transition: 'background-color 150ms ease, transform 150ms ease, border-color 150ms ease',
		  cursor: 'pointer',
		}}
		onMouseEnter={(event) => {
		  event.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)';
		  event.currentTarget.style.borderColor = 'var(--mantine-color-gray-4)';
		}}
		onMouseLeave={(event) => {
		  event.currentTarget.style.backgroundColor = 'var(--mantine-color-white)';
		  event.currentTarget.style.borderColor = 'var(--mantine-color-gray-3)';
		}}
		onMouseDown={(event) => {
		  event.currentTarget.style.transform = 'translateY(1px)';
		}}
		onMouseUp={(event) => {
		  event.currentTarget.style.transform = 'translateY(0)';
		}}
	  >
		<Text>{tag}</Text>
		<CloseButton aria-label={`Remove tag ${tag}`} tabIndex={-1} />
	  </Group>
	</UnstyledButton>
  );
}

export default ClickableTagRow;

