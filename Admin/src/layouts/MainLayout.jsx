import React from 'react';
import Header from '../shared/components/Header';
import Sidebar from '../shared/components/Sidebar';

const MainLayout = ({ title = 'Dashboard', children }) => {
    return (
        <section className='main font-lato w-full h-full pr-11 bg-gray-50 dark:bg-black'>
            <Header title={title} />
            <div className='conterntMain flex'>
                <div className='sidebarWrapper w-65 fixed top-0 left-0 bg-white dark:bg-gray-950 dark:shadow-md shadow-md shadow-gray-300 dark:shadow-gray-700 overflow-y-auto h-screen'>
                    <Sidebar />
                </div>
                <div className='contentRight ml-auto h-full mt-1 w-[calc(100%-260px)]'>
                    {children}
                </div>
            </div>
        </section>
    );
};

export default MainLayout;
