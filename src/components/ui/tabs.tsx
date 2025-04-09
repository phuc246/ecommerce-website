'use client';

import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

// Types
interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

// Context
const TabsContext = createContext<TabsContextType | null>(null);

// Hook
function useTabs() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a TabsProvider');
  }
  return context;
}

// Props interfaces
interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

interface TabsListProps {
  className?: string;
  children: React.ReactNode;
}

interface TabsTriggerProps {
  value: string;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

interface TabsContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

// Components
export function Tabs({ value, onValueChange, className, children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(value);
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    onValueChange(tab);
  };
  
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
      <div className={cn('w-full', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children }: TabsListProps) {
  return (
    <div 
      className={cn(
        'flex flex-wrap space-x-1 rounded-md bg-gray-100 p-1',
        className
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, className, disabled, children }: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabs();
  const isActive = activeTab === value;
  
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        'px-3 py-2 text-sm font-medium rounded-md transition-all',
        isActive 
          ? 'bg-white text-indigo-600 shadow' 
          : 'text-gray-600 hover:text-indigo-600',
        className
      )}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className, children }: TabsContentProps) {
  const { activeTab } = useTabs();
  
  if (activeTab !== value) {
    return null;
  }
  
  return (
    <div className={cn('mt-2', className)}>
      {children}
    </div>
  );
} 