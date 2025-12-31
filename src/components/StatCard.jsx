import React from 'react';
import clsx from 'clsx';

const StatCard = ({ label, value, icon: Icon, color }) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={clsx("w-12 h-12 rounded-lg flex items-center justify-center", color)}>
                <Icon size={24} className="text-white" />
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            </div>
        </div>
    );
};

export default StatCard;
