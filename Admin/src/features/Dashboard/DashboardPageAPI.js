import api from "../../services/api";

/**
 * Fetch dashboard summary data including cards and tabs
 * @param {Object} params - Query parameters
 * @param {string} params.period - '7days', 'daywise', or 'month'
 * @param {number} params.year - Year for filtering
 * @param {number} params.month - Month for filtering (1-12)
 * @param {string} params.range - Weekly report range, for example 'This week' or 'Last week'
 * @param {string} params.stat - Weekly report stat key, for example 'orders' or 'revenue'
 * @returns {Promise}
 */
export const getDashboardPageData = (params = {}) =>
    api.get("/api/order/summary", { params });

/**
 * Fetch dashboard user report data for the last 30 minutes
 * @returns {Promise}
 */
export const getDashboardUserReport = () =>
    api.get("/api/dashboard/user-report");

/**
 * Fetch recent transactions for the dashboard
 * @param {number} limit - Number of transactions to fetch (default 7)
 * @returns {Promise}
 */
export const getTransactions = (limit = 7) =>
    api.get("/api/dashboard/transactions", { params: { limit } });

/**
 * Export CSV for a card's data
 * @param {Object} data - Card data including title, value, change, period
 */
export const exportCardData = (data) => {
    const rows = [
        ['Metric', 'Value', 'Change', 'Period'],
        [data.title, data.value, data.change, data.periodLabel],
    ];

    const csvText = rows
        .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
