import React from 'react';
import {
    getOrderAddressesByUser,
    searchOrderCustomers,
    searchOrderProducts,
} from '../OrderManagementAPI';

const initialProductRow = { productId: '', quantity: 1 };

const AddOrderModal = ({ isOpen, isSubmitting = false, onClose, onSubmit }) => {
    const [form, setForm] = React.useState({
        userId: '',
        delivery_address: '',
        paymentMethod: 'COD',
        paymentStatus: 'pending',
        status: 'pending',
        paymentId: '',
        products: [initialProductRow],
    });
    const [errors, setErrors] = React.useState({});
    const [customerSearch, setCustomerSearch] = React.useState('');
    const [customerOptions, setCustomerOptions] = React.useState([]);
    const [customerActiveIndex, setCustomerActiveIndex] = React.useState(-1);
    const [isCustomerLoading, setIsCustomerLoading] = React.useState(false);
    const [addressOptions, setAddressOptions] = React.useState([]);
    const [isAddressLoading, setIsAddressLoading] = React.useState(false);
    const [productOptions, setProductOptions] = React.useState({});
    const [productActiveIndexByRow, setProductActiveIndexByRow] = React.useState({});
    const productSearchTimeoutRef = React.useRef({});

    React.useEffect(() => {
        if (!isOpen) {
            setForm({
                userId: '',
                delivery_address: '',
                paymentMethod: 'COD',
                paymentStatus: 'pending',
                status: 'pending',
                paymentId: '',
                products: [initialProductRow],
            });
            setErrors({});
            setCustomerSearch('');
            setCustomerOptions([]);
            setCustomerActiveIndex(-1);
            setAddressOptions([]);
            setProductOptions({});
            setProductActiveIndexByRow({});
        }
    }, [isOpen]);

    React.useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        const normalizedSearch = customerSearch.trim();
        if (normalizedSearch.length < 2) {
            setCustomerOptions([]);
            setCustomerActiveIndex(-1);
            return undefined;
        }

        const timeoutId = window.setTimeout(async () => {
            try {
                setIsCustomerLoading(true);
                const response = await searchOrderCustomers(normalizedSearch);
                const list = Array.isArray(response?.data?.data) ? response.data.data : [];
                setCustomerOptions(list);
                setCustomerActiveIndex(list.length ? 0 : -1);
            } catch (error) {
                setCustomerOptions([]);
                setCustomerActiveIndex(-1);
            } finally {
                setIsCustomerLoading(false);
            }
        }, 300);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [customerSearch, isOpen]);

    React.useEffect(() => {
        if (!form.userId.trim()) {
            setAddressOptions([]);
            setForm((prev) => ({ ...prev, delivery_address: '' }));
            return;
        }

        const loadAddresses = async () => {
            try {
                setIsAddressLoading(true);
                const response = await getOrderAddressesByUser(form.userId.trim());
                const list = Array.isArray(response?.data?.data) ? response.data.data : [];
                setAddressOptions(list);
            } catch (error) {
                setAddressOptions([]);
            } finally {
                setIsAddressLoading(false);
            }
        };

        loadAddresses();
    }, [form.userId]);

    React.useEffect(() => {
        return () => {
            Object.values(productSearchTimeoutRef.current).forEach((timeoutId) => {
                window.clearTimeout(timeoutId);
            });
        };
    }, []);

    if (!isOpen) {
        return null;
    }

    const validate = () => {
        const nextErrors = {};

        if (!form.userId.trim()) {
            nextErrors.userId = 'User ID is required';
        }

        if (!form.delivery_address.trim()) {
            nextErrors.delivery_address = 'Delivery address ID is required';
        }

        const validProducts = form.products.filter((item) => item.productId.trim() && Number(item.quantity) > 0);
        if (!validProducts.length) {
            nextErrors.products = 'At least one valid product is required';
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const updateField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const updateProduct = (index, key, value) => {
        setForm((prev) => {
            const nextProducts = [...prev.products];
            nextProducts[index] = { ...nextProducts[index], [key]: value };
            return { ...prev, products: nextProducts };
        });
    };

    const selectCustomer = (item) => {
        if (!item) return;

        updateField('userId', String(item.id));
        setCustomerSearch(`${item.name} (${item.email})`);
        setCustomerOptions([]);
        setCustomerActiveIndex(-1);
    };

    const selectProductForRow = (rowIndex, product) => {
        if (!product) return;

        updateProduct(rowIndex, 'productId', String(product.id));
        setProductOptions((prev) => ({ ...prev, [rowIndex]: [] }));
        setProductActiveIndexByRow((prev) => ({ ...prev, [rowIndex]: -1 }));
    };

    const fetchProductLookup = (index, query) => {
        const normalizedSearch = String(query || '').trim();

        if (productSearchTimeoutRef.current[index]) {
            window.clearTimeout(productSearchTimeoutRef.current[index]);
        }

        if (normalizedSearch.length < 2) {
            setProductOptions((prev) => ({ ...prev, [index]: [] }));
            setProductActiveIndexByRow((prev) => ({ ...prev, [index]: -1 }));
            return;
        }

        productSearchTimeoutRef.current[index] = window.setTimeout(async () => {
            try {
                const response = await searchOrderProducts(normalizedSearch);
                const list = Array.isArray(response?.data?.data) ? response.data.data : [];
                setProductOptions((prev) => ({ ...prev, [index]: list }));
                setProductActiveIndexByRow((prev) => ({ ...prev, [index]: list.length ? 0 : -1 }));
            } catch (error) {
                setProductOptions((prev) => ({ ...prev, [index]: [] }));
                setProductActiveIndexByRow((prev) => ({ ...prev, [index]: -1 }));
            }
        }, 250);
    };

    const addProductRow = () => {
        setForm((prev) => ({
            ...prev,
            products: [...prev.products, initialProductRow],
        }));
    };

    const removeProductRow = (index) => {
        setForm((prev) => {
            if (prev.products.length === 1) {
                return prev;
            }

            return {
                ...prev,
                products: prev.products.filter((_, itemIndex) => itemIndex !== index),
            };
        });
    };

    const submit = async (event) => {
        event.preventDefault();

        if (!validate()) {
            return;
        }

        const payload = {
            userId: form.userId.trim(),
            delivery_address: form.delivery_address.trim(),
            paymentMethod: form.paymentMethod,
            paymentStatus: form.paymentStatus,
            status: form.status,
            paymentId: form.paymentId.trim() || null,
            products: form.products
                .map((item) => ({
                    productId: item.productId.trim(),
                    quantity: Number(item.quantity),
                }))
                .filter((item) => item.productId && item.quantity > 0),
        };

        await onSubmit(payload);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
            <div className="w-full max-w-3xl rounded-lg bg-white p-5 shadow-xl dark:bg-gray-950">
                <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Create Order</h4>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-gray-900"
                    >
                        Close
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Customer Search</label>
                            <input
                                type="text"
                                value={customerSearch}
                                onChange={(event) => setCustomerSearch(event.target.value)}
                                onKeyDown={(event) => {
                                    if (!customerOptions.length) return;

                                    if (event.key === 'ArrowDown') {
                                        event.preventDefault();
                                        setCustomerActiveIndex((prev) => {
                                            const next = prev + 1;
                                            return next >= customerOptions.length ? 0 : next;
                                        });
                                    }

                                    if (event.key === 'ArrowUp') {
                                        event.preventDefault();
                                        setCustomerActiveIndex((prev) => {
                                            const next = prev - 1;
                                            return next < 0 ? customerOptions.length - 1 : next;
                                        });
                                    }

                                    if (event.key === 'Enter' && customerActiveIndex >= 0) {
                                        event.preventDefault();
                                        selectCustomer(customerOptions[customerActiveIndex]);
                                    }

                                    if (event.key === 'Escape') {
                                        setCustomerOptions([]);
                                        setCustomerActiveIndex(-1);
                                    }
                                }}
                                placeholder="Search by name/email/mobile"
                                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-gray-900 dark:text-slate-200"
                            />
                            <div className="mt-2 max-h-24 overflow-y-auto rounded border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-gray-900">
                                {isCustomerLoading ? <p className="px-2 py-1 text-xs text-slate-500">Searching...</p> : null}
                                {!isCustomerLoading && customerOptions.map((item, index) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => selectCustomer(item)}
                                        className={`block w-full rounded px-2 py-1 text-left text-xs text-slate-700 hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-emerald-900/20 ${customerActiveIndex === index ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}
                                    >
                                        {item.name} | {item.email} | {item.mobile || '-'}
                                    </button>
                                ))}
                                {!isCustomerLoading && customerSearch.trim().length >= 2 && !customerOptions.length ? <p className="px-2 py-1 text-xs text-slate-500">No matches</p> : null}
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">User ID</label>
                            <input
                                type="text"
                                value={form.userId}
                                onChange={(event) => updateField('userId', event.target.value)}
                                placeholder="Selected customer ID"
                                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-gray-900 dark:text-slate-200"
                            />
                            {errors.userId ? <p className="mt-1 text-xs text-red-500">{errors.userId}</p> : null}
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Delivery Address ID</label>
                            <select
                                value={form.delivery_address}
                                onChange={(event) => updateField('delivery_address', event.target.value)}
                                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-gray-900 dark:text-slate-200"
                            >
                                <option value="">{isAddressLoading ? 'Loading addresses...' : 'Select address'}</option>
                                {addressOptions.map((item) => (
                                    <option key={item.id} value={item.id}>{item.label}</option>
                                ))}
                            </select>
                            {errors.delivery_address ? <p className="mt-1 text-xs text-red-500">{errors.delivery_address}</p> : null}
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Payment Method</label>
                            <select
                                value={form.paymentMethod}
                                onChange={(event) => updateField('paymentMethod', event.target.value)}
                                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-gray-900 dark:text-slate-200"
                            >
                                <option value="COD">COD</option>
                                <option value="Razorpay">Razorpay</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Payment Status</label>
                            <select
                                value={form.paymentStatus}
                                onChange={(event) => updateField('paymentStatus', event.target.value)}
                                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-gray-900 dark:text-slate-200"
                            >
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Order Status</label>
                            <select
                                value={form.status}
                                onChange={(event) => updateField('status', event.target.value)}
                                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-gray-900 dark:text-slate-200"
                            >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="packed">Packed</option>
                                <option value="shipped">Shipped</option>
                                <option value="out_for_delivery">Out For Delivery</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Payment ID (optional)</label>
                            <input
                                type="text"
                                value={form.paymentId}
                                onChange={(event) => updateField('paymentId', event.target.value)}
                                className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-gray-900 dark:text-slate-200"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Products</p>
                            <button
                                type="button"
                                onClick={addProductRow}
                                className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-gray-900"
                            >
                                Add Product Row
                            </button>
                        </div>

                        <div className="space-y-2">
                            {form.products.map((item, index) => (
                                <div key={`product-row-${index}`} className="grid gap-2 md:grid-cols-[1fr_120px_100px]">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Product ID"
                                            value={item.productId}
                                            onChange={(event) => {
                                                const nextValue = event.target.value;
                                                updateProduct(index, 'productId', nextValue);
                                                fetchProductLookup(index, nextValue);
                                            }}
                                            onKeyDown={(event) => {
                                                const list = Array.isArray(productOptions[index]) ? productOptions[index] : [];
                                                if (!list.length) return;

                                                if (event.key === 'ArrowDown') {
                                                    event.preventDefault();
                                                    setProductActiveIndexByRow((prev) => {
                                                        const current = Number.isInteger(prev[index]) ? prev[index] : -1;
                                                        const next = current + 1;
                                                        return { ...prev, [index]: next >= list.length ? 0 : next };
                                                    });
                                                }

                                                if (event.key === 'ArrowUp') {
                                                    event.preventDefault();
                                                    setProductActiveIndexByRow((prev) => {
                                                        const current = Number.isInteger(prev[index]) ? prev[index] : -1;
                                                        const next = current - 1;
                                                        return { ...prev, [index]: next < 0 ? list.length - 1 : next };
                                                    });
                                                }

                                                if (event.key === 'Enter') {
                                                    const activeIndex = Number.isInteger(productActiveIndexByRow[index])
                                                        ? productActiveIndexByRow[index]
                                                        : -1;

                                                    if (activeIndex >= 0) {
                                                        event.preventDefault();
                                                        selectProductForRow(index, list[activeIndex]);
                                                    }
                                                }

                                                if (event.key === 'Escape') {
                                                    setProductOptions((prev) => ({ ...prev, [index]: [] }));
                                                    setProductActiveIndexByRow((prev) => ({ ...prev, [index]: -1 }));
                                                }
                                            }}
                                            className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-gray-900 dark:text-slate-200"
                                        />

                                        {Array.isArray(productOptions[index]) && productOptions[index].length ? (
                                            <div className="absolute z-20 mt-1 max-h-28 w-full overflow-y-auto rounded border border-slate-200 bg-white p-1 shadow-md dark:border-slate-700 dark:bg-gray-950">
                                                {productOptions[index].map((product, productIndex) => (
                                                    <button
                                                        key={product.id}
                                                        type="button"
                                                        onClick={() => selectProductForRow(index, product)}
                                                        className={`block w-full rounded px-2 py-1 text-left text-xs text-slate-700 hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-emerald-900/20 ${productActiveIndexByRow[index] === productIndex ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}
                                                    >
                                                        {product.productName} | Rs {product.price} | Stock {product.stock}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>

                                    <input
                                        type="number"
                                        min={1}
                                        value={item.quantity}
                                        onChange={(event) => updateProduct(index, 'quantity', event.target.value)}
                                        className="rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-gray-900 dark:text-slate-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeProductRow(index)}
                                        className="rounded border border-slate-200 px-2 py-2 text-xs text-red-500 hover:bg-red-50 dark:border-slate-700 dark:hover:bg-red-950/20"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                        {errors.products ? <p className="mt-1 text-xs text-red-500">{errors.products}</p> : null}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-gray-900"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded bg-[#4EA674] px-4 py-2 text-sm font-semibold text-white hover:bg-[#409162] disabled:opacity-60"
                        >
                            {isSubmitting ? 'Creating...' : 'Create Order'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddOrderModal;
