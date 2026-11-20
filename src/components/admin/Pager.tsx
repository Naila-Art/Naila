"use client";

import { useEffect, useState } from "react";
import p from "./pager.module.css";
import Icon from "../Icon";

export const PAGE_SIZES = [20, 50, 100] as const;

/**
 * Splits a list into pages. Goes back to page 1 whenever the list itself changes
 * (a filter, a tab, a sort), so you never land on an empty page.
 */
export function usePaged<T>(list: T[], initialSize: number = PAGE_SIZES[0]) {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(initialSize);
  useEffect(() => setPage(1), [list, size]);
  const pages = Math.max(1, Math.ceil(list.length / size));
  const current = Math.min(page, pages);
  const items = list.slice((current - 1) * size, current * size);
  return { items, page: current, pages, size, total: list.length, setPage, setSize };
}

/** Page numbers to show: always first and last, the current one and its neighbours, gaps as null. */
function pageList(page: number, pages: number): (number | null)[] {
  const want = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
  const sorted = [...want].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push(null);
    out.push(n);
  });
  return out;
}

const fmt = (n: number) => n.toLocaleString("ar-EG");

export default function Pager({
  page,
  pages,
  size,
  total,
  setPage,
  setSize,
  label,
}: ReturnType<typeof usePaged<unknown>> & { label: string }) {
  if (total <= PAGE_SIZES[0]) return null;
  const from = (page - 1) * size + 1;
  const to = Math.min(page * size, total);

  return (
    <nav className={p.pager} aria-label={`صفحات ${label}`}>
      <span className={p.range}>
        {fmt(from)}–{fmt(to)} من {fmt(total)}
      </span>

      <div className={p.pages}>
        <button type="button" className={p.step} onClick={() => setPage(page - 1)} disabled={page <= 1} aria-label="الصفحة اللي قبل">
          <Icon name="arrowRight" size={16} />
        </button>
        {pageList(page, pages).map((n, i) =>
          n === null ? (
            <span key={`gap${i}`} className={p.gap} aria-hidden>
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              className={p.num}
              aria-current={n === page ? "page" : undefined}
              onClick={() => setPage(n)}
            >
              {fmt(n)}
            </button>
          ),
        )}
        <button type="button" className={p.step} onClick={() => setPage(page + 1)} disabled={page >= pages} aria-label="الصفحة اللي بعد">
          <Icon name="arrowLeft" size={16} />
        </button>
      </div>

      <label className={p.size}>
        في الصفحة
        <select value={size} onChange={(e) => setSize(Number(e.target.value))}>
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>
              {fmt(s)}
            </option>
          ))}
        </select>
      </label>
    </nav>
  );
}
