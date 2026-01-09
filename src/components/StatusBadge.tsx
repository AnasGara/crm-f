import React from 'react';

type Status = 'to_be_treated' | 'qualified' | 'archived';

interface StatusBadgeProps {
  status: Status;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusStyles: { [key in Status]: { text: string; bg: string; dot: string } } = {
    'to_be_treated': {
      text: 'text-yellow-800',
      bg: 'bg-yellow-100',
      dot: 'bg-yellow-500',
    },
    'qualified': {
      text: 'text-green-800',
      bg: 'bg-green-100',
      dot: 'bg-green-500',
    },
    'archived': {
      text: 'text-gray-800',
      bg: 'bg-gray-100',
      dot: 'bg-gray-500',
    },
  };

  const { text, bg, dot } = statusStyles[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${text} ${bg}`}
    >
      <span className={`w-2 h-2 mr-1.5 rounded-full ${dot}`}></span>
      {status.replace('_', ' ')}
    </span>
  );
};

export default StatusBadge;
