import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	getTasks,
	getTask,
	createTask,
	updateTask,
	deleteTask,
} from '../api/taskApi';

const mockTask = {
	id: 1,
	title: 'Test',
	description: null,
	completed: false,
	createdAt: '2026-01-15T10:00:00Z',
	updatedAt: '2026-01-15T10:00:00Z',
};

function mockFetchOk(body: unknown) {
	vi.stubGlobal(
		'fetch',
		vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(body),
			text: () => Promise.resolve(''),
		})
	);
}

function mockFetchError(status: number, message: string) {
	vi.stubGlobal(
		'fetch',
		vi.fn().mockResolvedValue({
			ok: false,
			status,
			json: () => Promise.resolve(null),
			text: () => Promise.resolve(message),
		})
	);
}

beforeEach(() => {
	vi.restoreAllMocks();
});

describe('taskApi', () => {
	describe('getTasks', () => {
		it('returns an array of tasks', async () => {
			mockFetchOk([mockTask]);

			const tasks = await getTasks();

			expect(tasks).toEqual([mockTask]);
			expect(fetch).toHaveBeenCalledWith('/api/tasks');
		});

		it('throws when the response is not ok', async () => {
			mockFetchError(500, 'Server error');

			await expect(getTasks()).rejects.toThrow('HTTP 500: Server error');
		});
	});

	describe('getTask', () => {
		it('returns a single task by id', async () => {
			mockFetchOk(mockTask);

			const task = await getTask(1);

			expect(task).toEqual(mockTask);
			expect(fetch).toHaveBeenCalledWith('/api/tasks/1');
		});

		it('throws when the task is not found', async () => {
			mockFetchError(404, 'Not found');

			await expect(getTask(99)).rejects.toThrow('HTTP 404: Not found');
		});
	});

	describe('createTask', () => {
		it('posts the payload and returns the created task', async () => {
			mockFetchOk(mockTask);

			const result = await createTask({ title: 'Test' });

			expect(result).toEqual(mockTask);
			expect(fetch).toHaveBeenCalledWith('/api/tasks', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: 'Test' }),
			});
		});

		it('throws when creation fails', async () => {
			mockFetchError(400, 'Bad request');

			await expect(createTask({ title: '' })).rejects.toThrow(
				'HTTP 400: Bad request'
			);
		});
	});

	describe('updateTask', () => {
		it('puts the payload and returns the updated task', async () => {
			const updated = { ...mockTask, completed: true };
			mockFetchOk(updated);

			const result = await updateTask(1, { completed: true });

			expect(result).toEqual(updated);
			expect(fetch).toHaveBeenCalledWith('/api/tasks/1', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ completed: true }),
			});
		});

		it('throws when update fails', async () => {
			mockFetchError(404, 'Not found');

			await expect(updateTask(99, { title: 'X' })).rejects.toThrow(
				'HTTP 404: Not found'
			);
		});
	});

	describe('deleteTask', () => {
		it('deletes a task without throwing', async () => {
			mockFetchOk(undefined);

			await expect(deleteTask(1)).resolves.toBeUndefined();
			expect(fetch).toHaveBeenCalledWith('/api/tasks/1', {
				method: 'DELETE',
			});
		});

		it('throws when deletion fails', async () => {
			mockFetchError(404, 'Not found');

			await expect(deleteTask(99)).rejects.toThrow('HTTP 404: Not found');
		});
	});
});
