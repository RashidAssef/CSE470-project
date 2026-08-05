/**
 * True if the user may edit course content (primary or co-instructor, or admin).
 */
export const canManageCourse = (course, user) => {
  if (!course || !user) return false;
  if (user.role === 'admin') return true;
  if (user.role !== 'instructor') return false;

  const userId = user._id.toString();
  const instructorId = (course.instructor?._id || course.instructor).toString();
  if (instructorId === userId) return true;

  return (course.coInstructors || []).some((id) => (id._id || id).toString() === userId);
};
