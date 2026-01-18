"use client"

import * as React from "react"
import { CalendarIcon, Check, ChevronsUpDown, X } from "lucide-react"
import { format } from "date-fns"
import { type DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Category } from "@/lib/types"

interface DashboardFiltersProps {
    dateRange: DateRange | undefined
    setDateRange: (range: DateRange | undefined) => void
    categories: Category[]
    selectedCategories: string[]
    setSelectedCategories: (categories: string[]) => void
    searchQuery: string
    setSearchQuery: (query: string) => void
}

export function DashboardFilters({
    dateRange,
    setDateRange,
    categories,
    selectedCategories,
    setSelectedCategories,
    searchQuery,
    setSearchQuery,
}: DashboardFiltersProps) {
    const [openCategory, setOpenCategory] = React.useState(false)

    // Helper to get category name
    const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || id;

    const toggleCategory = (categoryId: string) => {
        if (selectedCategories.includes(categoryId)) {
            setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
        } else {
            setSelectedCategories([...selectedCategories, categoryId]);
        }
    }

    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-1 bg-background/50 backdrop-blur rounded-lg">
            <div className="flex flex-1 items-center gap-2 overflow-x-auto pb-2 md:pb-0">

                {/* Date Range Picker */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                                "w-[260px] justify-start text-left font-normal",
                                !dateRange && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                                dateRange.to ? (
                                    <>
                                        {format(dateRange.from, "LLL dd, y")} -{" "}
                                        {format(dateRange.to, "LLL dd, y")}
                                    </>
                                ) : (
                                    format(dateRange.from, "LLL dd, y")
                                )
                            ) : (
                                <span>Pick a date range</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                        />
                    </PopoverContent>
                </Popover>

                {/* Category Multi-Select */}
                <Popover open={openCategory} onOpenChange={setOpenCategory}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openCategory}
                            className="w-[200px] justify-between"
                        >
                            {selectedCategories.length > 0
                                ? `${selectedCategories.length} selected`
                                : "Filter Category..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                        <Command>
                            <CommandInput placeholder="Search category..." />
                            <CommandList>
                                <CommandEmpty>No category found.</CommandEmpty>
                                <CommandGroup>
                                    {categories.map((category) => (
                                        <CommandItem
                                            key={category.id}
                                            value={category.name}
                                            onSelect={() => toggleCategory(category.id)}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedCategories.includes(category.id) ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {category.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                {/* Search Input */}
                <div className="relative w-full md:w-[250px]">
                    <Input
                        placeholder="Search description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                    />
                    {searchQuery && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
                            onClick={() => setSearchQuery('')}
                        >
                            <X className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Active Filters Display */}
            {(selectedCategories.length > 0) && (
                <div className="hidden md:flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedCategories([])}>
                        Reset
                    </Button>
                </div>
            )}

        </div>
    )
}
