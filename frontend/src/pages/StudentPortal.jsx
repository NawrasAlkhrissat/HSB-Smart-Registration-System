import { useState, useEffect, useContext, useMemo } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import api from "../utils/axiosInstance";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

const formatSchedule = (schedule) => {
  if (!schedule?.length) return "No schedule set";
  return schedule
    .filter((s) => s.day)
    .map(
      (s) =>
        `${s.day} ${s.startTime || "?"}–${s.endTime || "?"}${s.room ? ` · ${s.room}` : ""}`
    )
    .join(" | ");
};

const hasTimeConflict = (newCourse, existingSchedule) => {
  if (!newCourse.schedule?.length) return false;

  for (const course of existingSchedule) {
    if (!course.schedule?.length) continue;
    for (const newSched of newCourse.schedule) {
      for (const existingSched of course.schedule) {
        if (existingSched.day !== newSched.day) continue;
        const newStart = timeToMinutes(newSched.startTime);
        const newEnd = timeToMinutes(newSched.endTime);
        const existingStart = timeToMinutes(existingSched.startTime);
        const existingEnd = timeToMinutes(existingSched.endTime);
        if (Math.max(newStart, existingStart) < Math.min(newEnd, existingEnd)) {
          return course.name;
        }
      }
    }
  }
  return false;
};

function CourseBadges({ course }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {course.semester && (
        <span className="text-[10px] uppercase bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
          Sem: {course.semester}
        </span>
      )}
      <span className="text-[10px] uppercase bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
        {course.language || "—"}
      </span>
      {course.examType && (
        <span className="text-[10px] uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
          {course.examType}
        </span>
      )}
    </div>
  );
}

function CourseCard({ course, isAdded, onAdd, onRemove, conflictWith, reason }) {
  const canAdd = !isAdded && !conflictWith;

  return (
    <div
      className={`p-5 rounded-xl border transition-all ${
        isAdded
          ? "bg-emerald-900/10 border-emerald-500/30"
          : conflictWith
            ? "bg-slate-900/30 border-white/5 opacity-60"
            : "bg-slate-900/50 border-white/5 hover:border-indigo-500/30"
      }`}
    >
      <h4 className="font-bold text-white mb-2 leading-tight">{course.name}</h4>
      <CourseBadges course={course} />

      <div className="bg-slate-950/50 p-2.5 rounded-lg text-xs text-slate-300 mt-3 mb-4 border border-white/5 font-medium">
        {formatSchedule(course.schedule)}
      </div>

      {reason && (
        <p className="text-xs text-amber-400/90 mb-3 font-medium">Reason: {reason}</p>
      )}

      {conflictWith && !isAdded && (
        <p className="text-xs text-red-400/90 mb-3">
          Conflicts with &quot;{conflictWith}&quot; in your current schedule.
        </p>
      )}

      {isAdded ? (
        <button
          onClick={() => onRemove(course._id)}
          className="w-full bg-red-500/10 text-red-400 py-2.5 rounded-lg font-bold hover:bg-red-500/20 border border-red-500/20 text-sm transition-colors"
        >
          Remove from Schedule
        </button>
      ) : (
        <button
          onClick={() => onAdd(course)}
          disabled={!!conflictWith}
          className="w-full bg-blue-500/10 text-blue-400 py-2.5 rounded-lg font-bold hover:bg-blue-500/20 border border-blue-500/20 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          + Add to Schedule
        </button>
      )}
    </div>
  );
}

export default function StudentPortal() {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === "admin";
  const [adminTargetId, setAdminTargetId] = useState("");

  const [activeTab, setActiveTab] = useState("ai");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");

  const [allCourses, setAllCourses] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [rejectedCourses, setRejectedCourses] = useState([]);

  const [mySchedule, setMySchedule] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [scheduleLoaded, setScheduleLoaded] = useState(false);

  const loadSchedule = async (targetStudentId) => {
    if (!user) return;

    setLoadingSchedule(true);
    try {
      const url =
        isAdmin && targetStudentId?.trim()
          ? `/student/my-schedule/${targetStudentId.trim()}`
          : "/student/my-schedule";
      const response = await api.get(url);
      setMySchedule(response.data.schedule || []);
      setScheduleLoaded(true);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error("Load error:", error);
        toast.error(error.response?.data?.message || "Failed to load schedule.");
      } else {
        setMySchedule([]);
        setScheduleLoaded(true);
      }
    } finally {
      setLoadingSchedule(false);
    }
  };

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await api.get("/student/all-courses");
        const courses = Array.isArray(res.data) ? res.data : res.data.data || [];
        setAllCourses(courses.filter((c) => c.isActive !== false));
      } catch (err) {
        console.error("Failed to load catalog", err);
        toast.error("Failed to load course catalog.");
      }
    };
    fetchCatalog();
  }, []);

  useEffect(() => {
    if (user) {
      loadSchedule(isAdmin ? adminTargetId : undefined);
    }
  }, [user?._id]);

  const filteredCatalog = useMemo(() => {
    const term = catalogSearch.trim().toLowerCase();
    if (!term) return allCourses;
    return allCourses.filter(
      (c) =>
        c.name?.toLowerCase().includes(term) ||
        c.description?.toLowerCase().includes(term) ||
        c.language?.toLowerCase().includes(term) ||
        c.semester?.toLowerCase().includes(term)
    );
  }, [allCourses, catalogSearch]);

  const handleAddCourse = (course) => {
    if (!course?._id) return;

    if (mySchedule.find((c) => c._id === course._id)) {
      return toast.error("This course is already in your schedule!");
    }

    const conflictCourseName = hasTimeConflict(course, mySchedule);
    if (conflictCourseName) {
      return toast.error(
        `Time conflict! "${course.name}" overlaps with "${conflictCourseName}".`
      );
    }

    setMySchedule((prev) => [...prev, course]);
    toast.success(`${course.name} added to schedule.`);
  };

  const handleRemoveCourse = (courseId) => {
    setMySchedule((prev) => prev.filter((c) => c._id !== courseId));
    toast.success("Course removed.");
  };

  const handleAISearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return toast.error("Please enter your scheduling preferences.");

    setLoading(true);
    try {
      const response = await api.post("/student/suggest-courses", {
        studentQuery: query.trim(),
      });

      const { aiAnalysis: analysis, finalSchedule, ignoredCoursesDetails } = response.data;

      setAiAnalysis(analysis);
      setMySchedule(finalSchedule || []);
      setRejectedCourses(ignoredCoursesDetails || []);
      toast.success("AI generated your schedule. Review and adjust as needed.");
    } catch (error) {
      toast.error(error.response?.data?.message || "AI search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (mySchedule.length === 0) return toast.error("Your schedule is empty!");

    setSaving(true);
    try {
      const courseIds = mySchedule.map((c) => c._id);
      const payload = { courseIds };
      if (isAdmin && adminTargetId.trim()) {
        payload.targetStudentId = adminTargetId.trim();
      }
      await api.post("/student/save-schedule", payload);
      toast.success("Schedule saved successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save schedule.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-950 p-6 md:p-10 relative overflow-y-auto h-screen custom-scrollbar">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto z-10 relative space-y-10 pb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Student Timetable Builder</h1>
            <p className="text-slate-400 mt-2">
              Build your perfect schedule with AI assistance or explore the full catalog manually.
            </p>
          </div>
          {user && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">
                {user.name?.charAt(0) || "S"}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{user.name}</p>
                <p className="text-xs text-slate-400">
                  {user.studentId ? `ID: ${user.studentId}` : isAdmin ? "Admin account" : "Student account"}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-2xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h2 className="text-xl font-semibold text-white">Your Weekly Timetable</h2>
              <p className="text-slate-500 text-sm mt-1">
                {loadingSchedule
                  ? "Loading your saved schedule..."
                  : scheduleLoaded && mySchedule.length === 0
                    ? "No courses yet — use AI or the catalog below."
                    : `${mySchedule.length} course(s) in your schedule`}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {isAdmin && (
                <input
                  type="text"
                  placeholder="Student ID (optional)"
                  value={adminTargetId}
                  onChange={(e) => setAdminTargetId(e.target.value)}
                  className="px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm w-44"
                  title="Leave empty to manage your own schedule, or enter a Student ID to load/save for another user"
                />
              )}
              <button
                onClick={() => loadSchedule(isAdmin ? adminTargetId : undefined)}
                disabled={loadingSchedule}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50"
              >
                {loadingSchedule ? "Loading..." : "Reload Schedule"}
              </button>
              <button
                onClick={handleSaveSchedule}
                disabled={saving || mySchedule.length === 0}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Schedule"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {DAYS.map((day) => {
              const coursesOnDay = mySchedule
                .filter((c) => c.schedule?.some((s) => s.day === day))
                .flatMap((course) =>
                  course.schedule
                    .filter((s) => s.day === day)
                    .map((slot) => ({ course, slot }))
                )
                .sort((a, b) =>
                  (a.slot.startTime || "").localeCompare(b.slot.startTime || "")
                );

              return (
                <div
                  key={day}
                  className="bg-slate-900/40 rounded-xl border border-white/5 min-h-[250px] flex flex-col overflow-hidden"
                >
                  <div className="bg-indigo-500/10 border-b border-indigo-500/20 text-indigo-300 text-center py-2.5 font-bold uppercase tracking-wider text-xs">
                    {day}
                  </div>
                  <div className="p-3 space-y-3 flex-1">
                    {coursesOnDay.length === 0 ? (
                      <p className="text-xs text-center text-slate-500 mt-4 italic">Free day</p>
                    ) : (
                      coursesOnDay.map(({ course, slot }) => (
                        <div
                          key={`${course._id}-${slot.startTime}`}
                          className="bg-slate-800/80 border-l-4 border-indigo-500 p-3 rounded-lg shadow-sm relative group transition-all hover:bg-slate-800"
                        >
                          <p className="text-sm font-bold text-white leading-tight pr-4">
                            {course.name}
                          </p>
                          <div className="mt-2 space-y-1">
                            <p className="text-[11px] text-slate-400">
                              {slot.startTime} – {slot.endTime}
                            </p>
                            {slot.room && (
                              <p className="text-[11px] font-semibold text-indigo-400">
                                {slot.room}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveCourse(course._id)}
                            className="absolute top-2 right-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded p-1 opacity-0 group-hover:opacity-100 transition-all"
                            title="Remove from schedule"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveTab("ai")}
            className={`py-2.5 px-6 font-bold text-sm rounded-xl transition-all ${
              activeTab === "ai"
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-inner"
                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            AI Assistant
          </button>
          <button
            onClick={() => setActiveTab("catalog")}
            className={`py-2.5 px-6 font-bold text-sm rounded-xl transition-all ${
              activeTab === "catalog"
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-inner"
                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            Full Course Catalog
          </button>
        </div>

        {activeTab === "ai" && (
          <div className="space-y-6">
            <form
              onSubmit={handleAISearch}
              className="bg-white/[0.02] p-6 rounded-2xl border border-indigo-500/20 backdrop-blur-md flex flex-col md:flex-row gap-4"
            >
              <textarea
                rows="2"
                placeholder='What do you want to study? (e.g., "Business courses, no Friday mornings, max 4 courses in English")'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-slate-900/50 border border-white/10 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm resize-none custom-scrollbar"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-4 md:py-auto rounded-xl font-bold transition-all disabled:opacity-50 shrink-0 shadow-lg shadow-indigo-500/20"
              >
                {loading ? "Analyzing..." : "Generate AI Schedule"}
              </button>
            </form>

            {aiAnalysis && (
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-sm space-y-2">
                <p>
                  <strong className="text-indigo-300">AI understood:</strong>{" "}
                  {typeof aiAnalysis === "string"
                    ? aiAnalysis
                    : aiAnalysis.semanticQuery || JSON.stringify(aiAnalysis)}
                </p>
                {aiAnalysis.constraints && (
                  <p className="text-slate-400 text-xs">
                    Max courses: {aiAnalysis.constraints.maxCourses ?? "—"} · Language:{" "}
                    {aiAnalysis.constraints.preferredLanguage ?? "—"}
                    {aiAnalysis.constraints.avoidDays?.length > 0 &&
                      ` · Avoid: ${aiAnalysis.constraints.avoidDays.join(", ")}`}
                  </p>
                )}
              </div>
            )}

            {rejectedCourses.length > 0 && (
              <div className="bg-white/[0.02] p-6 rounded-2xl border border-amber-500/20 backdrop-blur-md">
                <h3 className="font-bold text-amber-400 mb-1">
                  Excluded Courses ({rejectedCourses.length})
                </h3>
                <p className="text-sm text-slate-400 mb-5">
                  The AI excluded these based on your preferences or time conflicts. You can still
                  add any that fit your schedule — conflict checks run automatically.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rejectedCourses.map((item, idx) => {
                    const course = item.course;
                    if (!course) return null;
                    const isAdded = mySchedule.some((c) => c._id === course._id);
                    const conflictWith = isAdded
                      ? null
                      : hasTimeConflict(course, mySchedule);

                    return (
                      <CourseCard
                        key={course._id || idx}
                        course={course}
                        isAdded={isAdded}
                        onAdd={handleAddCourse}
                        onRemove={handleRemoveCourse}
                        conflictWith={conflictWith}
                        reason={item.reason}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "catalog" && (
          <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/10 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">All Available Courses</h3>
                <p className="text-slate-500 text-sm mt-1">
                  Browse and add any course manually. Conflicts are blocked automatically.
                </p>
              </div>
              <input
                type="search"
                placeholder="Search by name, semester, language..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full sm:w-72 px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>

            {filteredCatalog.length === 0 ? (
              <p className="text-slate-500 text-center py-12">No courses match your search.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCatalog.map((course) => {
                  const isAdded = mySchedule.some((c) => c._id === course._id);
                  const conflictWith = isAdded
                    ? null
                    : hasTimeConflict(course, mySchedule);

                  return (
                    <CourseCard
                      key={course._id}
                      course={course}
                      isAdded={isAdded}
                      onAdd={handleAddCourse}
                      onRemove={handleRemoveCourse}
                      conflictWith={conflictWith}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
