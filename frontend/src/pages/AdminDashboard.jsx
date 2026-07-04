import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/axiosInstance';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const LANGUAGES = ['German', 'English', 'Both'];

const emptyScheduleSlot = () => ({ day: '', startTime: '', endTime: '', room: '' });

const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

const formatSchedule = (schedule) => {
    if (!schedule?.length) return 'No schedule set';
    return schedule
        .filter((s) => s.day)
        .map((s) => `${s.day} ${s.startTime || '?'}–${s.endTime || '?'}${s.room ? ` · ${s.room}` : ''}`)
        .join(' | ') || 'No schedule set';
};

const inputClass = 'w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none';
const amberInputClass = 'w-full bg-amber-900/20 border border-amber-500/50 rounded-lg p-2.5 text-white text-sm focus:border-amber-400 focus:outline-none';
const labelClass = 'block text-xs text-slate-400 mb-1';
const amberLabelClass = 'block text-xs text-amber-400 mb-1';

function ScheduleEditor({ schedule, onChange }) {
    const slots = schedule?.length ? schedule : [emptyScheduleSlot()];

    const updateSlot = (index, field, value) => {
        const updated = slots.map((s, i) => (i === index ? { ...s, [field]: value } : s));
        onChange(updated);
    };

    const addSlot = () => onChange([...slots, emptyScheduleSlot()]);

    const removeSlot = (index) => {
        if (slots.length === 1) {
            onChange([emptyScheduleSlot()]);
            return;
        }
        onChange(slots.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-3">
            {slots.map((slot, index) => (
                <div key={index} className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end p-3 rounded-xl bg-slate-950/60 border border-white/5">
                    <div>
                        <label className={labelClass}>Day</label>
                        <select
                            value={slot.day || ''}
                            onChange={(e) => updateSlot(index, 'day', e.target.value)}
                            className={inputClass}
                        >
                            <option value="">Select day</option>
                            {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Start</label>
                        <input type="time" value={slot.startTime || ''} onChange={(e) => updateSlot(index, 'startTime', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>End</label>
                        <input type="time" value={slot.endTime || ''} onChange={(e) => updateSlot(index, 'endTime', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Room / Hall</label>
                        <input type="text" placeholder="e.g. A-101" value={slot.room || ''} onChange={(e) => updateSlot(index, 'room', e.target.value)} className={inputClass} />
                    </div>
                    <div className="flex justify-end">
                        <button type="button" onClick={() => removeSlot(index)} className="px-3 py-2 text-red-400 hover:text-red-300 text-xs font-bold">Remove</button>
                    </div>
                </div>
            ))}
            <button type="button" onClick={addSlot} className="text-xs text-indigo-400 hover:text-indigo-300 font-bold">+ Add session</button>
        </div>
    );
}

function CourseDetailBadges({ course }) {
    return (
        <div className="flex gap-2 mt-2 flex-wrap">
            <span className="text-[10px] uppercase bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">Sem: {course.semester || '—'}</span>
            <span className="text-[10px] uppercase bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">{course.language || '—'}</span>
            <span className="text-[10px] uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">{course.examType || '—'}</span>
            <span className={`text-[10px] uppercase px-2 py-0.5 rounded ${course.isActive !== false ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                {course.isActive !== false ? 'Active' : 'Inactive'}
            </span>
        </div>
    );
}

export default function AdminDashboard() {
    const [courses, setCourses] = useState([]);
    const [isFetchingCourses, setIsFetchingCourses] = useState(true);
    const [editingCourse, setEditingCourse] = useState(null);

    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [draftCourses, setDraftCourses] = useState([]);

    const [urls, setUrls] = useState([]);
    const [newUrl, setNewUrl] = useState('');
    const [newUrlDescription, setNewUrlDescription] = useState('');
    const [isFetchingUrls, setIsFetchingUrls] = useState(true);
    const [scrapingUrlId, setScrapingUrlId] = useState(null);
    const [isTriggeringScraping, setIsTriggeringScraping] = useState(false);

    useEffect(() => {
        fetchCourses();
        fetchUrls();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await api.get('/student/all-courses');
            setCourses(Array.isArray(res.data) ? res.data : res.data.data || []);
        } catch {
            toast.error('Failed to load courses.');
        } finally {
            setIsFetchingCourses(false);
        }
    };

    const fetchUrls = async () => {
        try {
            const res = await api.get('/admin/scrape-targets');
            setUrls(Array.isArray(res.data) ? res.data : res.data.data || []);
        } catch {
            toast.error('Failed to load scrape targets.');
        } finally {
            setIsFetchingUrls(false);
        }
    };

    const cleanScheduleForSave = (schedule) =>
        (schedule || []).filter((s) => s.day && s.startTime && s.endTime);

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!file) return toast.error('Please select a PDF file first.');

        const formData = new FormData();
        formData.append('pdfFile', file);

        setIsUploading(true);
        try {
            const res = await api.post('/admin/upload-pdf', formData);
            const extracted = res.data.extractedCourses || [];
            const initializedDrafts = extracted.map((course) => ({
                name: course.name || '',
                description: course.description || '',
                language: LANGUAGES.includes(course.language) ? course.language : 'German',
                examType: course.examType || '',
                semester: '',
                schedule: [emptyScheduleSlot()],
                isActive: true,
            }));
            setDraftCourses(initializedDrafts);
            toast.success(`${initializedDrafts.length} course(s) extracted. Review and complete missing fields.`);
            setFile(null);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to process PDF.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDraftChange = (index, field, value) => {
        setDraftCourses((prev) => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
    };

    const handleDraftScheduleChange = (index, schedule) => {
        handleDraftChange(index, 'schedule', schedule);
    };

    const handleSaveDraft = async (index) => {
        const draft = draftCourses[index];
        if (!draft.name?.trim() || !draft.description?.trim() || !draft.semester?.trim()) {
            return toast.error('Name, Description, and Semester are required.');
        }

        const payload = {
            ...draft,
            schedule: cleanScheduleForSave(draft.schedule),
        };

        try {
            await toast.promise(api.post('/admin/save-courses', { courses: [payload] }), {
                loading: `Saving ${draft.name}...`,
                success: 'Course saved and embedded successfully!',
                error: (err) => err.response?.data?.message || 'Failed to save course.',
            });
            setDraftCourses((prev) => prev.filter((_, i) => i !== index));
            fetchCourses();
        } catch {
            toast.error('Failed to save course.');

        }
    };

    const handleDeleteCourse = async (id) => {
        if (!window.confirm('Are you sure you want to delete this course?')) return;
        toast.promise(api.delete(`/admin/course/${id}`), {
            loading: 'Deleting...',
            success: 'Course deleted.',
            error: 'Failed to delete.',
        }).then(() => fetchCourses());
    };

    const openEditCourse = (course) => {
        setEditingCourse({
            ...course,
            schedule: course.schedule?.length ? course.schedule.map((s) => ({ ...s })) : [emptyScheduleSlot()],
        });
    };

    const handleUpdateCourse = async (e) => {
        e.preventDefault();
        const payload = {
            name: editingCourse.name,
            description: editingCourse.description,
            language: editingCourse.language,
            examType: editingCourse.examType,
            semester: editingCourse.semester,
            isActive: editingCourse.isActive,
            schedule: cleanScheduleForSave(editingCourse.schedule),
        };

        toast.promise(api.put(`/admin/course/${editingCourse._id}`, payload), {
            loading: 'Updating...',
            success: 'Course updated successfully.',
            error: (err) => err.response?.data?.message || 'Failed to update.',
        }).then(() => {
            setEditingCourse(null);
            fetchCourses();
        });
    };

    const handleAddUrl = async (e) => {
        e.preventDefault();
        if (!newUrl.trim()) return toast.error('Please enter a valid URL.');
        if (!newUrlDescription.trim()) return toast.error('Please enter a description for this URL.');

        toast.promise(api.post('/admin/add-target', { url: newUrl.trim(), description: newUrlDescription.trim() }), {
            loading: 'Adding URL...',
            success: 'URL added to scrape queue!',
            error: (err) => err.response?.data?.message || 'Failed to add URL.',
        }).then(() => {
            setNewUrl('');
            setNewUrlDescription('');
            fetchUrls();
        });
    };

    const handleDeleteUrl = async (id) => {
        if (!window.confirm('Delete this scrape target?')) return;
        toast.promise(api.delete(`/admin/remove-target/${id}`), {
            loading: 'Deleting...',
            success: 'URL removed.',
            error: 'Failed to delete.',
        }).then(() => fetchUrls());
    };

    const handleScrapeSingleUrl = async (target) => {
        setScrapingUrlId(target._id);
        try {
            await toast.promise(api.post('/admin/scrape-url', { url: target.url }), {
                loading: `Scraping ${target.url}...`,
                success: 'Page scraped and vectorized for chatbot!',
                error: (err) => err.response?.data?.message || 'Scraping failed.',
            });
            fetchUrls();
        } finally {
            setScrapingUrlId(null);
        }
    };

    const handleTriggerScraping = async () => {
        setIsTriggeringScraping(true);
        try {
            const res = await toast.promise(api.post('/admin/trigger-scraping'), {
                loading: 'Scraping all targets...',
                success: (response) => response?.data?.message || 'Knowledge base updated!',
                error: (err) => err.response?.data?.message || 'Scraping failed.',
            });
            if (res?.data?.summary?.failed > 0) {
                toast.error(`${res.data.summary.failed} target(s) failed to scrape.`);
            }
            fetchUrls();
        } finally {
            setIsTriggeringScraping(false);
        }
    };

    return (
        <div className="flex-1 bg-slate-950 p-6 md:p-10 relative overflow-y-auto h-screen custom-scrollbar">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto z-10 relative space-y-10 pb-20">
                <div>
                    <h1 className="text-3xl font-bold text-white">Admin Command Center</h1>
                    <p className="text-slate-400 mt-2">
                        Upload syllabus PDFs, review AI-extracted courses, manage the full course catalog, and control RAG scrape targets.
                    </p>
                </div>

                <div className="bg-white/[0.02] border border-indigo-500/30 backdrop-blur-md rounded-2xl p-6">
                    <h2 className="text-xl font-semibold text-indigo-300 mb-1 flex items-center gap-2">📄 1. Syllabus Extraction Workflow</h2>
                    <p className="text-slate-500 text-sm mb-4">AI extracts name, description, language, and exam type. You complete semester, schedule, and room details before saving.</p>

                    <form onSubmit={handleFileUpload} className="flex gap-4 items-center mb-8">
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => setFile(e.target.files[0])}
                            className="flex-1 text-sm text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20 cursor-pointer"
                        />
                        <button
                            type="submit"
                            disabled={!file || isUploading}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 whitespace-nowrap"
                        >
                            {isUploading ? 'Extracting via AI...' : 'Upload & Extract'}
                        </button>
                    </form>

                    {draftCourses.length > 0 && (
                        <div className="space-y-6 border-t border-white/10 pt-6">
                            <h3 className="text-lg font-medium text-amber-400 flex items-center gap-2">
                                ⚠️ Review Extracted Courses ({draftCourses.length})
                            </h3>

                            {draftCourses.map((draft, index) => (
                                <div key={index} className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-5 shadow-lg space-y-5">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-white font-bold">Draft Course #{index + 1}</h4>
                                        <span className="text-[10px] uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">AI Extracted</span>
                                    </div>

                                   
                                    <div>
                                        <p className="text-xs text-emerald-400/80 mb-3 font-semibold uppercase tracking-wide">Extracted by AI</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="lg:col-span-2">
                                                <label className={labelClass}>Course Name *</label>
                                                <input type="text" value={draft.name} onChange={(e) => handleDraftChange(index, 'name', e.target.value)} className={`${inputClass} border-emerald-500/20`} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Language</label>
                                                <select value={draft.language} onChange={(e) => handleDraftChange(index, 'language', e.target.value)} className={`${inputClass} border-emerald-500/20`}>
                                                    {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className={labelClass}>Exam Type</label>
                                                <input type="text" value={draft.examType} onChange={(e) => handleDraftChange(index, 'examType', e.target.value)} className={`${inputClass} border-emerald-500/20`} />
                                            </div>
                                            <div className="lg:col-span-4">
                                                <label className={labelClass}>Description *</label>
                                                <textarea value={draft.description} onChange={(e) => handleDraftChange(index, 'description', e.target.value)} rows={3} className={`${inputClass} border-emerald-500/20 custom-scrollbar`} />
                                            </div>
                                        </div>
                                    </div>

                               
                                    <div>
                                        <p className="text-xs text-amber-400/80 mb-3 font-semibold uppercase tracking-wide">Complete manually</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className={amberLabelClass}>Semester *</label>
                                                <input type="text" placeholder="e.g. Winter 2026" value={draft.semester} onChange={(e) => handleDraftChange(index, 'semester', e.target.value)} className={amberInputClass} />
                                            </div>
                                            <div className="flex items-end">
                                                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer pb-2.5">
                                                    <input type="checkbox" checked={draft.isActive !== false} onChange={(e) => handleDraftChange(index, 'isActive', e.target.checked)} className="rounded border-white/20 bg-slate-950 text-indigo-500" />
                                                    Active course
                                                </label>
                                            </div>
                                        </div>
                                        <label className={amberLabelClass}>Schedule (Day · Time · Room)</label>
                                        <ScheduleEditor schedule={draft.schedule} onChange={(s) => handleDraftScheduleChange(index, s)} />
                                    </div>

                                    <div className="flex justify-end pt-2 border-t border-white/5">
                                        <button type="button" onClick={() => handleSaveDraft(index)} className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-all">
                                            Save Course to Database
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-2 bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-2xl p-6 flex flex-col min-h-[640px] max-h-[800px]">
                        <h2 className="text-xl font-semibold text-white mb-1">📚 2. Course Catalog</h2>
                        <p className="text-slate-500 text-sm mb-4">All fields from the Course model — full details with edit & delete.</p>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                            {isFetchingCourses ? (
                                <div className="text-slate-400 text-center mt-10 animate-pulse">Loading courses...</div>
                            ) : courses.length === 0 ? (
                                <div className="text-slate-500 text-center mt-10">No courses in the database.</div>
                            ) : (
                                courses.map((course) => (
                                    <div key={course._id} className="p-5 rounded-xl bg-slate-900/50 border border-white/5 hover:border-white/20 transition-all">
                                        <div className="flex justify-between items-start gap-3 mb-3">
                                            <div className="min-w-0">
                                                <h3 className="text-white font-bold text-lg">{course.name}</h3>
                                                <CourseDetailBadges course={course} />
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <button onClick={() => openEditCourse(course)} className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 rounded-lg text-xs font-bold transition-all">Edit</button>
                                                <button onClick={() => handleDeleteCourse(course._id)} className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-lg text-xs font-bold transition-all">Delete</button>
                                            </div>
                                        </div>

                                        <p className="text-slate-400 text-sm mb-3">{course.description}</p>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                            <div className="p-2.5 rounded-lg bg-slate-950/50 border border-white/5">
                                                <span className="text-slate-500 block mb-0.5">Schedule</span>
                                                <span className="text-slate-300">{formatSchedule(course.schedule)}</span>
                                            </div>
                                            <div className="p-2.5 rounded-lg bg-slate-950/50 border border-white/5">
                                                <span className="text-slate-500 block mb-0.5">Exam Type</span>
                                                <span className="text-slate-300">{course.examType || '—'}</span>
                                            </div>
                                            <div className="p-2.5 rounded-lg bg-slate-950/50 border border-white/5">
                                                <span className="text-slate-500 block mb-0.5">Created</span>
                                                <span className="text-slate-300">{formatDate(course.createdAt)}</span>
                                            </div>
                                            <div className="p-2.5 rounded-lg bg-slate-950/50 border border-white/5">
                                                <span className="text-slate-500 block mb-0.5">Last Updated</span>
                                                <span className="text-slate-300">{formatDate(course.updatedAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-2xl p-6 flex flex-col min-h-[640px] max-h-[800px]">
                        <h2 className="text-xl font-semibold text-white mb-1">🌐 3. RAG Scrape Targets</h2>
                        <p className="text-slate-500 text-sm mb-4">URLs stored in ScrapeTarget — scraped by cron or manually per link.</p>

                        <form onSubmit={handleAddUrl} className="mb-6 space-y-3">
                            <input
                                type="url"
                                value={newUrl}
                                onChange={(e) => setNewUrl(e.target.value)}
                                placeholder="https://www.hs-bremen.de/..."
                                className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm"
                                required
                            />
                            <input
                                type="text"
                                value={newUrlDescription}
                                onChange={(e) => setNewUrlDescription(e.target.value)}
                                placeholder="Description (e.g. Admissions page)"
                                className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm"
                                required
                            />
                            <button type="submit" className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm transition-all">
                                Add Scrape Target
                            </button>
                            <button
                                type="button"
                                disabled={isTriggeringScraping || urls.length === 0}
                                onClick={handleTriggerScraping}
                                className="w-full py-2.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-xl font-bold text-sm transition-all border border-indigo-500/30 disabled:opacity-50"
                            >
                                {isTriggeringScraping ? 'Scraping all...' : 'Scrape All Targets ⚡'}
                            </button>
                        </form>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                            {isFetchingUrls ? (
                                <div className="text-slate-400 text-center text-sm">Loading...</div>
                            ) : urls.length === 0 ? (
                                <div className="text-slate-500 text-center text-sm">No scrape targets yet.</div>
                            ) : (
                                urls.map((target) => (
                                    <div key={target._id} className="p-4 rounded-xl bg-slate-900/50 border border-white/5 group hover:border-indigo-500/30 transition-all">
                                        <div className="flex justify-between items-start gap-2 mb-2">
                                            <a href={target.url} target="_blank" rel="noreferrer" className="text-blue-400 text-xs hover:underline break-all leading-relaxed">
                                                {target.url}
                                            </a>
                                            <button onClick={() => handleDeleteUrl(target._id)} className="text-red-400 hover:text-red-300 text-xs font-bold shrink-0 opacity-70 group-hover:opacity-100">Delete</button>
                                        </div>
                                        {target.description && (
                                            <p className="text-slate-400 text-xs mb-2">{target.description}</p>
                                        )}
                                        <div className="flex flex-wrap gap-2 text-[10px] mb-3">
                                            <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded">Added: {formatDate(target.createdAt)}</span>
                                            <span className={`px-2 py-0.5 rounded ${target.lastScrapedAt ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                                Last scraped: {formatDate(target.lastScrapedAt)}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            disabled={scrapingUrlId === target._id}
                                            onClick={() => handleScrapeSingleUrl(target)}
                                            className="w-full py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-lg text-xs font-bold border border-indigo-500/30 transition-all disabled:opacity-50"
                                        >
                                            {scrapingUrlId === target._id ? 'Scraping...' : 'Scrape Now ⚡'}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {editingCourse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="w-full max-w-3xl bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
                        <h2 className="text-2xl font-bold text-white mb-1">Edit Course</h2>
                        <p className="text-slate-500 text-sm mb-6">Update all course fields. Schedule supports multiple sessions.</p>

                        <form onSubmit={handleUpdateCourse} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className={labelClass}>Course Name *</label>
                                    <input type="text" required value={editingCourse.name} onChange={(e) => setEditingCourse({ ...editingCourse, name: e.target.value })} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Semester *</label>
                                    <input type="text" required value={editingCourse.semester || ''} onChange={(e) => setEditingCourse({ ...editingCourse, semester: e.target.value })} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Language</label>
                                    <select value={editingCourse.language || 'German'} onChange={(e) => setEditingCourse({ ...editingCourse, language: e.target.value })} className={inputClass}>
                                        {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Exam Type</label>
                                    <input type="text" value={editingCourse.examType || ''} onChange={(e) => setEditingCourse({ ...editingCourse, examType: e.target.value })} className={inputClass} />
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer pb-2.5">
                                        <input type="checkbox" checked={editingCourse.isActive !== false} onChange={(e) => setEditingCourse({ ...editingCourse, isActive: e.target.checked })} className="rounded border-white/20 bg-slate-950 text-indigo-500" />
                                        Active course
                                    </label>
                                </div>
                                <div className="md:col-span-2">
                                    <label className={labelClass}>Description *</label>
                                    <textarea required rows={4} value={editingCourse.description || ''} onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })} className={`${inputClass} custom-scrollbar`} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className={labelClass}>Schedule</label>
                                    <ScheduleEditor
                                        schedule={editingCourse.schedule}
                                        onChange={(schedule) => setEditingCourse({ ...editingCourse, schedule })}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3 border-t border-white/10">
                                <button type="button" onClick={() => setEditingCourse(null)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg transition-all">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
