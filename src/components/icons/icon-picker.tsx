"use client";

import { allIcons } from "./all-icons";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "./category-icon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";

type IconPickerProps = {
  selectedIcon: string;
  onSelect: (iconName: string) => void;
};

export function IconPicker({ selectedIcon, onSelect }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (iconName: string) => {
    onSelect(iconName);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2">
          <CategoryIcon iconName={selectedIcon} className="h-5 w-5" />
          {selectedIcon}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <ScrollArea className="h-72">
          <div className="grid grid-cols-5 gap-1 p-2">
            {Object.keys(allIcons).map((iconName) => (
              <Button
                key={iconName}
                variant="ghost"
                size="icon"
                onClick={() => handleSelect(iconName)}
                className={cn(
                  "rounded-sm",
                  selectedIcon === iconName && "bg-primary text-primary-foreground"
                )}
              >
                <CategoryIcon iconName={iconName} className="h-5 w-5" />
              </Button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
