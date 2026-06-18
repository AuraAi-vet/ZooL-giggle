export interface GoogleTaskList {
  id: string;
  title: string;
  updated: string;
}

export interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  completed?: string;
}

/**
 * Lists the user's task lists.
 */
export const listGoogleTaskLists = async (accessToken: string): Promise<GoogleTaskList[]> => {
  const response = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || 'Failed to fetch Google Task Lists');
  }

  const data = await response.json();
  return data.items || [];
};

/**
 * Creates a new task list.
 */
export const createGoogleTaskList = async (accessToken: string, title: string): Promise<GoogleTaskList> => {
  const response = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || 'Failed to create Google Task List');
  }

  return response.json();
};

/**
 * Lists tasks in a specific task list.
 */
export const listGoogleTasks = async (accessToken: string, listId: string): Promise<GoogleTask[]> => {
  const url = `https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks?showCompleted=true&showHidden=true`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || 'Failed to fetch tasks from Google Tasks');
  }

  const data = await response.json();
  return data.items || [];
};

/**
 * Creates a new task.
 */
export const createGoogleTask = async (
  accessToken: string,
  listId: string,
  task: { title: string; notes?: string; due?: string }
): Promise<GoogleTask> => {
  const response = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(task),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || 'Failed to create task in Google Tasks');
  }

  return response.json();
};

/**
 * Updates a task selective attributes.
 */
export const updateGoogleTask = async (
  accessToken: string,
  listId: string,
  taskId: string,
  task: Partial<GoogleTask>
): Promise<GoogleTask> => {
  const response = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(task),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || 'Failed to update Google Task');
  }

  return response.json();
};

/**
 * Deletes a task.
 */
export const deleteGoogleTask = async (
  accessToken: string,
  listId: string,
  taskId: string
): Promise<void> => {
  const response = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || 'Failed to delete Google Task');
  }
};
