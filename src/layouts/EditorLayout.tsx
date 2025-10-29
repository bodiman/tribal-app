import { Outlet } from 'react-router-dom';

export function EditorLayout() {
  return (
    <div className="h-screen bg-gray-100 overflow-hidden">
      <Outlet />
    </div>
  );
}