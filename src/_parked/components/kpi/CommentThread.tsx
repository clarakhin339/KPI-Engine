import React, { useState } from 'react';
import { AtSignIcon, PaperclipIcon, SendIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { useApp } from '../../lib/store';
import type { KpiComment } from '../../lib/types';
import { formatDateTime, initials } from '../../lib/utils';

function CommentItem({ comment, depth = 0 }: {comment: KpiComment;depth?: number;}) {
  const { userById } = useApp();
  const author = userById(comment.authorId);
  return (
    <li style={{ marginLeft: depth * 24 }}>
      <div className="rounded border border-line p-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-line bg-surface2 font-mono text-[9px] text-fg">
            {initials(author?.name ?? '?')}
          </span>
          <span className="text-sm font-medium text-fg">{author?.name}</span>
          <span className="rounded border border-line px-1.5 font-mono text-[9px] uppercase tracking-wider text-fgsubtle">
            {comment.role}
          </span>
          <span className="ml-auto font-mono text-2xs text-fgsubtle">
            {formatDateTime(comment.createdAt)}
          </span>
        </div>
        <p className="mt-2 text-sm text-fg">{comment.body}</p>
        {comment.mentions.length > 0 &&
        <p className="mt-1.5 flex items-center gap-1 font-mono text-2xs text-fgsubtle">
            <AtSignIcon size={10} />
            {comment.mentions.map((m) => userById(m)?.name).join(', ')}
          </p>
        }
      </div>
      {comment.replies.length > 0 &&
      <ul className="mt-2 space-y-2">
          {comment.replies.map((r) =>
        <CommentItem key={r.id} comment={r} depth={depth + 1} />
        )}
        </ul>
      }
    </li>);

}

export function CommentThread({
  comments,
  onAdd



}: {comments: KpiComment[];onAdd: (body: string) => void;}) {
  const [body, setBody] = useState('');

  return (
    <div>
      {comments.length === 0 ?
      <p className="py-6 text-center text-sm text-fgmuted">No comments yet.</p> :

      <ul className="space-y-3">
          {comments.map((c) =>
        <CommentItem key={c.id} comment={c} />
        )}
        </ul>
      }

      <div className="mt-4 rounded border border-line p-3">
        <textarea
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment. Use @ to mention a colleague."
          aria-label="New comment"
          className="w-full resize-none bg-transparent text-sm text-fg placeholder:text-fgsubtle focus:outline-none" />
        
        <div className="mt-2 flex items-center gap-2 border-t border-line pt-2">
          <button className="text-fgsubtle hover:text-fg" aria-label="Mention someone">
            <AtSignIcon size={14} />
          </button>
          <button className="text-fgsubtle hover:text-fg" aria-label="Attach file">
            <PaperclipIcon size={14} />
          </button>
          <Button
            size="small"
            className="ml-auto"
            rightIcon={<SendIcon size={13} />}
            disabled={!body.trim()}
            onClick={() => {
              onAdd(body);
              setBody('');
            }}>
            
            Comment
          </Button>
        </div>
      </div>
    </div>);

}