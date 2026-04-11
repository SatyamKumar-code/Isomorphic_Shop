import React from 'react';
import { useTransaction } from '../../../Context/transaction/useTransaction';

const TransactionFilters = () => {
    const { activeTab, setActiveTab, filterData, setFilterData, tabs, paymentMethods } = useTransaction();

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const handleMethodChange = (method) => {
        setFilterData({
            ...filterData,
            method: filterData.method === method ? '' : method,
        });
    };

    return (
        <div className=" w-full">
            <div className="rounded-t-lg px-6 pt-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="overflow-x-auto lg:flex-1">
                        <div className="flex min-w-max items-center justify-between gap-2 border-b border-gray-200 dark:border-gray-700">
                            <div>
                                {tabs.map((tab) => (
                                <button
                                    key={tab.label}
                                    onClick={() => handleTabChange(tab.label)}
                                    className={`relative px-4 py-3 text-[14px] font-medium transition-all ${activeTab === tab.label ? 'border-[#4EA674] text-[#4EA674]' : 'border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'}`}
                                >
                                    {tab.label}
                                    <span className="ml-2 text-[12px] text-gray-500 dark:text-gray-400">
                                        {tab.count}
                                    </span>
                                    {tab.label === 'All order' && (
                                        <span className="sr-only">All transactions</span>
                                    )}
                                </button>
                            ))}
                            </div>
                            <div className="flex flex-wrap gap-3 mb-2 lg:pt-1">
                            {paymentMethods.length ? paymentMethods.map((method) => (
                                <button
                                    key={method.value}
                                    onClick={() => handleMethodChange(method.value)}
                                    className={`rounded-lg border px-4 py-1 text-[12px] font-medium transition-all ${filterData.method === method.value ? 'border-[#4EA674] bg-[#4EA674] text-white' : 'border-transparent bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                                >
                                    {method.label}
                                </button>
                            )) : (
                                <p className="text-xs text-gray-500 dark:text-gray-400">No payment methods available</p>
                            )}
                        </div>
                        </div>
                        
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransactionFilters;
