import { createContext, useMemo, useState } from "react";

export const CustomersContext = createContext();

const summaryCards = [
    { title: "Total Customers", value: "11,040", change: "+14.4%", changeColor: "#22C55E" },
    { title: "New Customers", value: "2,370", change: "+20%", changeColor: "#22C55E" },
    { title: "Visitor", value: "250k", change: "+20%", changeColor: "#22C55E" },
];

const overviewStats = [
    { key: "activeCustomers", label: "Active Customers", value: "25k" },
    { key: "repeatCustomers", label: "Repeat Customers", value: "5.6k" },
    { key: "shopVisitor", label: "Shop Visitor", value: "250k" },
    { key: "conversionRate", label: "Conversion Rate", value: "5.5%" },
];

const weekSeries = {
    "This week": {
        activeCustomers: [11400, 12454, 13824, 16464, 14200, 15435, 16464],
        repeatCustomers: [4200, 4158, 4294, 4224, 4126, 4379, 4230],
        shopVisitor: [152000, 164000, 158000, 172000, 169000, 181000, 176000],
        conversionRate: [2.8, 5.1, 5.4, 5.2, 5.3, 5.6, 5.5],
    },
    "Last week": {
        activeCustomers: [9200, 9450, 9700, 9900, 10100, 9800, 9600],
        repeatCustomers: [3500, 3620, 3740, 3650, 3580, 3690, 3600],
        shopVisitor: [132000, 138500, 140000, 144000, 141200, 147500, 145000],
        conversionRate: [3.2, 2.4, 4.6, 4.5, 4.7, 4.9, 4.8],
    },
};

const getSafeStat = (stats) => {
    if (!Array.isArray(stats) || !stats.length) {
        return "";
    }

    const firstStat = stats[0];
    return firstStat?.key || firstStat?.valueKey || firstStat?.label || "";
};

const baseCustomers = [
    { id: "#CUST001", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Jane Smith", phone: "+1234567890", orderCount: 5, totalSpend: 250, status: "Inactive", email: "jane.smith@example.com", address: "28 Oak St, LA", totalOrders: 72, completedOrders: 61, canceledOrders: 11, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Emily Davis", phone: "+1234567890", orderCount: 30, totalSpend: 4600, status: "VIP", email: "emily.davis@example.com", address: "45 Pine Ave, CA", totalOrders: 118, completedOrders: 103, canceledOrders: 15, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Emily Davis", phone: "+1234567890", orderCount: 30, totalSpend: 4600, status: "VIP", email: "emily.davis@example.com", address: "45 Pine Ave, CA", totalOrders: 118, completedOrders: 103, canceledOrders: 15, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Jane Smith", phone: "+1234567890", orderCount: 5, totalSpend: 250, status: "Inactive", email: "jane.smith@example.com", address: "28 Oak St, LA", totalOrders: 72, completedOrders: 61, canceledOrders: 11, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Emily Davis", phone: "+1234567890", orderCount: 30, totalSpend: 4600, status: "VIP", email: "emily.davis@example.com", address: "45 Pine Ave, CA", totalOrders: 118, completedOrders: 103, canceledOrders: 15, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Jane Smith", phone: "+1234567890", orderCount: 5, totalSpend: 250, status: "Inactive", email: "jane.smith@example.com", address: "28 Oak St, LA", totalOrders: 72, completedOrders: 61, canceledOrders: 11, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Emily Davis", phone: "+1234567890", orderCount: 30, totalSpend: 4600, status: "VIP", email: "emily.davis@example.com", address: "45 Pine Ave, CA", totalOrders: 118, completedOrders: 103, canceledOrders: 15, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Jane Smith", phone: "+1234567890", orderCount: 5, totalSpend: 250, status: "Inactive", email: "jane.smith@example.com", address: "28 Oak St, LA", totalOrders: 72, completedOrders: 61, canceledOrders: 11, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Emily Davis", phone: "+1234567890", orderCount: 30, totalSpend: 4600, status: "VIP", email: "emily.davis@example.com", address: "45 Pine Ave, CA", totalOrders: 118, completedOrders: 103, canceledOrders: 15, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST031", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Jane Smith", phone: "+1234567890", orderCount: 5, totalSpend: 250, status: "Inactive", email: "jane.smith@example.com", address: "28 Oak St, LA", totalOrders: 72, completedOrders: 61, canceledOrders: 11, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST033", name: "Emily Davis", phone: "+1234567890", orderCount: 30, totalSpend: 4600, status: "VIP", email: "emily.davis@example.com", address: "45 Pine Ave, CA", totalOrders: 118, completedOrders: 103, canceledOrders: 15, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Jane Smith", phone: "+1234567890", orderCount: 5, totalSpend: 250, status: "Inactive", email: "jane.smith@example.com", address: "28 Oak St, LA", totalOrders: 72, completedOrders: 61, canceledOrders: 11, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Emily Davis", phone: "+1234567890", orderCount: 30, totalSpend: 4600, status: "VIP", email: "emily.davis@example.com", address: "45 Pine Ave, CA", totalOrders: 118, completedOrders: 103, canceledOrders: 15, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Jane Smith", phone: "+1234567890", orderCount: 5, totalSpend: 250, status: "Inactive", email: "jane.smith@example.com", address: "28 Oak St, LA", totalOrders: 72, completedOrders: 61, canceledOrders: 11, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Emily Davis", phone: "+1234567890", orderCount: 30, totalSpend: 4600, status: "VIP", email: "emily.davis@example.com", address: "45 Pine Ave, CA", totalOrders: 118, completedOrders: 103, canceledOrders: 15, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Jane Smith", phone: "+1234567890", orderCount: 5, totalSpend: 250, status: "Inactive", email: "jane.smith@example.com", address: "28 Oak St, LA", totalOrders: 72, completedOrders: 61, canceledOrders: 11, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Jane Smith", phone: "+1234567890", orderCount: 5, totalSpend: 250, status: "Inactive", email: "jane.smith@example.com", address: "28 Oak St, LA", totalOrders: 72, completedOrders: 61, canceledOrders: 11, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Jane Smith", phone: "+1234567890", orderCount: 5, totalSpend: 250, status: "Inactive", email: "jane.smith@example.com", address: "28 Oak St, LA", totalOrders: 72, completedOrders: 61, canceledOrders: 11, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Emily Davis", phone: "+1234567890", orderCount: 30, totalSpend: 4600, status: "VIP", email: "emily.davis@example.com", address: "45 Pine Ave, CA", totalOrders: 118, completedOrders: 103, canceledOrders: 15, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Emily Davis", phone: "+1234567890", orderCount: 30, totalSpend: 4600, status: "VIP", email: "emily.davis@example.com", address: "45 Pine Ave, CA", totalOrders: 118, completedOrders: 103, canceledOrders: 15, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Jane Smith", phone: "+1234567890", orderCount: 5, totalSpend: 250, status: "Inactive", email: "jane.smith@example.com", address: "28 Oak St, LA", totalOrders: 72, completedOrders: 61, canceledOrders: 11, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Emily Davis", phone: "+1234567890", orderCount: 30, totalSpend: 4600, status: "VIP", email: "emily.davis@example.com", address: "45 Pine Ave, CA", totalOrders: 118, completedOrders: 103, canceledOrders: 15, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Jane Smith", phone: "+1234567890", orderCount: 5, totalSpend: 250, status: "Inactive", email: "jane.smith@example.com", address: "28 Oak St, LA", totalOrders: 72, completedOrders: 61, canceledOrders: 11, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Emily Davis", phone: "+1234567890", orderCount: 30, totalSpend: 4600, status: "VIP", email: "emily.davis@example.com", address: "45 Pine Ave, CA", totalOrders: 118, completedOrders: 103, canceledOrders: 15, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Jane Smith", phone: "+1234567890", orderCount: 5, totalSpend: 250, status: "Inactive", email: "jane.smith@example.com", address: "28 Oak St, LA", totalOrders: 72, completedOrders: 61, canceledOrders: 11, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Emily Davis", phone: "+1234567890", orderCount: 30, totalSpend: 4600, status: "VIP", email: "emily.davis@example.com", address: "45 Pine Ave, CA", totalOrders: 118, completedOrders: 103, canceledOrders: 15, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST031", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Jane Smith", phone: "+1234567890", orderCount: 5, totalSpend: 250, status: "Inactive", email: "jane.smith@example.com", address: "28 Oak St, LA", totalOrders: 72, completedOrders: 61, canceledOrders: 11, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST033", name: "Emily Davis", phone: "+1234567890", orderCount: 30, totalSpend: 4600, status: "VIP", email: "emily.davis@example.com", address: "45 Pine Ave, CA", totalOrders: 118, completedOrders: 103, canceledOrders: 15, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Jane Smith", phone: "+1234567890", orderCount: 5, totalSpend: 250, status: "Inactive", email: "jane.smith@example.com", address: "28 Oak St, LA", totalOrders: 72, completedOrders: 61, canceledOrders: 11, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Emily Davis", phone: "+1234567890", orderCount: 30, totalSpend: 4600, status: "VIP", email: "emily.davis@example.com", address: "45 Pine Ave, CA", totalOrders: 118, completedOrders: 103, canceledOrders: 15, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Jane Smith", phone: "+1234567890", orderCount: 5, totalSpend: 250, status: "Inactive", email: "jane.smith@example.com", address: "28 Oak St, LA", totalOrders: 72, completedOrders: 61, canceledOrders: 11, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Emily Davis", phone: "+1234567890", orderCount: 30, totalSpend: 4600, status: "VIP", email: "emily.davis@example.com", address: "45 Pine Ave, CA", totalOrders: 118, completedOrders: 103, canceledOrders: 15, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Jane Smith", phone: "+1234567890", orderCount: 5, totalSpend: 250, status: "Inactive", email: "jane.smith@example.com", address: "28 Oak St, LA", totalOrders: 72, completedOrders: 61, canceledOrders: 11, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Jane Smith", phone: "+1234567890", orderCount: 5, totalSpend: 250, status: "Inactive", email: "jane.smith@example.com", address: "28 Oak St, LA", totalOrders: 72, completedOrders: 61, canceledOrders: 11, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Emily Davis", phone: "+1234567890", orderCount: 30, totalSpend: 4600, status: "VIP", email: "emily.davis@example.com", address: "45 Pine Ave, CA", totalOrders: 118, completedOrders: 103, canceledOrders: 15, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Emily Davis", phone: "+1234567890", orderCount: 30, totalSpend: 4600, status: "VIP", email: "emily.davis@example.com", address: "45 Pine Ave, CA", totalOrders: 118, completedOrders: 103, canceledOrders: 15, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Jane Smith", phone: "+1234567890", orderCount: 5, totalSpend: 250, status: "Inactive", email: "jane.smith@example.com", address: "28 Oak St, LA", totalOrders: 72, completedOrders: 61, canceledOrders: 11, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Emily Davis", phone: "+1234567890", orderCount: 30, totalSpend: 4600, status: "VIP", email: "emily.davis@example.com", address: "45 Pine Ave, CA", totalOrders: 118, completedOrders: 103, canceledOrders: 15, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Jane Smith", phone: "+1234567890", orderCount: 5, totalSpend: 250, status: "Inactive", email: "jane.smith@example.com", address: "28 Oak St, LA", totalOrders: 72, completedOrders: 61, canceledOrders: 11, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Emily Davis", phone: "+1234567890", orderCount: 30, totalSpend: 4600, status: "VIP", email: "emily.davis@example.com", address: "45 Pine Ave, CA", totalOrders: 118, completedOrders: 103, canceledOrders: 15, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Jane Smith", phone: "+1234567890", orderCount: 5, totalSpend: 250, status: "Inactive", email: "jane.smith@example.com", address: "28 Oak St, LA", totalOrders: 72, completedOrders: 61, canceledOrders: 11, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Emily Davis", phone: "+1234567890", orderCount: 30, totalSpend: 4600, status: "VIP", email: "emily.davis@example.com", address: "45 Pine Ave, CA", totalOrders: 118, completedOrders: 103, canceledOrders: 15, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" }, { id: "#CUST001", name: "Jane Smith", phone: "+1234567890", orderCount: 5, totalSpend: 250, status: "Inactive", email: "jane.smith@example.com", address: "28 Oak St, LA", totalOrders: 72, completedOrders: 61, canceledOrders: 11, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Emily Davis", phone: "+1234567890", orderCount: 30, totalSpend: 4600, status: "VIP", email: "emily.davis@example.com", address: "45 Pine Ave, CA", totalOrders: 118, completedOrders: 103, canceledOrders: 15, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Jane Smith", phone: "+1234567890", orderCount: 5, totalSpend: 250, status: "Inactive", email: "jane.smith@example.com", address: "28 Oak St, LA", totalOrders: 72, completedOrders: 61, canceledOrders: 11, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Emily Davis", phone: "+1234567890", orderCount: 30, totalSpend: 4600, status: "VIP", email: "emily.davis@example.com", address: "45 Pine Ave, CA", totalOrders: 118, completedOrders: 103, canceledOrders: 15, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Jane Smith", phone: "+1234567890", orderCount: 5, totalSpend: 250, status: "Inactive", email: "jane.smith@example.com", address: "28 Oak St, LA", totalOrders: 72, completedOrders: 61, canceledOrders: 11, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "Emily Davis", phone: "+1234567890", orderCount: 30, totalSpend: 4600, status: "VIP", email: "emily.davis@example.com", address: "45 Pine Ave, CA", totalOrders: 118, completedOrders: 103, canceledOrders: 15, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
    { id: "#CUST001", name: "John Doe", phone: "+1234567890", orderCount: 25, totalSpend: 3450, status: "Active", email: "john.doe@example.com", address: "123 Main St, NY", totalOrders: 150, completedOrders: 140, canceledOrders: 10, registrationDate: "15.01.2025", lastPurchaseDate: "10.01.2025" },
];

const customers = baseCustomers.map((customer, index) => ({
    ...customer,
    uid: String(index + 1),
}));

const statusColors = {
    Active: "#22C55E",
    Inactive: "#EF4444",
    VIP: "#F59E0B",
};

const PAGE_SIZE = 10;

const getPaginationItems = (currentPage, totalPages) => {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 4) {
        return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (currentPage >= totalPages - 3) {
        return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
};

export const CustomersProvider = ({ children }) => {
    const [activeRange, setActiveRange] = useState("This week");
    const [activeStat, setActiveStat] = useState(getSafeStat(overviewStats));
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(customers.length / PAGE_SIZE);
    const pagination = useMemo(() => getPaginationItems(currentPage, totalPages), [currentPage, totalPages]);

    const visibleCustomers = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return customers.slice(start, start + PAGE_SIZE);
    }, [currentPage]);

    const customersWithVisibleId = useMemo(() => (
        visibleCustomers.map((customer, index) => ({
            ...customer,
            id: `#CUST${String((currentPage - 1) * PAGE_SIZE + index + 1).padStart(4, "0")}`,
        }))
    ), [visibleCustomers, currentPage]);

    const selectedCustomer = useMemo(() => {
        if (!selectedCustomerId) {
            return null;
        }

        return customers.find((customer) => customer.uid === selectedCustomerId) || null;
    }, [selectedCustomerId]);

    const value = useMemo(() => ({
        summaryCards,
        overviewStats,
        weekSeries,
        activeRange,
        setActiveRange,
        activeStat,
        setActiveStat,
        customers: customersWithVisibleId,
        selectedCustomer,
        selectedCustomerId,
        setSelectedCustomerId,
        currentPage,
        setCurrentPage,
        pagination,
        totalPages,
        statusColors,
    }), [activeRange, activeStat, customersWithVisibleId, selectedCustomer, selectedCustomerId, currentPage, pagination, totalPages]);

    return <CustomersContext.Provider value={value}>{children}</CustomersContext.Provider>;
};