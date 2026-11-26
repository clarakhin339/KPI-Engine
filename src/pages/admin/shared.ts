import type { Dispatch, SetStateAction } from 'react';

export function upsert<T extends {id: string;}>(
set: Dispatch<SetStateAction<T[]>>,
item: T,
isNew: boolean)
{
  set((prev) => isNew ? [...prev, item] : prev.map((x) => x.id === item.id ? item : x));
}

export function removeById<T extends {id: string;}>(set: Dispatch<SetStateAction<T[]>>, id: string) {
  set((prev) => prev.filter((x) => x.id !== id));
}

export function nameTaken<T extends {id: string;}>(
rows: T[],
item: T,
get: (row: T) => string)
{
  const name = get(item).trim().toLowerCase();
  return rows.some((r) => r.id !== item.id && get(r).trim().toLowerCase() === name);
}
