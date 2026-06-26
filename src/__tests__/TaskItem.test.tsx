import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TaskItem } from '../components/TaskItem';
import type { Task } from '../types/task';

const baseTask: Task = {
	id: 1,
	title: 'My task',
	description: 'Some description',
	completed: false,
	createdAt: '2026-01-15T10:00:00Z',
	updatedAt: '2026-01-15T10:00:00Z',
};

function setup(task: Partial<Task> = {}) {
	const onToggle = vi.fn();
	const onDelete = vi.fn();
	const onEdit = vi.fn();
	render(
		<TaskItem
			task={{ ...baseTask, ...task }}
			onToggle={onToggle}
			onDelete={onDelete}
			onEdit={onEdit}
		/>
	);
	return { onToggle, onDelete, onEdit };
}

describe('TaskItem', () => {
	it('renders the task title and description', () => {
		setup();
		expect(screen.getByText('My task')).toBeInTheDocument();
		expect(screen.getByText('Some description')).toBeInTheDocument();
	});

	it('does not render a description paragraph when description is null', () => {
		setup({ description: null });
		expect(screen.queryByText('Some description')).not.toBeInTheDocument();
	});

	it('applies the completed class and reflects the checkbox state', () => {
		setup({ completed: true });
		const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
		expect(checkbox.checked).toBe(true);
	});

	it('calls onToggle when the checkbox is clicked', async () => {
		const { onToggle } = setup();
		await userEvent.click(screen.getByRole('checkbox'));
		expect(onToggle).toHaveBeenCalledWith(1);
	});

	it('enters edit mode and saves changes', async () => {
		const { onEdit } = setup();

		await userEvent.click(screen.getByRole('button', { name: 'Modifier' }));
		const titleInput = screen.getByLabelText('Modifier le titre');
		await userEvent.clear(titleInput);
		await userEvent.type(titleInput, 'Updated title');
		await userEvent.click(
			screen.getByRole('button', { name: 'Enregistrer' })
		);

		expect(onEdit).toHaveBeenCalledWith(1, {
			title: 'Updated title',
			description: 'Some description',
		});
	});

	it('does not save when the edited title is empty', async () => {
		const { onEdit } = setup();

		await userEvent.click(screen.getByRole('button', { name: 'Modifier' }));
		await userEvent.clear(screen.getByLabelText('Modifier le titre'));
		await userEvent.click(
			screen.getByRole('button', { name: 'Enregistrer' })
		);

		expect(onEdit).not.toHaveBeenCalled();
	});

	it('saves with undefined description when cleared', async () => {
		const { onEdit } = setup();

		await userEvent.click(screen.getByRole('button', { name: 'Modifier' }));
		await userEvent.clear(screen.getByLabelText('Modifier la description'));
		await userEvent.click(
			screen.getByRole('button', { name: 'Enregistrer' })
		);

		expect(onEdit).toHaveBeenCalledWith(1, {
			title: 'My task',
			description: undefined,
		});
	});

	it('cancels edit mode and restores the original values', async () => {
		setup();

		await userEvent.click(screen.getByRole('button', { name: 'Modifier' }));
		const titleInput = screen.getByLabelText('Modifier le titre');
		await userEvent.clear(titleInput);
		await userEvent.type(titleInput, 'Changed');
		await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));

		expect(screen.getByText('My task')).toBeInTheDocument();
	});

	describe('delete confirmation flow', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});
		afterEach(() => {
			vi.useRealTimers();
		});

		it('requires a second click to confirm deletion', () => {
			const onDelete = vi.fn();
			render(
				<TaskItem
					task={baseTask}
					onToggle={vi.fn()}
					onDelete={onDelete}
					onEdit={vi.fn()}
				/>
			);

			const deleteBtn = screen.getByRole('button', { name: 'Supprimer' });
			fireEvent.click(deleteBtn);
			expect(onDelete).not.toHaveBeenCalled();

			fireEvent.click(deleteBtn);
			expect(onDelete).toHaveBeenCalledWith(1);
		});

		it('resets the confirmation after the timeout', () => {
			const onDelete = vi.fn();
			render(
				<TaskItem
					task={baseTask}
					onToggle={vi.fn()}
					onDelete={onDelete}
					onEdit={vi.fn()}
				/>
			);

			const deleteBtn = screen.getByRole('button', { name: 'Supprimer' });
			fireEvent.click(deleteBtn);

			act(() => {
				vi.advanceTimersByTime(3000);
			});

			fireEvent.click(deleteBtn);
			expect(onDelete).not.toHaveBeenCalled();
		});
	});
});
