import React from "react";
import {
  ClockIcon,
  CheckCircleIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";

type Status = "to_be_treated" | "qualified" | "archived";

interface StatusIconProps {
  status: Status;
}

const StatusIcon: React.FC<StatusIconProps> = ({ status }) => {
  const iconMap: Record<Status, React.ElementType> = {
    to_be_treated: ClockIcon,
    qualified: CheckCircleIcon,
    archived: ArchiveBoxIcon,
  };

  const Icon = iconMap[status];

  const colorMap: Record<Status, string> = {
    to_be_treated: "text-yellow-500",
    qualified: "text-green-500",
    archived: "text-gray-500",
  };

  const bgColorMap: Record<Status, string> = {
    to_be_treated: "bg-yellow-100",
    qualified: "bg-green-100",
    archived: "bg-gray-100",
  };

  return (
    <div
      className={`inline-flex items-center justify-center p-2 rounded-full ${
        bgColorMap[status]
      } ${colorMap[status]}`}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
};

export default StatusIcon;
