import toast from "react-hot-toast";

export const alertBox = (type, msg) => {
    if (type === "Success") {
        toast.success(msg)
    }
    if (type === "error") {
        toast.error(msg);
    }
}