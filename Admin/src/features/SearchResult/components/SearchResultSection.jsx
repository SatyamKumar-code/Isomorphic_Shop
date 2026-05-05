import React from 'react';

const SearchResultSection = ({ title, items = [] }) => {
    return (
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-gray-950">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {items.length}
                </span>
            </div>

            {items.length ? (
                <ul className="space-y-2">
                    {items.map((item) => (
                        <li
                            key={`${title}-${item.id}-${item.name}`}
                            className="rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
                        >
                            <p className="font-medium text-slate-800 dark:text-slate-100">{item.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{item.meta}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">No matches in this section.</p>
            )}
        </section>
    );
};

export default SearchResultSection;
