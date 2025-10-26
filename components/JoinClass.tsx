import React, { useState } from 'react';
import { User, Classroom } from '../types';
import { LogoutIcon } from './Icons';

interface JoinClassProps {
  user: User;
  onJoinClass: (classCode: string) => void;
  onLogout: () => void;
  classrooms: Classroom[];
}

const JoinClass: React.FC<JoinClassProps> = ({ user, onJoinClass, onLogout, classrooms }) => {
  const [classCode, setClassCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const code = classCode.trim().toUpperCase();
    if (!code) {
      setError('Please enter a class code.');
      return;
    }
    const isValidCode = classrooms.some(c => c.code === code);
    if (isValidCode) {
      onJoinClass(code);
    } else {
      setError('Invalid class code. Please check with your teacher.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md bg-brand-dark-blue border border-brand-border rounded-2xl p-8 relative">
        <div className="text-center">
            <h1 className="text-3xl font-bold">Join a Classroom</h1>
            <p className="text-gray-400 mt-2">Welcome, {user.name}! Enter the code from your teacher to continue.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 mt-8">
            <div>
                <label htmlFor="classCode" className="block text-sm font-medium text-gray-300 mb-2">
                    Class Code
                </label>
                <input
                    type="text"
                    id="classCode"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value)}
                    placeholder="e.g., AB12CD"
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-brand-cyan focus:outline-none uppercase"
                />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
                type="submit"
                className="w-full bg-brand-cyan text-white font-bold py-3 px-6 rounded-lg hover:bg-cyan-500 transition-colors duration-300"
            >
                Join Class
            </button>
        </form>
        <div className="absolute top-4 right-4">
             <button onClick={onLogout} className="flex items-center gap-2 text-gray-400 hover:text-brand-cyan" aria-label="Logout">
                <LogoutIcon />
              </button>
        </div>
      </div>
    </div>
  );
};

export default JoinClass;
