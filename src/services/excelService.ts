import { read, utils } from 'xlsx';

export interface Task {
  title: string;
  description: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export const parseExcelFile = async (file: File): Promise<Task[]> => {
  try {
    const data = await file.arrayBuffer();
    const workbook = read(data);
    
    const tasks: Task[] = [];
    
    // Process each sheet (daily, weekly, monthly, yearly)
    ['daily', 'weekly', 'monthly', 'yearly'].forEach(frequency => {
      const worksheet = workbook.Sheets[frequency];
      if (worksheet) {
        const sheetData = utils.sheet_to_json(worksheet);
        sheetData.forEach((row: any) => {
          tasks.push({
            title: row.title || '',
            description: row.description || '',
            deadline: row.deadline || '',
            priority: row.priority || 'medium',
            frequency: frequency as 'daily' | 'weekly' | 'monthly' | 'yearly'
          });
        });
      }
    });
    
    return tasks;
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    throw error;
  }
};