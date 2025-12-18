import React from 'react';
import ProfileCard from '@/components/dashboard/ProfileCard';
import BenefitsCard from '@/components/profile/BenefitsCard';
import CompletionChart from '@/components/profile/CompletionChart';
import TasksList from '@/components/profile/TasksList';
import MyTherapists from '@/components/profile/MyTherapists';

export default function ProfilePage() {
  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
                <ProfileCard />
            </div>
            <div className="lg:col-span-2">
                <BenefitsCard />
            </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
                <CompletionChart />
            </div>
            <div className="lg:col-span-2">
                <TasksList />
            </div>
        </div>
        <div>
            <MyTherapists />
        </div>
    </div>
  );
}