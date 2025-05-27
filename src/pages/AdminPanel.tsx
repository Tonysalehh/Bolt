import TaskImport from '../components/TaskImport';

export default function AdminPanel() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TaskImport />
        {/* Add other admin components here */}
      </div>
    </div>
  );
}