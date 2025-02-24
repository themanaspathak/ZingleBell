import { Bell } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Bell className="h-5 w-5 text-primary" />
        <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-3 h-0.5 bg-primary/20 rounded-full blur-sm" />
      </div>
      <div className="flex items-center font-semibold text-lg">
        <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          Zingle
        </span>
        <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
          Bell
        </span>
      </div>
    </div>
  );
}