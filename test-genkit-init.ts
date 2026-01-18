
import { ai } from './src/ai/genkit';
import { checkFinancialWellness } from './src/ai/flows/financial-wellness';

async function main() {
    console.log('Successfully imported ai instance:', ai);

    const dummyInput = {
        financialSummary: "Total Income: 5000\nTotal Expenses: 3000\nSavings Rate: 40%\nMonthly Budget: 4000"
    };

    console.log('Invoking flow with input:', dummyInput);
    try {
        const result = await checkFinancialWellness(dummyInput);
        console.log('Flow execution successful. Result:', result);
    } catch (error) {
        console.error('Flow execution failed:', error);
        process.exit(1);
    }

    console.log('Genkit initialization and execution check passed.');
}

main().catch(console.error);
