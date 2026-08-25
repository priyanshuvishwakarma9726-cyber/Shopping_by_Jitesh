'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  bordered?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  bordered = true,
  className,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-white rounded-2xl p-6 transition-all duration-300',
          bordered && 'border border-stone-200/80',
          hoverable && 'hover:shadow-xl hover:-translate-y-1 hover:border-stone-300 cursor-pointer',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
