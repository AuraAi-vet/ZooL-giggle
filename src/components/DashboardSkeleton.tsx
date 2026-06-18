import React from 'react';

export function WidgetSkeleton({ height = 'h-48', className = '' }: { height?: string, className?: string }) {
  return (
    <div className={`bg-white rounded-3xl shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] border border-slate-200/60 p-6 flex flex-col relative overflow-hidden ${className}`}>
      {/* Skeleton Content */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-slate-100 rounded-2xl animate-pulse"></div>
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-slate-100 rounded-full w-1/3 animate-pulse"></div>
          <div className="h-4 bg-slate-100 rounded-full w-1/4 animate-pulse"></div>
        </div>
      </div>
      
      <div className={`flex-1 w-full bg-slate-100 rounded-2xl animate-pulse ${height}`}></div>
    </div>
  );
}

export function PetOwnerDashboardSkeleton() {
  return (
    <div className="p-6 md:p-8 min-h-screen bg-[#F8FAFC]">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div className="space-y-3">
          <div className="h-10 bg-slate-200 rounded-xl w-64 animate-pulse"></div>
          <div className="h-5 bg-slate-200 rounded-xl w-48 animate-pulse mb-8"></div>
        </div>
        <div className="flex gap-3">
          <div className="w-32 h-12 bg-slate-200 rounded-xl animate-pulse"></div>
          <div className="w-12 h-12 bg-slate-200 rounded-xl animate-pulse"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-8 flex flex-col gap-6 md:gap-8">
          <WidgetSkeleton height="h-16" />
          <WidgetSkeleton height="h-24" />
          <WidgetSkeleton height="h-48" />
          <WidgetSkeleton height="h-64" />
        </div>
        <div className="lg:col-span-4 flex flex-col gap-6 md:gap-8">
           <WidgetSkeleton height="h-32" />
           <WidgetSkeleton height="h-96" />
        </div>
      </div>
    </div>
  );
}

export function ClinicianDashboardSkeleton() {
  return (
    <div className="p-6 md:p-8 min-h-screen bg-[#F8FAFC]">
      <div className="h-10 bg-slate-200 rounded-xl mb-6 w-full max-w-sm animate-pulse"></div>
      <div className="h-5 bg-slate-200 rounded-xl mb-10 w-full max-w-xs animate-pulse"></div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[80vh]">
        <div className="lg:col-span-3">
           <WidgetSkeleton height="h-full min-h-[500px]" className="h-full" />
        </div>
        <div className="lg:col-span-9 flex flex-col gap-6">
          <WidgetSkeleton height="h-32" />
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
            <WidgetSkeleton height="h-full" className="h-full" />
            <WidgetSkeleton height="h-full" className="h-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="p-6 md:p-8 min-h-screen bg-[#F8FAFC]">
      <div className="h-10 bg-slate-200 rounded-xl mb-6 w-64 animate-pulse"></div>
      <div className="h-5 bg-slate-200 rounded-xl mb-10 w-48 animate-pulse"></div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-6">
           <WidgetSkeleton height="h-20" />
           <WidgetSkeleton height="h-20" />
           <WidgetSkeleton height="h-20" />
           <WidgetSkeleton height="h-20" />
        </div>
        <div className="lg:col-span-8 flex flex-col gap-6">
          <WidgetSkeleton height="h-[400px]" />
          <WidgetSkeleton height="h-[300px]" />
        </div>
        <div className="lg:col-span-4 flex flex-col gap-6">
          <WidgetSkeleton height="h-[300px]" />
          <WidgetSkeleton height="h-[400px]" />
        </div>
      </div>
    </div>
  );
}

export function ServiceProviderDashboardSkeleton() {
  return (
    <div className="p-6 md:p-8 min-h-screen bg-[#F8FAFC]">
      <div className="h-10 bg-slate-200 rounded-xl mb-6 w-full max-w-sm animate-pulse"></div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[80vh]">
         <div className="lg:col-span-12">
            <WidgetSkeleton height="h-full min-h-[600px]" className="h-full" />
         </div>
      </div>
    </div>
  );
}

export function SettingsViewSkeleton() {
  return (
    <div className="p-6 md:p-8 min-h-screen bg-[#F8FAFC]">
      <div className="h-10 bg-slate-200 rounded-xl mb-8 w-48 animate-pulse"></div>
      <div className="max-w-4xl space-y-6">
        <WidgetSkeleton height="h-32" />
        <WidgetSkeleton height="h-64" />
        <WidgetSkeleton height="h-64" />
      </div>
    </div>
  );
}


