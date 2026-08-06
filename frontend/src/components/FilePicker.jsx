import { Upload } from 'lucide-react';
import { UPLOAD_ACCEPT, UPLOAD_HINT } from '../constants/uploadTypes.js';

/**
 * Styled file picker (hides the native "Choose File / No file chosen" row).
 */
export default function FilePicker({ id, onChange, required, disabled, selectedName }) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className={`inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-line bg-paper px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary ${disabled ? 'pointer-events-none opacity-60' : ''}`}
      >
        <Upload size={16} className="text-primary" />
        {selectedName ? 'Change file' : 'Choose file'}
      </label>
      <input
        id={id}
        type="file"
        accept={UPLOAD_ACCEPT}
        required={required}
        disabled={disabled}
        className="hidden"
        onChange={onChange}
      />
      {selectedName ? (
        <p className="text-sm text-ink">
          Selected: <span className="font-medium">{selectedName}</span>
        </p>
      ) : (
        <p className="text-sm text-slate">No file selected yet.</p>
      )}
      <p className="text-xs text-slate">{UPLOAD_HINT}</p>
    </div>
  );
}
