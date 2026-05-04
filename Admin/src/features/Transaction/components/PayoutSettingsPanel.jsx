import React, { useEffect, useState } from "react";
import { getPayoutSettings, updatePayoutSettings } from "../payoutSettingsApi";

const PayoutSettingsPanel = () => {
    const [commissionRate, setCommissionRate] = useState("");
    const [returnChargeRate, setReturnChargeRate] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        setLoading(true);
        getPayoutSettings()
            .then((data) => {
                setCommissionRate(data.commissionRate);
                setReturnChargeRate(data.returnChargeRate);
            })
            .catch(() => setError("Failed to load settings"))
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess("");
        setError("");
        try {
            await updatePayoutSettings({ commissionRate, returnChargeRate });
            setSuccess("Settings updated successfully");
        } catch (err) {
            setError("Failed to update settings");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 bg-white rounded shadow w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Payout Settings</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <label>
                    Default Commission Rate (%)
                    <input
                        type="number"
                        min="2"
                        max="25"
                        step="0.1"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(e.target.value)}
                        className="input input-bordered w-full mt-1"
                        required
                    />
                </label>
                <label>
                    Return Charge Fixed Rate
                    <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={returnChargeRate}
                        onChange={(e) => setReturnChargeRate(e.target.value)}
                        className="input input-bordered w-full mt-1"
                        required
                    />
                </label>
                <button
                    type="submit"
                    className="btn btn-primary mt-2"
                    disabled={loading}
                >
                    {loading ? "Saving..." : "Save Settings"}
                </button>
                {success && <div className="text-green-600">{success}</div>}
                {error && <div className="text-red-600">{error}</div>}
            </form>
        </div>
    );
};

export default PayoutSettingsPanel;
