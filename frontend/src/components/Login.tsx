import React, { useState } from 'react';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import type { User } from '../types';
import Button from './Button';

interface Props {
    onLogin: (user: User) => void;
}

const Login: React.FC<Props> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                onLogin({ username: data.username, role: data.role });
            } else {
                setError(data.detail || 'Invalid credentials. Please check your username and password.');
                setLoading(false);
            }
        } catch (err) {
            setError('Connection failed. Is the backend running?');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-slate-900 font-sans">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="flex flex-col items-center mb-8">
                        <img
                            src="/logo.png"
                            alt="Gigaforce Logo"
                            className="w-48 h-auto mb-6 object-contain"
                        />
                        <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent tracking-tight">Welcome Back</h1>
                        <p className="text-slate-500 text-sm mt-3 font-medium">Gigaforce Demand Package Portal</p>
                    </div>

                    <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm text-left">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Username or Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        required
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
                                        placeholder="admin_username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-bold text-slate-700">Password</label>
                                    <a href="#" className="text-sm text-indigo-600 font-medium hover:underline">Forgot?</a>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                                    <input
                                        type="password"
                                        required
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-xs font-bold text-center">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full py-4 text-base shadow-lg shadow-indigo-100 mt-2"
                                isLoading={loading}
                            >
                                Sign In to Portal
                                {!loading && <ArrowRight className="w-5 h-5 ml-2" />}
                            </Button>
                        </form>

                        <div className="mt-8 pt-8 border-t border-slate-200 text-center">
                            <p className="text-sm text-slate-500">
                                Don't have an account? <a href="#" className="text-indigo-600 font-bold hover:underline">Contact Sales</a>
                            </p>
                        </div>
                    </div>

                    <p className="text-center text-xs text-slate-400 mt-10 font-medium">
                        &copy; 2026 Gigaforce Systems Inc. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
