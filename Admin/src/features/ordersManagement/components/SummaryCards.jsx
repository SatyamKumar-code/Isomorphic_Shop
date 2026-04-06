import React from 'react';
import { FaArrowDown, FaArrowUp } from 'react-icons/fa';
import { FiMoreVertical } from 'react-icons/fi';
import { useOrder } from '../../../Context/order/useOrder';

const SummaryCard = ({ card }) => {
  return (
    <div className="relative p-4 shadow-md inset-shadow-sm inset-shadow-gray-300 shadow-gray-300 dark:shadow-gray-700 dark:inset-shadow-gray-700 bg-white dark:bg-gray-950 rounded-lg">
      <button className="absolute right-3 top-3 text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300" aria-label={`${card.title} actions`}>
        <FiMoreVertical />
      </button>
      <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">{card.title}</p>
      <div className="mt-4 flex items-end gap-3">
        <span className="text-[34px] font-bold leading-none text-slate-900 dark:text-slate-100">{card.value}</span>
        <span className="mb-1 flex items-center gap-1 text-sm font-semibold" style={{ color: card.changeColor }}>
          {card.changeDirection === 'up' ? <FaArrowUp /> : <FaArrowDown />}
          {card.change} 
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Last 7 days</p>
    </div>
  );
};

const SummaryCards = () => {
  const { summaryCards } = useOrder();

  return (
    <div className="mb-5 grid gap-4 xl:grid-cols-4 md:grid-cols-2">
      {summaryCards.map((card) => (
        <SummaryCard key={card.title} card={card} />
      ))}
    </div>
  );
};

export default SummaryCards;
