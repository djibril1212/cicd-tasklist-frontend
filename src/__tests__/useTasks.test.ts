import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useTasks } from '../hooks/useTasks';
import * as taskApi from '../api/taskApi';
import type { Task } from '../types/task';

vi.mock('../api/taskApi');

const mockApi = vi.mocked(taskApi);

const taskA: Task = {
	id: 1,
	title: 'Task A',
	description: null,
	completed: false,
	createdAt: '2026-01-15T10:00:00Z',
	updatedAt: '2026-01-15T10:00:00Z',
};

const taskB: Task = {
	id: 2,
	title: 'Task B',
	description: 'desc',
	completed: false,
	createdAt: '2026-01-16T10:00:00Z',
	updatedAt: '2026-01-16T10:00:00Z',
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe('useTasks', () => {
	it('loads tasks on mount', async () => {
		mockApi.getTasks.mockResolvedValue([taskA]);

		const { result } = renderHook(() => useTasks());

		expect(result.current.loading).toBe(true);
		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.tasks).toEqual([taskA]);
		expect(result.current.error).toBeNull();
	});

	it('sets an error message when loading fails (Error instance)', async () => {
		mockApi.getTasks.mockRejectedValue(new Error('Network down'));

		const { result } = renderHook(() => useTasks());

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.error).toBe('Network down');
		expect(result.current.tasks).toEqual([]);
	});

	it('sets a default error message when a non-Error is thrown', async () => {
		mockApi.getTasks.mockRejectedValue('boom');

		const { result } = renderHook(() => useTasks());

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.error).toBe('Une erreur est survenue');
	});

	it('adds a task to the top of the list', async () => {
		mockApi.getTasks.mockResolvedValue([taskA]);
		mockApi.createTask.mockResolvedValue(taskB);

		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.addTask({ title: 'Task B' });
		});

		expect(result.current.tasks).toEqual([taskB, taskA]);
	});

	it('edits an existing task', async () => {
		mockApi.getTasks.mockResolvedValue([taskA, taskB]);
		const edited = { ...taskA, title: 'Edited' };
		mockApi.updateTask.mockResolvedValue(edited);

		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.editTask(1, { title: 'Edited' });
		});

		expect(result.current.tasks[0].title).toBe('Edited');
		expect(result.current.tasks[1]).toEqual(taskB);
	});

	it('removes a task', async () => {
		mockApi.getTasks.mockResolvedValue([taskA, taskB]);
		mockApi.deleteTask.mockResolvedValue(undefined);

		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.removeTask(1);
		});

		expect(result.current.tasks).toEqual([taskB]);
	});

	it('toggles completion of an existing task', async () => {
		mockApi.getTasks.mockResolvedValue([taskA]);
		mockApi.updateTask.mockResolvedValue({ ...taskA, completed: true });

		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.toggleComplete(1);
		});

		expect(mockApi.updateTask).toHaveBeenCalledWith(1, { completed: true });
		expect(result.current.tasks[0].completed).toBe(true);
	});

	it('does nothing when toggling a non-existent task', async () => {
		mockApi.getTasks.mockResolvedValue([taskA]);

		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.toggleComplete(999);
		});

		expect(mockApi.updateTask).not.toHaveBeenCalled();
		expect(result.current.tasks).toEqual([taskA]);
	});

	it('can reload tasks manually', async () => {
		mockApi.getTasks.mockResolvedValue([taskA]);

		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		mockApi.getTasks.mockResolvedValue([taskA, taskB]);
		await act(async () => {
			await result.current.loadTasks();
		});

		expect(result.current.tasks).toEqual([taskA, taskB]);
	});
});
