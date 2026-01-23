"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Film, Car, Coffee } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

const mockExpenses = [
  { id: "1", description: "Grocery Shopping", amount: 120.50, category: "Food & Dining", icon: ShoppingCart },
  { id: "2", description: "Netflix Subscription", amount: 15.99, category: "Entertainment", icon: Film },
  { id: "3", description: "Uber Ride", amount: 25.00, category: "Transportation", icon: Car },
  { id: "4", description: "Coffee", amount: 4.50, category: "Food & Dining", icon: Coffee },
]

export function ExpensesPreview() {
  return (
    <div className="border rounded-lg bg-background">
      <div className="p-3 border-b">
        <h3 className="text-xs font-semibold">Recent Expenses</h3>
      </div>
      <div className="p-2">
        <Table>
          <TableHeader>
            <TableRow className="border-b">
              <TableHead className="h-7 px-2 text-[10px] font-medium">Description</TableHead>
              <TableHead className="h-7 px-2 text-[10px] font-medium">Category</TableHead>
              <TableHead className="h-7 px-2 text-right text-[10px] font-medium">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockExpenses.map((expense) => {
              const Icon = expense.icon
              return (
                <TableRow key={expense.id} className="border-b">
                  <TableCell className="px-2 py-1.5 text-xs font-medium">{expense.description}</TableCell>
                  <TableCell className="px-2 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs">{expense.category}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-1.5 text-right text-xs font-medium">
                    {formatCurrency(expense.amount, "USD")}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
