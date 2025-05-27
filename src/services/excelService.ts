import { read, utils } from 'xlsx';

export interface Task {
  title: string;
  description: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export const validateTask = (task: any): string[] => {
  const errors: string[] = [];
  
  if (!task.title?.trim()) errors.push('Title is required');
  if (!task.deadline) errors.push('Deadline is required');
  if (!['low', 'medium', 'high', 'urgent'].includes(task.priority)) {
    task.priority = 'medium'; // Set default priority
  }
  
  return errors;
};

export const parseExcelFile = async (file: File): Promise<Task[]> => {
  try {
    const data = await file.arrayBuffer();
    const workbook = read(data);
    
    const tasks: Task[] = [];
    const errors: { sheet: string; row: number; errors: string[] }[] = [];
    
    ['daily', 'weekly', 'monthly', 'yearly'].forEach(frequency => {
      const worksheet = workbook.Sheets[frequency];
      if (worksheet) {
        const sheetData = utils.sheet_to_json(worksheet);
        sheetData.forEach((row: any, index: number) => {
          const taskErrors = validateTask(row);
          
          if (taskErrors.length > 0) {
            errors.push({
              sheet: frequency,
              row: index + 2, // Adding 2 to account for header row and 0-based index
              errors: taskErrors
            });
          } else {
            tasks.push({
              title: row.title.trim(),
              description: row.description?.trim() || '',
              deadline: row.deadline || '',
              priority: row.priority || 'medium',
              frequency: frequency as 'daily' | 'weekly' | 'monthly' | 'yearly'
            });
          }
        });
      }
    });
    
    if (errors.length > 0) {
      throw {
        name: 'ValidationError',
        errors,
        message: 'Some tasks failed validation'
      };
    }
    
    return tasks;
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    throw error;
  }
}