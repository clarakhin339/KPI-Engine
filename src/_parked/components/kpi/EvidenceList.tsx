import React from 'react';
import {
  DownloadIcon,
  EyeIcon,
  FileArchiveIcon,
  FileImageIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FileIcon,
  UploadIcon } from
'lucide-react';
import type { Evidence } from '../../lib/types';
import { useApp } from '../../lib/store';
import { formatDate } from '../../lib/utils';

const ICONS: Record<Evidence['type'], React.ReactNode> = {
  pdf: <FileTextIcon size={15} />,
  image: <FileImageIcon size={15} />,
  word: <FileIcon size={15} />,
  excel: <FileSpreadsheetIcon size={15} />,
  zip: <FileArchiveIcon size={15} />
};

export function EvidenceList({
  evidence,
  onUpload,
  readOnly = false




}: {evidence: Evidence[];onUpload?: () => void;readOnly?: boolean;}) {
  const { userById, pushToast } = useApp();

  return (
    <div className="space-y-2">
      {!readOnly &&
      <button
        onClick={onUpload}
        className="flex w-full items-center justify-center gap-2 rounded border border-dashed border-linestrong py-6 text-sm text-fgmuted hover:text-fg">
        
          <UploadIcon size={15} />
          Upload PDF, image, Word, Excel or ZIP evidence
        </button>
      }
      {evidence.length === 0 ?
      <p className="py-4 text-center text-sm text-fgmuted">No evidence attached yet.</p> :

      <ul className="space-y-1.5">
          {evidence.map((file) =>
        <li
          key={file.id}
          className="flex items-center gap-3 rounded border border-line px-3 py-2">
          
              <span className="text-fgsubtle">{ICONS[file.type]}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-fg">{file.name}</span>
                <span className="block font-mono text-2xs text-fgsubtle">
                  {file.size} · v{file.version} · {userById(file.uploadedBy)?.name} ·{' '}
                  {formatDate(file.uploadedAt)}
                </span>
              </span>
              {file.version > 1 &&
          <span className="rounded border border-line px-1.5 font-mono text-[9px] uppercase text-fgmuted">
                  {file.version} versions
                </span>
          }
              <button
            onClick={() => pushToast({ title: 'Preview opened', description: file.name, tone: 'default' })}
            aria-label={`Preview ${file.name}`}
            className="text-fgsubtle hover:text-fg">
            
                <EyeIcon size={14} />
              </button>
              <button
            onClick={() => pushToast({ title: 'Download started', description: file.name, tone: 'default' })}
            aria-label={`Download ${file.name}`}
            className="text-fgsubtle hover:text-fg">
            
                <DownloadIcon size={14} />
              </button>
            </li>
        )}
        </ul>
      }
    </div>);

}