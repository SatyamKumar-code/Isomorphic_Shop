import React from 'react';

const QATable = ({
    qaList,
    editingId,
    setEditingId,
    answerText,
    setAnswerText,
    answeringId,
    handleAnswerSubmit,
    handleCancelEdit
}) => {
    if (qaList.length === 0) {
        return (
            <div className='text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600'>
                <svg
                    className='mx-auto h-12 w-12 text-gray-400'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                >
                    <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                </svg>
                <h3 className='mt-4 text-sm font-medium text-gray-900 dark:text-white'>
                    No questions yet
                </h3>
                <p className='mt-1 text-sm text-gray-500'>
                    No customers have asked questions about this product yet.
                </p>
            </div>
        );
    }

    return (
        <div className='overflow-x-auto'>
            <table className='w-full'>
                <thead>
                    <tr className='bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700'>
                        <th className='px-4 py-3 text-left text-sm font-semibold text-[#23272E] dark:text-[#c1c6cf]'>Customer</th>
                        <th className='px-4 py-3 text-left text-sm font-semibold text-[#23272E] dark:text-[#c1c6cf]'>Question</th>
                        <th className='px-4 py-3 text-left text-sm font-semibold text-[#23272E] dark:text-[#c1c6cf]'>Answer</th>
                        <th className='px-4 py-3 text-left text-sm font-semibold text-[#23272E] dark:text-[#c1c6cf]'>Status</th>
                        <th className='px-4 py-3 text-left text-sm font-semibold text-[#23272E] dark:text-[#c1c6cf]'>Date</th>
                        <th className='px-4 py-3 text-center text-sm font-semibold text-[#23272E] dark:text-[#c1c6cf]'>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {qaList.map((qa, index) => (
                        <React.Fragment key={qa._id}>
                            <tr className={`border-b border-gray-200 dark:border-gray-700 ${index % 2 === 0 ? 'bg-white dark:bg-gray-950' : 'bg-white dark:bg-gray-950'}`}>
                                <td className='px-4 py-3 text-sm text-[#23272E] dark:text-[#c1c6cf] font-medium'>
                                    {qa.userId?.name || 'Anonymous'}
                                </td>
                                <td className='px-4 py-3 text-sm text-[#23272E] dark:text-[#c1c6cf]'>
                                    <div className='max-w-xs truncate' title={qa.question}>
                                        {qa.question}
                                    </div>
                                </td>

                                <td className='px-4 py-3 text-sm text-[#23272E] dark:text-[#c1c6cf]'>
                                    {qa.isAnswered ? (
                                        <div className='max-w-xs truncate text-sm' title={qa.answer}>
                                            {qa.answer}
                                        </div>
                                    ) : (
                                        <span className='text-sm text-gray-500 dark:text-gray-400'>—</span>
                                    )}
                                </td>

                                <td className='px-4 py-3 text-sm'>
                                    {qa.isAnswered ? (
                                        <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'>
                                            ✓ Answered
                                        </span>
                                    ) : (
                                        <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'>
                                            ⏱ Pending
                                        </span>
                                    )}
                                </td>
                                <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                                    {new Date(qa.createdAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: '2-digit'
                                    })}
                                </td>
                                
                                <td className='px-4 py-3 text-center'>
                                    <button
                                        onClick={() => {
                                            setEditingId(editingId === qa._id ? null : qa._id);
                                            if (editingId !== qa._id) {
                                                setAnswerText(prev => ({
                                                    ...prev,
                                                    [qa._id]: qa.answer || ''
                                                }));
                                            }
                                        }}
                                        className='text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium'
                                    >
                                        {editingId === qa._id ? 'Close' : 'Manage'}
                                    </button>
                                </td>
                            </tr>

                            {/* Expanded row for answer management */}
                            {editingId === qa._id && (
                                <tr className={`border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950`}>
                                    <td colSpan='6' className='px-4 py-4'>
                                        <div className='space-y-3'>
                                            {/* Show existing answer if answered */}
                                            {qa.isAnswered && editingId === qa._id && (
                                                <div className='mb-4 p-3 bg-blue-500 dark:bg-blue-800 border-l-4 border-blue-800 dark:border-blue-500 rounded'>
                                                    <p className='text-sm font-semibold text-blue-50 mb-2'>
                                                        ✓ Current Answer:
                                                    </p>
                                                    <p className='text-blue-100 dark:text-blue-50 text-sm leading-relaxed'>
                                                        {qa.answer}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Answer Form */}
                                            <div>
                                                <label className='block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'>
                                                    {qa.isAnswered ? 'Edit Answer' : 'Write Your Answer'}
                                                </label>
                                                <textarea
                                                    value={answerText[qa._id] || ''}
                                                    onChange={(e) =>
                                                        setAnswerText(prev => ({
                                                            ...prev,
                                                            [qa._id]: e.target.value
                                                        }))
                                                    }
                                                    placeholder='Type your answer here...'
                                                    className='w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-vertical min-h-24'
                                                />
                                            </div>

                                            {/* Action Buttons */}
                                            <div className='flex gap-2'>
                                                <button
                                                    onClick={() => handleAnswerSubmit(qa._id, qa.answer)}
                                                    disabled={answeringId === qa._id}
                                                    className='flex items-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition'
                                                >
                                                    {answeringId === qa._id && (
                                                        <svg
                                                            className='animate-spin h-4 w-4'
                                                            xmlns='http://www.w3.org/2000/svg'
                                                            fill='none'
                                                            viewBox='0 0 24 24'
                                                        >
                                                            <circle
                                                                className='opacity-25'
                                                                cx='12'
                                                                cy='12'
                                                                r='10'
                                                                stroke='currentColor'
                                                                strokeWidth='4'
                                                            ></circle>
                                                            <path
                                                                className='opacity-75'
                                                                fill='currentColor'
                                                                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                                                            ></path>
                                                        </svg>
                                                    )}
                                                    {qa.isAnswered ? 'Update Answer' : 'Post Answer'}
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className='px-6 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg'
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default QATable;
