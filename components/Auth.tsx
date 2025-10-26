import React, { useState } from 'react';
import { Role } from '../types';
import { ArrowLeftIcon, TeacherIcon, StudentIcon } from './Icons';

interface AuthProps {
  role: Role;
  onAuthSuccess: (authData: { name: string, email: string }) => void;
  onBack: () => void;
}

const Auth: React.FC<AuthProps> = ({ role, onAuthSuccess, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validatePassword = (password: string) => {
    const errors = [];
    if (password.length < 8) errors.push("at least 8 characters");
    if (!/[a-z]/.test(password)) errors.push("a lowercase letter");
    if (!/[A-Z]/.test(password)) errors.push("an uppercase letter");
    if (!/\d/.test(password)) errors.push("a number");
    if (!/[@$!%*?&]/.test(password)) errors.push("a special character (e.g., @$!%*?&)");

    if (errors.length > 0) {
        return `Password must contain ${errors.join(', ')}.`;
    }
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isLogin && !name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!email.trim() || !password) {
      setError('Please fill in email and password.');
      return;
    }

    if (!isLogin) {
      const passwordError = validatePassword(password);
      if (passwordError) {
        setError(passwordError);
        return;
      }
    }

    // In a real app, you would have actual auth logic here.
    console.log(`${isLogin ? 'Logging in' : 'Signing up'} as ${role}`, { name: isLogin ? 'N/A' : name, email, password });
    onAuthSuccess({ name: isLogin ? email.split('@')[0] : name, email });
  };

  const portalName = role === 'teacher' ? 'Teacher Portal' : 'Student Portal';
  const portalIcon = role === 'teacher' ? <TeacherIcon /> : <StudentIcon />;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md relative">
        <button onClick={onBack} className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors flex items-center gap-2">
            <ArrowLeftIcon />
            Back to Role Selection
        </button>
        <div className="bg-brand-dark-blue border border-brand-border rounded-2xl p-8 pt-16">
          <div className="text-center mb-8">
            <div className="inline-block mb-4">{portalIcon}</div>
            <h1 className="text-3xl font-bold">{portalName}</h1>
            <p className="text-gray-400">{isLogin ? 'Sign in to your account' : 'Create a new account'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-brand-cyan focus:outline-none"
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-brand-cyan focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="password"className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-brand-cyan focus:outline-none"
              />
            </div>
            
            {!isLogin && (
              <div className="text-xs text-gray-400 pt-1 space-y-1">
                <ul className="list-disc list-inside pl-1">
                  <li>At least 8 characters</li>
                  <li>An uppercase and lowercase letter</li>
                  <li>A number and a special character</li>
                </ul>
              </div>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              className="w-full bg-brand-cyan text-white font-bold py-3 px-6 rounded-lg hover:bg-cyan-500 transition-colors duration-300"
            >
              {isLogin ? 'Login' : 'Sign Up'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-400">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="font-semibold text-brand-cyan hover:underline ml-1"
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;