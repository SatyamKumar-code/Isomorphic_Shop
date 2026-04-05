import { useContext } from "react";
import { CustomersContext } from "./CustomersContext";

export const useCustomers = () => useContext(CustomersContext);