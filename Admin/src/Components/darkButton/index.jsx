
import React, { useState, useEffect } from 'react';

const getSystemTheme = () => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return true;
    }
    return false;
};

const getInitialMode = () => {
    const stored = localStorage.getItem('darkMode');
    if (stored === 'true') return true;
    if (stored === 'false') return false;
    return getSystemTheme();
};

const DarkModeToggle = () => {
    const [dark, setDark] = useState(getInitialMode);

    useEffect(() => {
        if (dark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('darkMode', dark);
    }, [dark]);

    // Listen to system theme changes if user hasn't set preference
    useEffect(() => {
        const stored = localStorage.getItem('darkMode');
        if (stored === null) {
            const media = window.matchMedia('(prefers-color-scheme: dark)');
            const handler = (e) => setDark(e.matches);
            media.addEventListener('change', handler);
            return () => media.removeEventListener('change', handler);
        }
    }, []);

    return (
        <button
            onClick={() => setDark((d) => !d)}
            aria-label="Toggle dark mode"
            className={`relative w-14 h-8 flex items-center rounded-full transition-colors duration-300 focus:outline-none ml-4 ${dark ? 'bg-[#333]' : 'bg-[#eafbe3]'}`}
            style={{ minWidth: 56 }}
        >
            {/* Track */}
            <span className="absolute left-0 top-0 w-full h-full rounded-full" />
            {/* Thumb */}
            <span
                className={`absolute left-1 top-1 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center transition-transform duration-300 ${dark ? 'translate-x-6' : 'translate-x-0'}`}
            >
                {/* Sun icon */}
                {!dark ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
                ) : (
                    // Moon icon
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" /></svg>
                )}
            </span>
        </button>
    );
};

export default DarkModeToggle;