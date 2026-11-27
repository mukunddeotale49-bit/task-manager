const ALLOWED_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];
const ALLOWED_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

function isValidDateString(dateStr) {
  if (!dateStr) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const parsed = new Date(dateStr);
  return !Number.isNaN(parsed.getTime());
}

function validateCreateTask(req, res, next) {
  const { title, description, status, priority, due_date } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Title is required and must be a non-empty string.'
    });
  }

  if (title.trim().length > 255) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Title must not exceed 255 characters.'
    });
  }

  if (description !== undefined && description !== null && typeof description !== 'string') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Description must be a string.'
    });
  }

  if (status !== undefined && !ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}`
    });
  }

  if (priority !== undefined && !ALLOWED_PRIORITIES.includes(priority)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: `Priority must be one of: ${ALLOWED_PRIORITIES.join(', ')}`
    });
  }

  if (due_date !== undefined && due_date !== null && due_date !== '' && !isValidDateString(due_date)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'due_date must be formatted as YYYY-MM-DD.'
    });
  }

  req.validatedTask = {
    title: title.trim(),
    description: description ? description.trim() : '',
    status: status || 'TODO',
    priority: priority || 'MEDIUM',
    due_date: due_date && due_date !== '' ? due_date : null
  };

  return next();
}

function validateUpdateTask(req, res, next) {
  const { title, description, status, priority, due_date } = req.body;
  const updates = {};

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0 || title.trim().length > 255) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Title must be a non-empty string up to 255 characters.'
      });
    }
    updates.title = title.trim();
  }

  if (description !== undefined) {
    if (description !== null && typeof description !== 'string') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Description must be a string or null.'
      });
    }
    updates.description = description === null ? '' : description.trim();
  }

  if (status !== undefined) {
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}`
      });
    }
    updates.status = status;
  }

  if (priority !== undefined) {
    if (!ALLOWED_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Priority must be one of: ${ALLOWED_PRIORITIES.join(', ')}`
      });
    }
    updates.priority = priority;
  }

  if (due_date !== undefined) {
    if (due_date !== null && due_date !== '' && !isValidDateString(due_date)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'due_date must be formatted as YYYY-MM-DD or null.'
      });
    }
    updates.due_date = due_date && due_date !== '' ? due_date : null;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'At least one valid field must be provided for update.'
    });
  }

  req.validatedUpdates = updates;
  return next();
}

module.exports = {
  validateCreateTask,
  validateUpdateTask
};
