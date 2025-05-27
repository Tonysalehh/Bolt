import { useState } from 'react';
import { parseExcelFile, Task } from '../services/excelService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function TaskImport() {
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const { user } = useAuth();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);
    setValidationErrors([]);

    try {
      const tasks = await parseExcelFile(file);
      
      // Insert tasks into Supabase
      const { error: supabaseError } = await supabase.from('tasks').insert(
        tasks.map(task => ({
          title: task.title,
          description: task.description,
          deadline: new Date(task.deadline).toISOString(),
          priority: task.priority,
          status: 'pending',
          created_by: user?.id
        }))
      );

      if (supabaseError) throw supabaseError;

      event.target.value = '';
      alert(`Successfully imported ${tasks.length} tasks!`);
    } catch (err: any) {
      if (err.name === 'ValidationError') {
        setValidationErrors(err.errors);
        setError('Some tasks failed validation. Please check the errors below.');
      } else {
        setError('Error importing tasks. Please check your Excel file format.');
      }
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
          <div className="text-red-600 mb-2">
            {error}
          </div>
        )}

        {validationErrors.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 rounded-md">
            <h3 className="text-sm font-medium text-red-800 mb-2">Validation Errors:</h3>
            <ul className="list-disc list-inside text-sm text-red-700">
              {validationErrors.map((error, index) => (
                <li key={index}>
                  Sheet: {error.sheet}, Row: {error.row}
                  <ul className="ml-4 list-disc list-inside">
                    {error.errors.map((err: string, i: number) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="text-sm text-gray-500">
          <p className="font-medium mb-2">Excel File Requirements:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Sheets needed: daily, weekly, monthly, yearly</li>
            <li>Required columns:
              <ul className="ml-4 list-disc list-inside">
                <li>title (required)</li>
                <li>description (optional)</li>
                <li>deadline (required, date format)</li>
                <li>priority (optional: low, medium, high, urgent)</li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}