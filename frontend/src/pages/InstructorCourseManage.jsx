import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Upload, Loader2, FileText } from 'lucide-react';
import { authService, courseService, courseFileService, UPLOADS_BASE_URL } from '../services/api.js';
import FilePicker from '../components/FilePicker.jsx';

export default function InstructorCourseManage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [savingModules, setSavingModules] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [materialFile, setMaterialFile] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await courseService.getCourseById(courseId);
      setCourse(data);
      setModules(
        (data.modules || []).map((m) => ({
          title: m.title,
          description: m.description || '',
          order: m.order,
        }))
      );
      const mats = await courseFileService.getMaterials(courseId);
      setMaterials(mats);
      const subs = await courseFileService.getCourseSubmissions(courseId);
      setSubmissions(subs);
    } catch (err) {
      setError(err.message || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'instructor') {
      navigate('/login');
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, navigate]);

  const addModule = () => {
    setModules((prev) => [
      ...prev,
      { title: '', description: '', order: prev.length + 1 },
    ]);
  };

  const updateModule = (index, field, value) => {
    setModules((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  const removeModule = (index) => {
    setModules((prev) =>
      prev.filter((_, i) => i !== index).map((m, i) => ({ ...m, order: i + 1 }))
    );
  };

  const saveModules = async () => {
    setSavingModules(true);
    setMessage('');
    try {
      const saved = await courseService.updateCourseModules(courseId, modules);
      setModules(saved);
      setMessage('Learning path saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingModules(false);
    }
  };

  const handleMaterialUpload = async (e) => {
    e.preventDefault();
    if (!materialFile) return;
    setUploading(true);
    setMessage('');
    try {
      await courseFileService.uploadMaterial(courseId, materialFile);
      setMaterialFile(null);
      e.target.reset();
      const mats = await courseFileService.getMaterials(courseId);
      setMaterials(mats);
      setMessage('Material uploaded.');
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center text-ink-soft">
        {error}
        <Link to="/instructor/dashboard" className="mt-4 block text-primary font-semibold">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link
          to="/instructor/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate hover:text-primary"
        >
          <ArrowLeft size={16} />
          Instructor dashboard
        </Link>

        <h1 className="mt-4 font-display text-2xl font-semibold">{course?.title}</h1>
        <p className="mt-1 text-sm text-ink-soft">Learning path & materials</p>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {message && <p className="mt-4 text-sm text-teal">{message}</p>}

        <section className="mt-8 rounded-2xl border border-line bg-paper-alt p-6">
          <h2 className="font-display text-lg font-semibold">Sequential modules</h2>
          <p className="mt-1 text-sm text-slate">
            Students see these steps in order on the course page.
          </p>

          <div className="mt-4 flex flex-col gap-4">
            {modules.map((mod, index) => (
              <div key={index} className="rounded-xl border border-line bg-paper p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-primary">Module {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeModule(index)}
                    className="text-slate hover:text-red-600"
                    aria-label="Remove module"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <input
                  type="text"
                  value={mod.title}
                  onChange={(e) => updateModule(index, 'title', e.target.value)}
                  placeholder="Module title"
                  className="mt-2 w-full rounded-lg border border-line px-3 py-2 text-sm"
                />
                <textarea
                  value={mod.description}
                  onChange={(e) => updateModule(index, 'description', e.target.value)}
                  placeholder="Short description (optional)"
                  rows={2}
                  className="mt-2 w-full rounded-lg border border-line px-3 py-2 text-sm resize-none"
                />
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={addModule}
              className="inline-flex items-center gap-1 rounded-full border border-line px-4 py-2 text-sm font-semibold"
            >
              <Plus size={16} /> Add module
            </button>
            <button
              type="button"
              onClick={saveModules}
              disabled={savingModules}
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {savingModules ? 'Saving…' : 'Save learning path'}
            </button>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-line bg-paper-alt p-6">
          <h2 className="font-display text-lg font-semibold">Upload materials</h2>
          <form onSubmit={handleMaterialUpload} className="mt-4 flex flex-col gap-4">
            <FilePicker
              id="instructor-material-file"
              required
              disabled={uploading}
              selectedName={materialFile?.name}
              onChange={(e) => setMaterialFile(e.target.files?.[0] || null)}
            />
            <button
              type="submit"
              disabled={uploading || !materialFile}
              className="inline-flex w-fit items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Upload size={16} />
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </form>

          <ul className="mt-6 space-y-2">
            {materials.length === 0 ? (
              <li className="text-sm text-slate">No files uploaded yet.</li>
            ) : (
              materials.map((file) => (
                <li key={file._id} className="flex items-center gap-2 text-sm">
                  <FileText size={16} className="text-primary" />
                  <a
                    href={`${UPLOADS_BASE_URL}${file.fileUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    {file.originalName}
                  </a>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="mt-8 rounded-2xl border border-line bg-paper-alt p-6">
          <h2 className="font-display text-lg font-semibold">Student submissions</h2>
          <ul className="mt-4 space-y-3">
            {submissions.length === 0 ? (
              <li className="text-sm text-slate">No submissions yet.</li>
            ) : (
              submissions.map((sub) => (
                <li key={sub._id} className="rounded-lg border border-line bg-paper px-4 py-3 text-sm">
                  <p className="font-semibold">{sub.title}</p>
                  <p className="text-xs text-slate">
                    {sub.student?.name || 'Student'} · {new Date(sub.createdAt).toLocaleString()}
                  </p>
                  <a
                    href={`${UPLOADS_BASE_URL}${sub.fileUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-primary font-medium hover:underline"
                  >
                    {sub.originalName}
                  </a>
                </li>
              ))
            )}
          </ul>
        </section>
      </main>
    </div>
  );
}
