import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import * as taskApi from '../api/taskApi';
import type { Task } from '../types/task';

vi.mock('../api/taskApi');

const mockApi = vi.mocked(taskApi);

const tasks: Task[] = [
	{
		id: 1,
		title: 'Task A',
		description: null,
		completed: false,
		createdAt: '2026-01-15T10:00:00Z',
		updatedAt: '2026-01-15T10:00:00Z',
	},
	{
		id: 2,
		title: 'Task B',
		description: null,
		completed: true,
		createdAt: '2026-01-16T10:00:00Z',
		updatedAt: '2026-01-16T10:00:00Z',
	},
];

beforeEach(() => {
	vi.clearAllMocks();
});

describe('App', () => {
	it('renders the header title', async () => {
		mockApi.getTasks.mockResolvedValue([]);
		render(<App />);
		expect(screen.getByText('Mes Tâches')).toBeInTheDocument();
	});

	it('shows the empty state when there are no tasks and hides stats', async () => {
		mockApi.getTasks.mockResolvedValue([]);
		render(<App />);

		await waitFor(() =>
			expect(screen.getByTestId('empty')).toBeInTheDocument()
		);
		expect(screen.queryByText('Total')).not.toBeInTheDocument();
	});

	it('displays header stats once tasks are loaded', async () => {
		mockApi.getTasks.mockResolvedValue(tasks);
		render(<App />);

		await waitFor(() =>
			expect(screen.getByText('Total')).toBeInTheDocument()
		);
		expect(screen.getByText('Terminées')).toBeInTheDocument();
		expect(screen.getByText('En cours')).toBeInTheDocument();
		// 1 completed, 1 pending
		expect(screen.getByText('Task A')).toBeInTheDocument();
		expect(screen.getByText('Task B')).toBeInTheDocument();
	});

	it('adds a task through the form', async () => {
		mockApi.getTasks.mockResolvedValue([]);
		const created: Task = {
			id: 3,
			title: 'New task',
			description: null,
			completed: false,
			createdAt: '2026-01-17T10:00:00Z',
			updatedAt: '2026-01-17T10:00:00Z',
		};
		mockApi.createTask.mockResolvedValue(created);

		render(<App />);
		await waitFor(() =>
			expect(screen.getByTestId('empty')).toBeInTheDocument()
		);

		await userEvent.type(screen.getByLabelText('Titre'), 'New task');
		await userEvent.click(screen.getByRole('button', { name: 'Ajouter' }));

		await waitFor(() =>
			expect(screen.getByText('New task')).toBeInTheDocument()
		);
		expect(mockApi.createTask).toHaveBeenCalledWith({
			title: 'New task',
			description: undefined,
		});
	});

	it('swallows errors thrown while adding a task', async () => {
		mockApi.getTasks.mockResolvedValue([]);
		mockApi.createTask.mockRejectedValue(new Error('fail'));

		render(<App />);
		await waitFor(() =>
			expect(screen.getByTestId('empty')).toBeInTheDocument()
		);

		await userEvent.type(screen.getByLabelText('Titre'), 'Boom');
		await userEvent.click(screen.getByRole('button', { name: 'Ajouter' }));

		// No crash; app still rendered
		expect(screen.getByText('Mes Tâches')).toBeInTheDocument();
	});
});
