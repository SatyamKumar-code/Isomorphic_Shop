import React from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

const getInitials = (product) => {
    return product
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toUpperCase();
};

const ProductThumb = ({ product, index, thumbnailColors, image }) => {
    const palette = thumbnailColors[index % thumbnailColors.length];
    const imageSrc = image || '';

    return (
        <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 text-[10px] font-bold shadow-sm"
            style={{ backgroundColor: palette.background, color: palette.color }}
            aria-hidden="true"
        >
            {imageSrc ? (
                <img
                    src={imageSrc}
                    alt={product}
                    className="h-full w-full rounded-md object-cover"
                    loading="lazy"
                />
            ) : (
                getInitials(product)
            )}
        </div>
    );
};

const PaymentBadge = ({ status, paymentColor, children }) => {
    return (
        <span className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: paymentColor[status] }}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: paymentColor[status] }} />
            {children}
        </span>
    );
};

const deliveryFlowStages = ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
const refundFlowStages = ['requested', 'approved', 'pickup_completed', 'initiated', 'processed'];

const formatStatusLabel = (value) => String(value || '')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const OrderFlowTimeline = ({ rawStatus }) => {
    const normalizedStatus = String(rawStatus || '').toLowerCase();

    if (normalizedStatus === 'cancelled') {
        return (
            <div className="w-32">
                <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-300">
                    Cancelled
                </span>
            </div>
        );
    }

    const currentIndex = deliveryFlowStages.indexOf(normalizedStatus);
    const safeIndex = currentIndex >= 0 ? currentIndex : 0;

    return (
        <div className="w-32">
            <div className="mb-1 flex items-center gap-1">
                {deliveryFlowStages.map((stage, index) => (
                    <span
                        key={stage}
                        className={`h-1.5 flex-1 rounded ${index <= safeIndex ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                    />
                ))}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {formatStatusLabel(deliveryFlowStages[safeIndex])}
            </p>
        </div>
    );
};

const RefundFlowTimeline = ({ rawRefundStatus }) => {
    const normalizedStatus = String(rawRefundStatus || 'none').toLowerCase();

    if (normalizedStatus === 'none') {
        return <span className="text-[11px] text-slate-400">Not requested</span>;
    }

    if (normalizedStatus === 'rejected') {
        return (
            <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-300">
                Rejected
            </span>
        );
    }

    const currentIndex = refundFlowStages.indexOf(normalizedStatus);
    const safeIndex = currentIndex >= 0 ? currentIndex : 0;
    const visibleStages = refundFlowStages.slice(0, safeIndex + 1);

    return (
        <div className="w-24">
            <div className="mb-1 flex items-center gap-1">
                {visibleStages.map((stage) => (
                    <span
                        key={stage}
                        className="h-1.5 flex-1 rounded bg-cyan-500"
                    />
                ))}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{formatStatusLabel(refundFlowStages[safeIndex])}</p>
        </div>
    );
};

const DeliveredIcon = ({ color }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M4.25 3.75H13.5C14.4665 3.75 15.25 4.53351 15.25 5.5V6.88965H17.2041C17.7848 6.88978 18.3279 7.1782 18.6533 7.65918L21.1992 11.4238C21.395 11.7132 21.4999 12.0549 21.5 12.4043V17.25H22C22.1381 17.25 22.25 17.3619 22.25 17.5C22.25 17.6381 22.1381 17.75 22 17.75H19.6621L19.5869 18.1582C19.3651 19.3485 18.3198 20.2498 17.0654 20.25C15.8109 20.25 14.7657 19.3487 14.5439 18.1582L14.4678 17.75H9.91211L9.83691 18.1582C9.61515 19.3485 8.56978 20.2498 7.31543 20.25C6.06089 20.25 5.01579 19.3487 4.79395 18.1582L4.71777 17.75H4.25C3.28351 17.75 2.5 16.9665 2.5 16V5.5C2.5 4.5335 3.2835 3.75 4.25 3.75ZM7.31543 15.6201C6.17509 15.6201 5.25023 16.5443 5.25 17.6846C5.25 18.825 6.17495 19.75 7.31543 19.75C8.45571 19.7498 9.37988 18.8249 9.37988 17.6846C9.37965 16.5445 8.45557 15.6203 7.31543 15.6201ZM17.0654 15.6201C15.9251 15.6201 15.0002 16.5443 15 17.6846C15 18.825 15.925 19.75 17.0654 19.75C18.2057 19.7498 19.1299 18.8249 19.1299 17.6846C19.1297 16.5445 18.2055 15.6203 17.0654 15.6201ZM4.25 4.25C3.55965 4.25 3 4.80965 3 5.5V16C3 16.6903 3.55964 17.25 4.25 17.25H4.75977L4.87109 16.9023C5.20208 15.8679 6.17245 15.1201 7.31543 15.1201C8.45822 15.1203 9.42782 15.868 9.75879 16.9023L9.87012 17.25H14.5098L14.6211 16.9023C14.6466 16.8227 14.6762 16.7448 14.709 16.6689L14.75 16.5742V5.5C14.75 4.80964 14.1903 4.25 13.5 4.25H4.25ZM15.25 15.707L15.9648 15.3672C16.2977 15.2089 16.6707 15.1201 17.0654 15.1201C18.2082 15.1203 19.1779 15.8681 19.5088 16.9023L19.6201 17.25H21V12.1953H15.25V15.707ZM15.25 11.6953H20.7793L20.251 10.915L18.2393 7.93945C18.0068 7.5959 17.6189 7.38978 17.2041 7.38965H15.25V11.6953Z" stroke={color} />
        <path d="M12 10C12 11.6569 10.6569 13 9 13C7.34315 13 6 11.6569 6 10C6 8.34315 7.34315 7 9 7C9.47068 7 9.91605 7.1084 10.3125 7.30159M11.4375 8.125L8.8125 10.75L8.0625 10" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const PendingIcon = ({ color }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M18.9375 18.9375C18.9375 19.5508 18.6939 20.139 18.2602 20.5727C17.8265 21.0064 17.2383 21.25 16.625 21.25C16.0117 21.25 15.4235 21.0064 14.9898 20.5727C14.5561 20.139 14.3125 19.5508 14.3125 18.9375C14.3125 18.3242 14.5561 17.736 14.9898 17.3023C15.4235 16.8686 16.0117 16.625 16.625 16.625C17.2383 16.625 17.8265 16.8686 18.2602 17.3023C18.6939 17.736 18.9375 18.3242 18.9375 18.9375ZM9.6875 18.9375C9.6875 19.5508 9.44386 20.139 9.01018 20.5727C8.57651 21.0064 7.98831 21.25 7.375 21.25C6.76169 21.25 6.17349 21.0064 5.73982 20.5727C5.30614 20.139 5.0625 19.5508 5.0625 18.9375C5.0625 18.3242 5.30614 17.736 5.73982 17.3023C6.17349 16.8686 6.76169 16.625 7.375 16.625C7.98831 16.625 8.57651 16.8686 9.01018 17.3023C9.44386 17.736 9.6875 18.3242 9.6875 18.9375Z" stroke={color} strokeWidth="1.58571" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2.75 12V16.625C2.75 17.4899 2.75 17.9219 2.93592 18.2438C3.0577 18.4547 3.23284 18.6298 3.44375 18.7516C3.76565 18.9375 4.19763 18.9375 5.0625 18.9375M14.3125 18.9375H9.6875M14.775 17.0875V9.225C14.775 7.91705 14.775 7.26308 14.368 6.857C13.9629 6.45 13.3089 6.45 12 6.45H11.075M15.2375 8.7625H16.9034C17.6712 8.7625 18.055 8.7625 18.3732 8.94287C18.6914 9.12232 18.8885 9.45162 19.2835 10.1102L20.855 12.728C21.0511 13.0554 21.1492 13.2201 21.2 13.4014C21.25 13.5836 21.25 13.7742 21.25 14.1562V16.625C21.25 17.4899 21.25 17.9219 21.0641 18.2438C20.9423 18.4547 20.7672 18.6298 20.5563 18.7516C20.2344 18.9375 19.8024 18.9375 18.9375 18.9375M8.16125 8.16125L6.9125 7.32875V5.2475M2.75 6.9125C2.75 7.45913 2.85767 8.0004 3.06685 8.50542C3.27604 9.01044 3.58264 9.46931 3.96917 9.85583C4.35569 10.2424 4.81456 10.549 5.31958 10.7581C5.8246 10.9673 6.36587 11.075 6.9125 11.075C7.45913 11.075 8.0004 10.9673 8.50542 10.7581C9.01044 10.549 9.46931 10.2424 9.85583 9.85583C10.2424 9.46931 10.549 9.01044 10.7581 8.50542C10.9673 8.0004 11.075 7.45913 11.075 6.9125C11.075 5.80854 10.6365 4.74979 9.85583 3.96917C9.07521 3.18855 8.01646 2.75 6.9125 2.75C5.80854 2.75 4.74979 3.18855 3.96917 3.96917C3.18855 4.74979 2.75 5.80854 2.75 6.9125Z" stroke={color} strokeWidth="1.58571" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const ShippedIcon = ({ color }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M15.8 15.5732V6.53867C15.8 6.03476 15.5998 5.55149 15.2435 5.19517C14.8872 4.83885 14.4039 4.63867 13.9 4.63867H4.4C3.89609 4.63867 3.41282 4.83885 3.0565 5.19517C2.70018 5.55149 2.5 6.03476 2.5 6.53867V15.0887C2.5 15.3406 2.60009 15.5823 2.77825 15.7604C2.95641 15.9386 3.19804 16.0387 3.45 16.0387H4.1245C4.30968 15.6158 4.61407 15.2561 5.00044 15.0036C5.3868 14.751 5.8384 14.6165 6.3 14.6165C6.7616 14.6165 7.2132 14.751 7.59956 15.0036C7.98593 15.2561 8.29032 15.6158 8.4755 16.0387H15.5245C15.5942 15.8708 15.686 15.7157 15.8 15.5732ZM15.8 15.5732C16.0469 15.2383 16.3777 14.9744 16.7592 14.8083C17.1406 14.6421 17.5591 14.5794 17.9724 14.6266C18.3858 14.6739 18.7794 14.8293 19.1135 15.0772C19.4477 15.3251 19.7105 15.6567 19.8755 16.0387H21.5V13.2932C21.5004 12.6038 21.3132 11.9273 20.9585 11.3362L19.79 9.38867L18.9255 7.95417C18.8414 7.81236 18.7219 7.69487 18.5786 7.61325C18.4354 7.53163 18.2734 7.4887 18.1085 7.48867H15.8V15.5732ZM11.0498 11.2885H6.2998M11.0498 8.43848H6.2998M8.6748 16.9885C8.67522 17.3418 8.5968 17.6907 8.44527 18.0099C8.29374 18.3291 8.07291 18.6104 7.79887 18.8334C7.52483 19.0564 7.20449 19.2155 6.8612 19.299C6.5179 19.3825 6.1603 19.3884 5.81444 19.3161C5.46859 19.2439 5.14321 19.0955 4.862 18.8816C4.58079 18.6677 4.35085 18.3938 4.18892 18.0798C4.027 17.7657 3.93717 17.4195 3.92599 17.0664C3.91482 16.7133 3.98256 16.3621 4.1243 16.0385C4.343 15.5391 4.72681 15.1302 5.21132 14.8804C5.69583 14.6305 6.25154 14.555 6.78517 14.6664C7.31879 14.7778 7.79785 15.0694 8.14193 15.4922C8.48601 15.915 8.67416 16.4433 8.6748 16.9885ZM20.0748 16.9885C20.0752 17.3418 19.9968 17.6907 19.8453 18.0099C19.6937 18.3291 19.4729 18.6104 19.1989 18.8334C18.9248 19.0564 18.6045 19.2155 18.2612 19.299C17.9179 19.3825 17.5603 19.3884 17.2144 19.3161C16.8686 19.2439 16.5432 19.0955 16.262 18.8816C15.9808 18.6677 15.7508 18.3938 15.5889 18.0798C15.427 17.7657 15.3372 17.4195 15.326 17.0664C15.3148 16.7133 15.3826 16.3621 15.5243 16.0385C15.594 15.8706 15.6858 15.7155 15.7998 15.573C16.0467 15.2381 16.3775 14.9742 16.759 14.8081C17.1404 14.6419 17.5589 14.5792 17.9722 14.6264C18.3856 14.6737 18.7792 14.8291 19.1133 15.077C19.4475 15.3249 19.7103 15.6565 19.8753 16.0385C20.0083 16.3377 20.0767 16.6617 20.0748 16.9885Z" stroke={color} strokeWidth="1.425" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const CancelledIcon = ({ color }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M4.25 3.75H13.5C14.4665 3.75 15.25 4.53351 15.25 5.5V6.88965H17.2041C17.7848 6.88978 18.3279 7.1782 18.6533 7.65918L21.1992 11.4238C21.395 11.7132 21.4999 12.0549 21.5 12.4043V17.25H22C22.1381 17.25 22.25 17.3619 22.25 17.5C22.25 17.6381 22.1381 17.75 22 17.75H19.6621L19.5869 18.1582C19.3651 19.3485 18.3198 20.2498 17.0654 20.25C15.8109 20.25 14.7657 19.3487 14.5439 18.1582L14.4678 17.75H9.91211L9.83691 18.1582C9.61515 19.3485 8.56978 20.2498 7.31543 20.25C6.06089 20.25 5.01579 19.3487 4.79395 18.1582L4.71777 17.75H4.25C3.28351 17.75 2.5 16.9665 2.5 16V5.5C2.5 4.5335 3.2835 3.75 4.25 3.75ZM7.31543 15.6201C6.17509 15.6201 5.25023 16.5443 5.25 17.6846C5.25 18.825 6.17495 19.75 7.31543 19.75C8.45571 19.7498 9.37988 18.8249 9.37988 17.6846C9.37965 16.5445 8.45557 15.6203 7.31543 15.6201ZM17.0654 15.6201C15.9251 15.6201 15.0002 16.5443 15 17.6846C15 18.825 15.925 19.75 17.0654 19.75C18.2057 19.7498 19.1299 18.8249 19.1299 17.6846C19.1297 16.5445 18.2055 15.6203 17.0654 15.6201ZM4.25 4.25C3.55965 4.25 3 4.80965 3 5.5V16C3 16.6903 3.55964 17.25 4.25 17.25H4.75977L4.87109 16.9023C5.20208 15.8679 6.17245 15.1201 7.31543 15.1201C8.45822 15.1203 9.42782 15.868 9.75879 16.9023L9.87012 17.25H14.5098L14.6211 16.9023C14.6466 16.8227 14.6762 16.7448 14.709 16.6689L14.75 16.5742V5.5C14.75 4.80964 14.1903 4.25 13.5 4.25H4.25ZM15.25 15.707L15.9648 15.3672C16.2977 15.2089 16.6707 15.1201 17.0654 15.1201C18.2082 15.1203 19.1779 15.8681 19.5088 16.9023L19.6201 17.25H21V12.1953H15.25V15.707ZM15.25 11.6953H20.7793L20.251 10.915L18.2393 7.93945C18.0068 7.5959 17.6189 7.38978 17.2041 7.38965H15.25V11.6953Z" stroke={color} />
        <path d="M8.651 10.849L10.349 9.151M10.349 10.849L8.651 9.151M9.5 13C11.15 13 12.5 11.65 12.5 10C12.5 8.35 11.15 7 9.5 7C7.85 7 6.5 8.35 6.5 10C6.5 11.65 7.85 13 9.5 13Z" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const StatusIcon = ({ status, color }) => {
    if (status === 'Delivered') return <DeliveredIcon color={color} />;
    if (status === 'Pending' || status === 'Confirmed' || status === 'Packed') return <PendingIcon color={color} />;
    if (status === 'Shipped' || status === 'Out For Delivery') return <ShippedIcon color={color} />;
    return <CancelledIcon color={color} />;
};

const EmptyTable = ({ colSpan }) => (
    <tr>
        <td className="px-4 py-8 text-center text-sm text-slate-500" colSpan={colSpan}>
            No records found.
        </td>
    </tr>
);

const OrdersTable = ({
    variant = 'orders',
    rows = [],
    isLoading = false,
    currentPage = 1,
    pageSize = 10,
    paymentColor = {},
    thumbnailColors = [],
    onOrderStatusChange,
    isStatusUpdatingId = '',
    onOrderRefundStatusChange,
    isRefundUpdatingId = '',
    showOrderActions = true,
    showSellerColumn = true,
}) => {
    if (isLoading) {
        return <div className="mt-6 text-sm text-slate-500">Loading records...</div>;
    }

    const colors = thumbnailColors.length
        ? thumbnailColors
        : [
            { background: '#F1F8FF', color: '#2563EB' },
            { background: '#FFF7ED', color: '#EA580C' },
            { background: '#F0FDF4', color: '#16A34A' },
            { background: '#F5F3FF', color: '#7C3AED' },
        ];

    const allowedStatusTransitions = {
        pending: ['pending', 'confirmed', 'cancelled'],
        confirmed: ['confirmed', 'packed', 'cancelled'],
        packed: ['packed', 'shipped', 'cancelled'],
        shipped: ['shipped', 'out_for_delivery'],
        out_for_delivery: ['out_for_delivery', 'delivered'],
        delivered: ['delivered'],
        cancelled: ['cancelled'],
    };

    const allowedRefundTransitions = {
        delivered: {
            none: ['none', 'requested'],
            requested: ['requested', 'approved', 'rejected'],
            approved: ['approved', 'pickup_completed', 'rejected'],
            pickup_completed: ['pickup_completed', 'initiated'],
            initiated: ['initiated', 'processed'],
            processed: ['processed'],
            rejected: ['rejected'],
        },
        cancelled: {
            none: ['none', 'initiated'],
            initiated: ['initiated', 'processed'],
            processed: ['processed'],
            rejected: ['rejected'],
        },
    };

    const emptyColSpan = variant === 'orders'
        ? (8 + (showSellerColumn ? 1 : 0) + (showOrderActions ? 1 : 0))
        : 5;

    return (
        <div className="mt-6 overflow-x-auto scrollbarNone">
            <table className="min-w-full table-fixed border-collapse text-left">
                <thead>
                    {variant === 'orders' ? (

                        // Orders Table Header
                        <tr className="rounded-lg bg-[#EAF8E7] text-[12px] font-semibold uppercase text-slate-600">
                            <th className="rounded-l-lg px-4 py-3">No.</th>
                            <th className="px-4 py-3">Order Id</th>
                            <th className="px-4 py-3">Product</th>
                            {showSellerColumn && <th className="px-4 py-3">Seller</th>}
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Price</th>
                            <th className="px-4 py-3">Payment</th>
                            <th className="px-4 py-3">Delivery Flow</th>
                            <th className="px-4 py-3">Refund Flow</th>
                            {showOrderActions && <th className="rounded-r-lg px-4 py-3">Action</th>}
                        </tr>
                    ) : (
                        // Products Table Header
                        <tr className="rounded-lg bg-[#EAF8E7] text-[12px] font-semibold text-slate-600">
                            <th className="rounded-l-lg px-4 py-3">No.</th>
                            <th className="px-4 py-3">Product</th>
                            <th className="px-4 py-3">Created Date</th>
                            <th className="px-4 py-3">Stock</th>
                            <th className="rounded-r-lg px-4 py-3">Action</th>
                        </tr>
                    )}
                </thead>

                <tbody>
                    {!rows.length && <EmptyTable colSpan={emptyColSpan} />}

                    {variant === 'orders'
                        ? rows.map((order, index) => (

                            // Order Table Row
                            <tr key={`${order.id}-${index}`} className="border-b border-slate-200 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-200">
                                {(() => {
                                    const currentRawStatus = String(order.rawStatus || order.status || '').toLowerCase();
                                    const currentRawRefundStatus = String(order.rawRefundStatus || 'none').toLowerCase();
                                    const statusOptions = allowedStatusTransitions[currentRawStatus]
                                        || allowedStatusTransitions.pending;
                                    const statusRefundFlow = allowedRefundTransitions[currentRawStatus] || null;
                                    const refundOptions = statusRefundFlow
                                        ? (statusRefundFlow[currentRawRefundStatus] || [currentRawRefundStatus])
                                        : ['none'];
                                    const refundDisabled = !statusRefundFlow || order.payment !== 'Paid';
                                    const shortOrderId = order.orderId || (order.id ? `#${String(order.id).slice(-8).toUpperCase()}` : '-');

                                    return (
                                        <>
                                            <td className="px-4 py-4">
                                                <span>{(currentPage - 1) * pageSize + index + 1}</span>
                                            </td>
                                            <td className="px-4 py-4 font-medium text-slate-500">{shortOrderId}</td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <ProductThumb
                                                        product={order.product}
                                                        index={index}
                                                        thumbnailColors={colors}
                                                        image={order.image || order.thumbnail || order.productImage}
                                                    />
                                                    <span className="wrap-break-word whitespace-normal leading-5 text-slate-700 dark:text-slate-200">{order.product}</span>
                                                </div>
                                            </td>
                                            {showSellerColumn && (
                                                <td className="whitespace-nowrap px-4 py-4">{order.sellerName || 'Unknown Seller'}</td>
                                            )}
                                            <td className="whitespace-nowrap px-4 py-4">{order.date}</td>
                                            <td className="whitespace-nowrap px-4 py-4">{order.price}</td>
                                            <td className="px-4 py-4">
                                                <PaymentBadge status={order.payment} paymentColor={paymentColor}>{order.payment}</PaymentBadge>
                                            </td>
                                            <td className="px-4 py-4">
                                                <OrderFlowTimeline rawStatus={currentRawStatus} />
                                            </td>
                                            <td className="px-4 py-4">
                                                <RefundFlowTimeline rawRefundStatus={currentRawRefundStatus} />
                                            </td>
                                            {showOrderActions && (
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <select
                                                            className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200"
                                                            value={currentRawStatus}
                                                            onChange={(event) => onOrderStatusChange?.(order.id, event.target.value)}
                                                            disabled={isStatusUpdatingId === order.id || statusOptions.length <= 1}
                                                        >
                                                            {statusOptions.map((statusValue) => (
                                                                <option key={statusValue} value={statusValue}>
                                                                    {formatStatusLabel(statusValue)}
                                                                </option>
                                                            ))}
                                                        </select>

                                                        <select
                                                            className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-gray-950 dark:text-slate-200"
                                                            value={currentRawRefundStatus}
                                                            onChange={(event) => onOrderRefundStatusChange?.(order.id, event.target.value)}
                                                            disabled={refundDisabled || isRefundUpdatingId === order.id || refundOptions.length <= 1}
                                                        >
                                                            {refundOptions.map((refundValue) => (
                                                                <option key={refundValue} value={refundValue}>
                                                                    {formatStatusLabel(refundValue)}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </td>
                                            )}
                                        </>
                                    );
                                })()}
                            </tr>
                        ))
                        : rows.map((item, index) => (

                            // Product Table Row
                            <tr key={`${item.id}-${index}`} className="border-b border-slate-200 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-200">
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <span>{(currentPage - 1) * pageSize + index + 1}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex min-w-55 items-center gap-3">
                                        <ProductThumb
                                            product={item.product}
                                            index={index}
                                            thumbnailColors={colors}
                                            image={item.image || item.thumbnail || item.productImage}
                                        />
                                        <span className="whitespace-normal leading-5 text-slate-700 dark:text-slate-200">{item.product}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4">{item.date}</td>
                                <td className="px-4 py-4">{item.stock ?? item.order ?? 0}</td>
                                <td className="px-4 py-4">
                                    <div className="inline-flex items-center gap-3 text-slate-500">
                                        <button
                                            className="transition hover:text-[#4EA674]"
                                            aria-label="Edit row"
                                            onClick={item.onEdit}
                                            disabled={!item.onEdit}
                                        >
                                            <FiEdit2 />
                                        </button>
                                        <button
                                            className="transition hover:text-red-500"
                                            aria-label="Delete row"
                                            onClick={item.onDelete}
                                            disabled={!item.onDelete}
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                </tbody>
            </table>
        </div>
    );
};

export default OrdersTable;