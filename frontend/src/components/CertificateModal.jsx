import { useState } from 'react';
import {
  X,
  Download,
  Award,
  ShieldCheck,
  CheckCircle,
  Copy,
  Printer,
  Loader2,
  Calendar,
  User,
  BookOpen,
} from 'lucide-react';
import { certificateService } from '../services/api.js';

export default function CertificateModal({
  isOpen,
  onClose,
  courseId,
  courseTitle,
  studentName,
  instructorName,
  certificateId,
  issueDate,
  averageScore,
  quizzesCount,
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const formattedDate = issueDate
    ? new Date(issueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  const handleDownload = async () => {
    if (!courseId) return;
    setDownloading(true);
    setDownloadError('');
    try {
      await certificateService.downloadCertificatePDF(courseId, courseTitle || 'Course');
    } catch (err) {
      setDownloadError(err.message || 'Could not download certificate PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyId = () => {
    if (!certificateId) return;
    navigator.clipboard.writeText(certificateId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-line overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Control Bar */}
        <div className="bg-paper-alt px-6 py-4 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber/10 text-amber-dark border border-amber/20">
              <Award size={20} />
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-ink">
                Verified Certificate of Completion
              </h2>
              <p className="text-xs text-slate">Issued for passing all required course quizzes</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-primary text-white hover:bg-primary-dark rounded-xl transition shadow-sm disabled:opacity-60"
            >
              {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>{downloading ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-paper border border-line text-ink-soft hover:text-ink rounded-xl transition"
              title="Print Certificate"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate hover:text-ink rounded-xl hover:bg-paper transition"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {downloadError && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-2.5 text-xs text-red-700">
            {downloadError}
          </div>
        )}

        {/* Certificate Display Area */}
        <div className="p-6 md:p-8 bg-slate-50 flex justify-center">
          <div className="w-full bg-[#FBFBFA] text-[#0F172A] rounded-2xl shadow-lg border-[6px] border-[#0F172A] relative p-8 md:p-12 overflow-hidden">
            {/* Inner Gold Border */}
            <div className="absolute inset-3 border-2 border-[#D97706] pointer-events-none rounded-xl" />
            <div className="absolute inset-4 border border-[#E2E8F0] pointer-events-none rounded-lg" />

            {/* Corner Medallions */}
            <div className="absolute top-5 left-5 w-4 h-4 border-t-2 border-l-2 border-[#D97706]" />
            <div className="absolute top-5 right-5 w-4 h-4 border-t-2 border-r-2 border-[#D97706]" />
            <div className="absolute bottom-5 left-5 w-4 h-4 border-b-2 border-l-2 border-[#D97706]" />
            <div className="absolute bottom-5 right-5 w-4 h-4 border-b-2 border-r-2 border-[#D97706]" />

            {/* Platform Branding */}
            <div className="text-center space-y-1 relative z-10">
              <p className="font-mono text-[10px] md:text-xs uppercase tracking-[0.25em] font-bold text-slate-500">
                Pathway Interactive Learning Platform
              </p>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-400">
                Official Verified Academic Accreditation
              </p>
            </div>

            {/* Certificate Title */}
            <div className="text-center mt-6 relative z-10">
              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-black tracking-wider uppercase text-slate-900">
                Certificate of Completion
              </h1>
              <div className="mt-3 flex items-center justify-center gap-3">
                <div className="h-[1px] w-16 sm:w-24 bg-gradient-to-r from-transparent to-amber-500" />
                <div className="w-2.5 h-2.5 rotate-45 bg-amber-500" />
                <div className="h-[1px] w-16 sm:w-24 bg-gradient-to-l from-transparent to-amber-500" />
              </div>
            </div>

            {/* Student Name */}
            <div className="text-center mt-6 space-y-1 relative z-10">
              <p className="text-[11px] uppercase tracking-widest font-semibold text-slate-500">
                This certificate is proudly awarded to
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-teal-700 pt-1">
                {studentName || 'Valued Scholar'}
              </h2>
              <div className="mx-auto w-32 sm:w-48 h-[1px] bg-slate-300 mt-2" />
            </div>

            {/* Achievement Text */}
            <div className="text-center mt-5 max-w-xl mx-auto space-y-1 relative z-10">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                for successfully mastering the curriculum, demonstrating academic excellence, and
                passing all required comprehensive course quizzes and assessments for:
              </p>
              <h3 className="font-sans text-lg sm:text-xl font-extrabold text-slate-900 pt-2">
                "{courseTitle || 'Course Title'}"
              </h3>
            </div>

            {/* Metrics Pills */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto relative z-10">
              <div className="rounded-xl border border-slate-200 bg-white/80 p-2.5 text-center shadow-xs">
                <p className="font-mono text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                  Quiz Grade Average
                </p>
                <p className="font-sans text-base font-bold text-slate-800 mt-0.5">
                  {averageScore !== undefined ? `${averageScore}%` : 'Passed'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white/80 p-2.5 text-center shadow-xs">
                <p className="font-mono text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                  Assessments
                </p>
                <p className="font-sans text-base font-bold text-teal-700 mt-0.5">
                  {quizzesCount ? `${quizzesCount} / ${quizzesCount} Passed` : 'All Passed'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white/80 p-2.5 text-center shadow-xs">
                <p className="font-mono text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                  Completion Date
                </p>
                <p className="font-sans text-xs font-bold text-slate-800 mt-1">
                  {formattedDate}
                </p>
              </div>
            </div>

            {/* Signatures & Seal */}
            <div className="mt-10 pt-4 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-slate-200/80 relative z-10">
              {/* Left Signature */}
              <div className="text-center sm:text-left space-y-0.5">
                <div className="w-40 border-b border-slate-400 mx-auto sm:mx-0 pb-1">
                  <span className="font-serif italic text-sm font-semibold text-slate-700">
                    {instructorName || 'Lead Instructor'}
                  </span>
                </div>
                <p className="font-mono text-[9px] uppercase text-slate-500 font-medium pt-1">
                  Lead Course Instructor
                </p>
              </div>

              {/* Center Official Gold Seal */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full border-2 border-amber-600 bg-amber-50 flex flex-col items-center justify-center shadow-md text-amber-800 relative">
                  <div className="absolute inset-1 rounded-full border border-amber-400" />
                  <Award size={20} className="text-amber-600" />
                  <span className="text-[7px] font-black uppercase tracking-tighter">VERIFIED</span>
                </div>
              </div>

              {/* Right Signature */}
              <div className="text-center sm:text-right space-y-0.5">
                <div className="w-40 border-b border-slate-400 mx-auto sm:ml-auto pb-1">
                  <span className="font-serif italic text-sm font-semibold text-slate-700">
                    Pathway Academic Board
                  </span>
                </div>
                <p className="font-mono text-[9px] uppercase text-slate-500 font-medium pt-1">
                  Accreditation & Certification
                </p>
              </div>
            </div>

            {/* Bottom Credential ID Line */}
            <div className="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-400 font-mono relative z-10">
              <div className="flex items-center gap-2">
                <span>Credential ID: {certificateId || 'PENDING'}</span>
                {certificateId && (
                  <button
                    onClick={handleCopyId}
                    className="p-0.5 hover:text-slate-700 transition"
                    title="Copy Credential ID"
                  >
                    {copied ? <CheckCircle size={12} className="text-teal" /> : <Copy size={12} />}
                  </button>
                )}
              </div>
              <span className="flex items-center gap-1 text-teal-600 font-bold">
                <ShieldCheck size={12} /> SECURE DIGITAL CREDENTIAL
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-paper-alt px-6 py-4 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate text-center sm:text-left">
            This digital certificate is permanently recorded in your student profile and can be downloaded anytime.
          </p>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 border border-line text-xs font-semibold rounded-xl text-ink-soft hover:bg-paper transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-bold bg-primary text-white hover:bg-primary-dark rounded-xl transition shadow-sm disabled:opacity-60"
            >
              {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>{downloading ? 'Downloading...' : 'Download Official PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
