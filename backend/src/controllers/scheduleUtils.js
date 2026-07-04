const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

const checkTimeConflict = (scheduleA, scheduleB) => {
    if (scheduleA.day !== scheduleB.day) return false;
    const startA = timeToMinutes(scheduleA.startTime);
    const endA = timeToMinutes(scheduleA.endTime);
    const startB = timeToMinutes(scheduleB.startTime);
    const endB = timeToMinutes(scheduleB.endTime);

    return Math.max(startA, startB) < Math.min(endA, endB);
};

const hasConflictWithSchedule = (newCourse, approvedCourses) => {
    for (const approvedCourse of approvedCourses) {
        for (const newSched of newCourse.schedule) {
            for (const appSched of approvedCourse.schedule) {
                if (checkTimeConflict(newSched, appSched)) {
                    return true;
                }
            }
        }
    }
    return false;
};

module.exports = { hasConflictWithSchedule };