import { useContext } from 'react';
import { Link} from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Home() {
    const { user  } = useContext(AuthContext);
   

    return (
        <div className="flex-1 bg-slate-950 text-white relative overflow-hidden flex flex-col justify-center items-center px-6 py-20">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 blur-[140px] rounded-full pointer-events-none" />

            <div className="max-w-4xl mx-auto text-center z-10 space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-xs md:text-sm font-medium backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                    Hochschule Bremen • AI Academic Portal
                </div>

                <h1 className="text-4xl sm:text-6xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent leading-tight">
                    Smart Course Selection <br className="hidden sm:inline" /> Powered by Gemini
                </h1>

                <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
                    Say goodbye to timetable clashes. Experience Vector-based semantic searching, automated RAG advising, and intelligent conflict-free scheduling.
                </p>

                <div className="pt-4 flex flex-wrap justify-center gap-4">
                    {user ? (
                        <Link
                            to={user.role === 'admin' ? '/admin' : '/student'}
                            className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-bold text-white shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 active:scale-95"
                        >
                            Go to {user.role === 'admin' ? 'Admin Dashboard' : 'Student Portal'} →
                        </Link>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-bold text-white shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 active:scale-95"
                            >
                                Get Started (Sign In)
                            </Link>
                           
                        </>
                    )}
                </div>
            </div>

            <div id="architecture" className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mt-28 z-10 w-full">
                <div className="p-7 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-sm space-y-3 hover:border-blue-500/30 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-xl">🧠</div>
                    <h3 className="text-lg font-bold text-white">Semantic RAG Engine</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">Queries are converted to 768-dimensional vectors to find modules based on intent, not just keyword matching.</p>
                </div>

                <div className="p-7 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-sm space-y-3 hover:border-indigo-500/30 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xl">🛡️</div>
                    <h3 className="text-lg font-bold text-white">Enterprise Security</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">Protected by strict Role-Based Access Control (RBAC), Bcrypt salting, and XSS-immune HttpOnly Cookies.</p>
                </div>

                <div className="p-7 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-sm space-y-3 hover:border-purple-500/30 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold text-xl">⚡</div>
                    <h3 className="text-lg font-bold text-white">Automated Pipelines</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">Admins can ingest syllabus PDFs or trigger live web-scraping directly into MongoDB Atlas.</p>
                </div>
            </div>
        </div>
    );
}