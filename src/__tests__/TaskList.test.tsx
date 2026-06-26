import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaskList } from '../components/TaskList';
import type { Task } from '../types/task';

const mockTasks: Task[] = [
	{
		id: 1,
		title: 'Première tâche',
		description: 'Description 1',
		completed: false,
		createdAt: '2026-01-15T10:00:00Z',
		updatedAt: '2026-01-15T10:00:00Z',
	},
	{
		id: 2,
		title: 'Deuxième tâche',
		description: null,
		completed: true,
		createdAt: '2026-01-16T10:00:00Z',
		updatedAt: '2026-01-16T10:00:00Z',
	},
];

function renderList(props: Partial<React.ComponentProps<typeof TaskList>> = {}) {
	render(
		<TaskList
			tasks={mockTasks}
			loading={false}
			error={null}
			onToggle={vi.fn()}
			onDelete={vi.fn()}
			onEdit={vi.fn()}
			{...props}
		/>
	);
}

describe('TaskList', () => {
	it('shows loading state', () => {
		renderList({ tasks: [], loading: true });
		expect(screen.getByTestId('loading')).toBeInTheDocument();
		expect(screen.getByText('Chargement des tâches...')).toBeInTheDocument();
	});

	it('shows the error state', () => {
		renderList({ tasks: [], error: 'Boom' });
		expect(screen.getByTestId('error')).toBeInTheDocument();
		expect(screen.getByText('Erreur : Boom')).toBeInTheDocument();
	});

	it('shows the empty state when there are no tasks', () => {
		renderList({ tasks: [] });
		expect(screen.getByTestId('empty')).toBeInTheDocument();
		expect(screen.getByText('Aucune tâche')).toBeInTheDocument();
	});

	it('renders the list of tasks with plural counts', () => {
		renderList();
		expect(screen.getByTestId('task-list')).toBeInTheDocument();
		expect(screen.getByText('Première tâche')).toBeInTheDocument();
		expect(screen.getByText('Deuxième tâche')).toBeInTheDocument();
		expect(screen.getByText('2 tâches')).toBeInTheDocument();
		expect(screen.getByText('1 terminée')).toBeInTheDocument();
	});

	it('uses singular wording for a single task', () => {
		renderList({ tasks: [mockTasks[0]] });
		expect(screen.getByText('1 tâche')).toBeInTheDocument();
		expect(screen.getByText('0 terminée')).toBeInTheDocument();
	});

	it('uses plural wording for multiple completed tasks', () => {
		const allDone = mockTasks.map((t) => ({ ...t, completed: true }));
		renderList({ tasks: allDone });
		expect(screen.getByText('2 terminées')).toBeInTheDocument();
	});
});
