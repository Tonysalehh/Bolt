import { useState } from 'react';
import { parseExcelFile, Task } from '../services/excelService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function TaskImport() {
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);

    try {
      const tasks = await parseExcelFile(file);
      
      // Insert tasks into Supabase
      for (const task of tasks) {
        await supabase.from('tasks').insert({
          title: task.title,
          description: task.description,
          deadline: new Date(task.deadline).toISOString(),
          priority: task.priority,
          status: 'pending',
          created_by: user?.id
        });
      }

      event.target.value = '';
      alert('Tasks imported successfully!');
    } catch (err) {
      setError('Error importing tasks. Please check your Excel file format.');
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Import Tasks from Excel</h2>
      <div className="space-y-4">
        <div>
          <label 
            htmlFor="excel-upload" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Upload Excel File
          </label>
          <input
            id="excel-upload"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            disabled={importing}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>
        
        {importing && (
          <div className="text-blue-600">
            Importing tasks...
          </div>
        )}
        
        {error && (
          <div className="text-red-600">
            {error}
          </div>
        )}
        
        <div className="text-sm text-gray-500">
          <p>Excel file should have sheets named:</p>
          <ul className="list-disc list-inside">
            <li>daily</li>
            <li>weekly</li>
            <li>monthly</li>
            <li>yearly</li>
          </ul>
          <p className="mt-2">
            Each sheet should have columns: title, description, deadline, priority
          </p>
        </div>
      </div>
    </div>
  );
}