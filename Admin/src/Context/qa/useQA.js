import { useContext } from 'react';
import { QAContext } from './QAContext';

export const useQA = () => {
    const context = useContext(QAContext);
    if (!context) {
        throw new Error('useQA must be used within QAProvider');
    }
    return context;
};
