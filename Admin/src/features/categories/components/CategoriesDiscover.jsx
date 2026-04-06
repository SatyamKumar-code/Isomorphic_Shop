import React, { useRef } from 'react';
import { FiChevronRight } from 'react-icons/fi';
import { useCategories } from '../../../Context/categories/useCategories';

const CategoriesDiscover = () => {
    const { discoverCategories } = useCategories();
    const scrollRef = useRef(null);

    const handleScrollNext = () => {
        const container = scrollRef.current;
        if (!container || discoverCategories.length <= 8) {
            return;
        }

        container.scrollBy({ left: 340, behavior: 'smooth' });
    };

    const canScroll = discoverCategories.length > 8;

    return (
        <div className="mb-6 flex items-center gap-4">
            <div
                ref={scrollRef}
                className="grid w-full flex-1 grid-flow-col grid-rows-2 gap-5 overflow-x-auto scroll-smooth scrollbarNone">
                {discoverCategories.map((category) => (
                    <article key={category.id} className="flex lg:w-66.25 md:w-50 h-22 items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-gray-950">
                        <div className="flex h-17 w-17 items-center justify-center rounded-md bg-white/10 border border-white/10">
                            <img src={category.image || 'https://picsum.photos/seed/category-card/120/80'} alt={category.name} className="h-16 w-16 rounded-md object-cover" loading="lazy" />
                        </div>
                        <h4 className="lg:text-lg md:text-md font-medium tracking-[0.005em] text-slate-700 dark:text-slate-200">{category.name}</h4>
                    </article>
                ))}
            </div>

            <button
                type="button"
                onClick={handleScrollNext}
                disabled={!canScroll}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200 dark:hover:bg-gray-900"
                aria-label="Scroll categories"
            >
                <FiChevronRight />
            </button>
        </div>
    );
};

export default CategoriesDiscover;
