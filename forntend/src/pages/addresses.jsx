import React, { useEffect, useState } from 'react';
import AddressForm from '../components/address/AddressForm';
import AddressList from '../components/address/AddressList';
import { fetchDataFromApi } from '../utils/api';

const Addresses = () => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);

    const loadAddresses = async () => {
        setLoading(true);
        const res = await fetchDataFromApi('/api/address/');
        // server returns { address } or may have { data }
        setAddresses(res?.address || res?.data || []);
        setLoading(false);
    };

    useEffect(() => {
        loadAddresses();
    }, []);

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Your Addresses</h1>
            <div className="grid gap-6 md:grid-cols-2">
                <div>
                    <AddressForm onAdd={loadAddresses} initialValues={editing} addressId={editing?._id} onDone={() => setEditing(null)} />
                </div>
                <div>
                    <AddressList addresses={addresses} loading={loading} onChange={loadAddresses} onEdit={(a) => setEditing(a)} />
                </div>
            </div>
        </div>
    );
};

export default Addresses;
