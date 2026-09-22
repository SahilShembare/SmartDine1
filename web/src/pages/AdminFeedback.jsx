import React from 'react';
import Sidebar from '../components/Sidebar';
import FeedbackManagement from '../components/admin/FeedbackManagement';

export default function AdminFeedback() {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800">
      <Sidebar mode="admin" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <FeedbackManagement />
      </main>
    </div>
  );
}
