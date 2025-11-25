import React from 'react';
import LoginForm from './components/LoginForm';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Employee Timesheet Platform
          </h1>
          <p className="text-neutral-600">
            Please log in to continue
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}