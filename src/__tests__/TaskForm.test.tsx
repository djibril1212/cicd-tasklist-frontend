import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TaskForm } from '../components/TaskForm';

describe('TaskForm', () => {
	it('renders in create mode by default', () => {
		render(<TaskForm onSubmit={vi.fn()} />);
		expect(screen.getByText('Nouvelle tâche')).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: 'Ajouter' })
		).toBeInTheDocument();
	});

	it('renders in edit mode with initial values', () => {
		render(
			<TaskForm
				onSubmit={vi.fn()}
				mode="edit"
				initialValues={{ title: 'Existing', description: 'Desc' }}
			/>
		);
		expect(screen.getByText('Modifier la tâche')).toBeInTheDocument();
		expect(screen.getByLabelText('Titre')).toHaveValue('Existing');
		expect(screen.getByLabelText('Description')).toHaveValue('Desc');
	});

	it('shows a validation error when submitting an empty title', async () => {
		const onSubmit = vi.fn();
		render(<TaskForm onSubmit={onSubmit} />);

		await userEvent.click(screen.getByRole('button', { name: 'Ajouter' }));

		expect(screen.getByRole('alert')).toHaveTextContent('Le titre est requis');
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it('clears the validation error when the title changes', async () => {
		render(<TaskForm onSubmit={vi.fn()} />);

		await userEvent.click(screen.getByRole('button', { name: 'Ajouter' }));
		expect(screen.getByRole('alert')).toBeInTheDocument();

		await userEvent.type(screen.getByLabelText('Titre'), 'A');
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	it('submits trimmed values and resets in create mode', async () => {
		const onSubmit = vi.fn();
		render(<TaskForm onSubmit={onSubmit} />);

		await userEvent.type(screen.getByLabelText('Titre'), '  My task  ');
		await userEvent.type(screen.getByLabelText('Description'), '  details  ');
		await userEvent.click(screen.getByRole('button', { name: 'Ajouter' }));

		expect(onSubmit).toHaveBeenCalledWith({
			title: 'My task',
			description: 'details',
		});
		expect(screen.getByLabelText('Titre')).toHaveValue('');
		expect(screen.getByLabelText('Description')).toHaveValue('');
	});

	it('submits with undefined description when empty', async () => {
		const onSubmit = vi.fn();
		render(<TaskForm onSubmit={onSubmit} />);

		await userEvent.type(screen.getByLabelText('Titre'), 'Title only');
		await userEvent.click(screen.getByRole('button', { name: 'Ajouter' }));

		expect(onSubmit).toHaveBeenCalledWith({
			title: 'Title only',
			description: undefined,
		});
	});

	it('does not reset fields in edit mode', async () => {
		const onSubmit = vi.fn();
		render(
			<TaskForm
				onSubmit={onSubmit}
				mode="edit"
				initialValues={{ title: 'Keep' }}
			/>
		);

		await userEvent.click(screen.getByRole('button', { name: 'Modifier' }));

		expect(onSubmit).toHaveBeenCalledWith({
			title: 'Keep',
			description: undefined,
		});
		expect(screen.getByLabelText('Titre')).toHaveValue('Keep');
	});

	it('renders and triggers the cancel button when onCancel is provided', async () => {
		const onCancel = vi.fn();
		render(<TaskForm onSubmit={vi.fn()} onCancel={onCancel} />);

		await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));
		expect(onCancel).toHaveBeenCalled();
	});

	it('does not render a cancel button when onCancel is absent', () => {
		render(<TaskForm onSubmit={vi.fn()} />);
		expect(
			screen.queryByRole('button', { name: 'Annuler' })
		).not.toBeInTheDocument();
	});
});
