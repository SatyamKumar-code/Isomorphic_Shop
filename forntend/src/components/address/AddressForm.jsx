import React, { useContext, useEffect, useState } from 'react';
import { postData, editData } from '../../utils/api';
import { MyContext } from '../../App';

const empty = {
    name: '',
    address_line1: '',
    city: '',
    state: '',
    pincode: '',
    country: '',
    mobile: '',
    landmark: '',
    addressType: 'Home'
};

const AddressForm = ({ onAdd, initialValues = null, addressId = null, onDone }) => {
    const context = useContext(MyContext);
    const [form, setForm] = useState(empty);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (initialValues) {
            setForm({ ...empty, ...initialValues });
        } else {
            setForm(empty);
        }
    }, [initialValues]);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            let res;
            if (addressId) {
                res = await editData(`/api/address/${addressId}`, form);
            } else {
                res = await postData('/api/address/add', form);
            }

            setSaving(false);

            if (res?.error === false) {
                context.alertBox('Success', res?.message || 'Address saved successfully');
                onAdd && onAdd();
                onDone && onDone();
                setForm(empty);
                return;
            }

            context.alertBox('error', res?.message || 'Unable to save address');
        } catch (err) {
            setSaving(false);
            context.alertBox('error', 'Unable to save address');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3 bg-white p-4 rounded shadow">
            <h2 className="font-semibold">{addressId ? 'Edit Address' : 'Add Address'}</h2>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Full name" className="w-full p-2 border" />
            <input name="address_line1" value={form.address_line1} onChange={handleChange} placeholder="Address line" className="w-full p-2 border" />
            <input name="city" value={form.city} onChange={handleChange} placeholder="City" className="w-full p-2 border" />
            <input name="state" value={form.state} onChange={handleChange} placeholder="State" className="w-full p-2 border" />
            <input name="pincode" value={form.pincode} onChange={handleChange} placeholder="Pincode" className="w-full p-2 border" />
            <input name="country" value={form.country} onChange={handleChange} placeholder="Country" className="w-full p-2 border" />
            <input name="mobile" value={form.mobile} onChange={handleChange} placeholder="Mobile" className="w-full p-2 border" />
            <input name="landmark" value={form.landmark} onChange={handleChange} placeholder="Landmark" className="w-full p-2 border" />
            <select name="addressType" value={form.addressType} onChange={handleChange} className="w-full p-2 border">
                <option>Home</option>
                <option>Work</option>
                <option>Other</option>
            </select>
            <div className="flex justify-end">
                <button type="submit" disabled={saving} className="bg-blue-500 text-white px-4 py-2 rounded">
                    {saving ? 'Saving...' : (addressId ? 'Update Address' : 'Save Address')}
                </button>
            </div>
        </form>
    );
};

export default AddressForm;
