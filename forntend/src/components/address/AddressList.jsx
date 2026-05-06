import React, { useContext } from 'react';
import { deleteData, editData } from '../../utils/api';
import { MyContext } from '../../App';

const AddressList = ({ addresses = [], loading, onChange, onEdit, onSelect }) => {
    const context = useContext(MyContext);
    const handleDelete = async (id) => {
        if (!confirm('Delete this address?')) return;
        const res = await deleteData(`/api/address/${id}`);
        if (res?.error === false) {
            context.alertBox('Success', 'Address deleted successfully');
            onChange && onChange();
            return;
        }
        context.alertBox('error', res?.message || 'Unable to delete address');
    };

    if (loading) return <div>Loading addresses...</div>;

    if (!addresses || addresses.length === 0) return <div>No saved addresses yet.</div>;

    return (
        <div className="space-y-3">
            {addresses.map((a) => (
                <div key={a._id || a.id} className="p-3 border rounded bg-white flex justify-between items-start">
                    <div>
                        <div className="font-semibold">{a.name || a.addressType}</div>
                        <div className="text-sm">{a.address_line1}</div>
                        <div className="text-sm">{a.city} - {a.pincode}</div>
                        <div className="text-sm">{a.mobile}</div>
                    </div>
                    <div className="flex flex-col gap-2">
                        {onSelect && <button onClick={() => onSelect(a)} className="text-blue-600">Select</button>}
                        {onEdit && <button onClick={() => onEdit(a)} className="text-indigo-600">Edit</button>}
                        <button onClick={async () => { if (a.isDefault) return; const res = await editData(`/api/address/${a._id || a.id}`, { isDefault: true }); if (res?.error === false) context.alertBox('Success', 'Set as default'); else context.alertBox('error', 'Failed to set default'); onChange && onChange(); }} className={`text-${a.isDefault ? 'gray' : 'green'}-600`}> {a.isDefault ? 'Default' : 'Set Default'}</button>
                        <button onClick={() => handleDelete(a._id || a.id)} className="text-red-600">Delete</button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AddressList;
