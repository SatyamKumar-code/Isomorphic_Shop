import api from '../../services/api';

export const getPayoutSettings = async () => {
    const res = await api.get('/api/payout/admin/settings');
    if (res.data && res.data.data) {
        return res.data.data;
    }
    throw new Error('Failed to fetch settings');
};

export const updatePayoutSettings = async ({ commissionRate, returnChargeRate }) => {
    await api.put('/api/payout/admin/settings', {
        commissionRate: Number(commissionRate),
        returnChargeRate: Number(returnChargeRate),
    });
};
