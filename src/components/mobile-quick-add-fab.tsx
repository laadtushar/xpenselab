'use client';

import { useState, useMemo } from 'react';
import { Plus, ArrowLeftRight, Wallet, X, UserPlus, CreditCard, Calendar, Users, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExpenseForm } from '@/components/expenses/expense-form';
import { IncomeForm } from '@/components/income/income-form';
import { AddDebtDialog } from '@/components/debts/debt-form';
import { AddLoanDialog } from '@/components/loans/add-loan-form';
import { AddRecurringTransactionDialog } from '@/components/recurring/recurring-form';
import { CreateGroupDialog } from '@/components/splits/create-group-dialog';
import { CategoryDialog } from '@/components/categories/category-form';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePathname } from 'next/navigation';

type FABAction = {
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
};

export function MobileQuickAddFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const pathname = usePathname();

  // Only show on app routes
  const isAppRoute = pathname.startsWith('/dashboard') || 
                     pathname.startsWith('/income') || 
                     pathname.startsWith('/expenses') || 
                     pathname.startsWith('/budget') ||
                     pathname.startsWith('/categories') ||
                     pathname.startsWith('/splits') ||
                     pathname.startsWith('/debts') ||
                     pathname.startsWith('/loans') ||
                     pathname.startsWith('/recurring') ||
                     pathname.startsWith('/wellness') ||
                     pathname.startsWith('/forecast') ||
                     pathname.startsWith('/insights') ||
                     pathname.startsWith('/scan-receipt') ||
                     pathname.startsWith('/reports') ||
                     pathname.startsWith('/integrations') ||
                     pathname.startsWith('/settings');

  if (!isMobile || !isAppRoute) {
    return null;
  }

  // Determine which actions to show based on current page
  const actions = useMemo(() => {
    const actionList: FABAction[] = [];

    if (pathname === '/dashboard') {
      // Dashboard: Show both Income and Expense
      actionList.push(
        {
          label: 'Add Expense',
          icon: <ArrowLeftRight className="h-5 w-5" />,
          component: (
            <ExpenseForm
              key="expense"
              trigger={
                <Button
                  size="lg"
                  className={cn(
                    "h-12 px-4 rounded-full shadow-xl gap-2 transition-all duration-200",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    "border border-primary/20 backdrop-blur-sm",
                    "animate-in slide-in-from-bottom-2 fade-in-0 slide-in-from-right-2"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <ArrowLeftRight className="h-5 w-5" />
                  <span className="font-medium">Add Expense</span>
                </Button>
              }
            />
          ),
        },
        {
          label: 'Add Income',
          icon: <Wallet className="h-5 w-5" />,
          component: (
            <IncomeForm
              key="income"
              trigger={
                <Button
                  size="lg"
                  className={cn(
                    "h-12 px-4 rounded-full shadow-xl gap-2 transition-all duration-200",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    "border border-primary/20 backdrop-blur-sm",
                    "animate-in slide-in-from-bottom-2 fade-in-0 slide-in-from-right-2 delay-75"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <Wallet className="h-5 w-5" />
                  <span className="font-medium">Add Income</span>
                </Button>
              }
            />
          ),
        }
      );
    } else if (pathname.startsWith('/income')) {
      // Income page: Show only Add Income
      actionList.push({
        label: 'Add Income',
        icon: <Wallet className="h-5 w-5" />,
        component: (
          <IncomeForm
            key="income"
            trigger={
              <Button
                size="lg"
                className={cn(
                  "h-12 px-4 rounded-full shadow-xl gap-2 transition-all duration-200",
                  "bg-primary text-primary-foreground hover:bg-primary/90",
                  "border border-primary/20 backdrop-blur-sm",
                  "animate-in slide-in-from-bottom-2 fade-in-0 slide-in-from-right-2"
                )}
                onClick={() => setIsOpen(false)}
              >
                <Wallet className="h-5 w-5" />
                <span className="font-medium">Add Income</span>
              </Button>
            }
          />
        ),
      });
    } else if (pathname.startsWith('/expenses')) {
      // Expenses page: Show only Add Expense
      actionList.push({
        label: 'Add Expense',
        icon: <ArrowLeftRight className="h-5 w-5" />,
        component: (
          <ExpenseForm
            key="expense"
            trigger={
              <Button
                size="lg"
                className={cn(
                  "h-12 px-4 rounded-full shadow-xl gap-2 transition-all duration-200",
                  "bg-primary text-primary-foreground hover:bg-primary/90",
                  "border border-primary/20 backdrop-blur-sm",
                  "animate-in slide-in-from-bottom-2 fade-in-0 slide-in-from-right-2"
                )}
                onClick={() => setIsOpen(false)}
              >
                <ArrowLeftRight className="h-5 w-5" />
                <span className="font-medium">Add Expense</span>
              </Button>
            }
          />
        ),
      });
    } else if (pathname.startsWith('/debts')) {
      // Debts page: Show only Add Debt
      actionList.push({
        label: 'Add Debt',
        icon: <UserPlus className="h-5 w-5" />,
        component: (
          <AddDebtDialog
            key="debt"
            trigger={
              <Button
                size="lg"
                className={cn(
                  "h-12 px-4 rounded-full shadow-xl gap-2 transition-all duration-200",
                  "bg-primary text-primary-foreground hover:bg-primary/90",
                  "border border-primary/20 backdrop-blur-sm",
                  "animate-in slide-in-from-bottom-2 fade-in-0 slide-in-from-right-2"
                )}
                onClick={() => setIsOpen(false)}
              >
                <UserPlus className="h-5 w-5" />
                <span className="font-medium">Add Debt</span>
              </Button>
            }
          />
        ),
      });
    } else if (pathname.startsWith('/loans')) {
      // Loans page: Show only Add Loan
      actionList.push({
        label: 'Add Loan',
        icon: <CreditCard className="h-5 w-5" />,
        component: (
          <AddLoanDialog
            key="loan"
            trigger={
              <Button
                size="lg"
                className={cn(
                  "h-12 px-4 rounded-full shadow-xl gap-2 transition-all duration-200",
                  "bg-primary text-primary-foreground hover:bg-primary/90",
                  "border border-primary/20 backdrop-blur-sm",
                  "animate-in slide-in-from-bottom-2 fade-in-0 slide-in-from-right-2"
                )}
                onClick={() => setIsOpen(false)}
              >
                <CreditCard className="h-5 w-5" />
                <span className="font-medium">Add Loan</span>
              </Button>
            }
          />
        ),
      });
    } else if (pathname.startsWith('/recurring')) {
      // Recurring page: Show only Add Recurring Transaction
      actionList.push({
        label: 'Add Recurring',
        icon: <Calendar className="h-5 w-5" />,
        component: (
          <AddRecurringTransactionDialog
            key="recurring"
            trigger={
              <Button
                size="lg"
                className={cn(
                  "h-12 px-4 rounded-full shadow-xl gap-2 transition-all duration-200",
                  "bg-primary text-primary-foreground hover:bg-primary/90",
                  "border border-primary/20 backdrop-blur-sm",
                  "animate-in slide-in-from-bottom-2 fade-in-0 slide-in-from-right-2"
                )}
                onClick={() => setIsOpen(false)}
              >
                <Calendar className="h-5 w-5" />
                <span className="font-medium">Add Recurring</span>
              </Button>
            }
          />
        ),
      });
    } else if (pathname.startsWith('/splits')) {
      // Splits page: Show only Create Group
      actionList.push({
        label: 'Create Group',
        icon: <Users className="h-5 w-5" />,
        component: (
          <CreateGroupDialog
            key="group"
            trigger={
              <Button
                size="lg"
                className={cn(
                  "h-12 px-4 rounded-full shadow-xl gap-2 transition-all duration-200",
                  "bg-primary text-primary-foreground hover:bg-primary/90",
                  "border border-primary/20 backdrop-blur-sm",
                  "animate-in slide-in-from-bottom-2 fade-in-0 slide-in-from-right-2"
                )}
                onClick={() => setIsOpen(false)}
              >
                <Users className="h-5 w-5" />
                <span className="font-medium">Create Group</span>
              </Button>
            }
          />
        ),
      });
    } else if (pathname.startsWith('/categories')) {
      // Categories page: Show both Income and Expense Category options
      actionList.push(
        {
          label: 'Add Income Category',
          icon: <Tag className="h-5 w-5" />,
          component: (
            <CategoryDialog
              key="income-category"
              type="income"
            >
              <Button
                size="lg"
                className={cn(
                  "h-12 px-4 rounded-full shadow-xl gap-2 transition-all duration-200",
                  "bg-primary text-primary-foreground hover:bg-primary/90",
                  "border border-primary/20 backdrop-blur-sm",
                  "animate-in slide-in-from-bottom-2 fade-in-0 slide-in-from-right-2"
                )}
                onClick={() => setIsOpen(false)}
              >
                <Tag className="h-5 w-5" />
                <span className="font-medium">Add Income Category</span>
              </Button>
            </CategoryDialog>
          ),
        },
        {
          label: 'Add Expense Category',
          icon: <Tag className="h-5 w-5" />,
          component: (
            <CategoryDialog
              key="expense-category"
              type="expense"
            >
              <Button
                size="lg"
                className={cn(
                  "h-12 px-4 rounded-full shadow-xl gap-2 transition-all duration-200",
                  "bg-primary text-primary-foreground hover:bg-primary/90",
                  "border border-primary/20 backdrop-blur-sm",
                  "animate-in slide-in-from-bottom-2 fade-in-0 slide-in-from-right-2 delay-75"
                )}
                onClick={() => setIsOpen(false)}
              >
                <Tag className="h-5 w-5" />
                <span className="font-medium">Add Expense Category</span>
              </Button>
            </CategoryDialog>
          ),
        }
      );
    } else {
      // Other pages (budget, categories, reports, etc.): Show both Income and Expense as default
      actionList.push(
        {
          label: 'Add Expense',
          icon: <ArrowLeftRight className="h-5 w-5" />,
          component: (
            <ExpenseForm
              key="expense"
              trigger={
                <Button
                  size="lg"
                  className={cn(
                    "h-12 px-4 rounded-full shadow-xl gap-2 transition-all duration-200",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    "border border-primary/20 backdrop-blur-sm",
                    "animate-in slide-in-from-bottom-2 fade-in-0 slide-in-from-right-2"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <ArrowLeftRight className="h-5 w-5" />
                  <span className="font-medium">Add Expense</span>
                </Button>
              }
            />
          ),
        },
        {
          label: 'Add Income',
          icon: <Wallet className="h-5 w-5" />,
          component: (
            <IncomeForm
              key="income"
              trigger={
                <Button
                  size="lg"
                  className={cn(
                    "h-12 px-4 rounded-full shadow-xl gap-2 transition-all duration-200",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    "border border-primary/20 backdrop-blur-sm",
                    "animate-in slide-in-from-bottom-2 fade-in-0 slide-in-from-right-2 delay-75"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <Wallet className="h-5 w-5" />
                  <span className="font-medium">Add Income</span>
                </Button>
              }
            />
          ),
        }
      );
    }

    return actionList;
  }, [pathname]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[55] md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Speed Dial Container - Positioned on right side like traditional FAB */}
      <div className="fixed bottom-20 right-2 z-[60] md:hidden">
        {/* Action Buttons - Aligned to right, dynamically shown based on page */}
        {actions.length > 0 && (
          <div
            className={cn(
              "flex flex-col-reverse items-end gap-3 mb-3 transition-all duration-300 ease-out",
              isOpen
                ? "opacity-100 translate-y-0 translate-x-0 pointer-events-auto"
                : "opacity-0 translate-y-4 translate-x-4 pointer-events-none"
            )}
          >
            {actions.map((action, index) => (
              <div
                key={action.label}
                className={cn(
                  "animate-in slide-in-from-bottom-2 fade-in-0 slide-in-from-right-2",
                  index === 1 && "delay-75",
                  index === 2 && "delay-150"
                )}
              >
                {action.component}
              </div>
            ))}
          </div>
        )}

        {/* Main FAB Button - Right side floating */}
        <Button
          size="icon"
          className={cn(
            "h-14 w-14 rounded-full shadow-xl transition-all duration-300",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            "border border-primary/20 backdrop-blur-sm",
            "hover:scale-105 active:scale-95",
            isOpen && "rotate-45 bg-destructive hover:bg-destructive/90 border-destructive/20"
          )}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close quick add menu" : "Open quick add menu"}
        >
          {isOpen ? (
            <X className="h-6 w-6 transition-transform duration-300" />
          ) : (
            <Plus className="h-6 w-6 transition-transform duration-300" />
          )}
        </Button>
      </div>
    </>
  );
}
