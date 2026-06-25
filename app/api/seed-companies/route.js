import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const TOP_100_COMPANIES = [
  { ticker: 'AAPL', name: 'Apple Inc', sector: 'Technology' },
  { ticker: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
  { ticker: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' },
  { ticker: 'GOOGL', name: 'Alphabet Inc', sector: 'Technology' },
  { ticker: 'AMZN', name: 'Amazon.com Inc', sector: 'Consumer Discretionary' },
  { ticker: 'META', name: 'Meta Platforms Inc', sector: 'Technology' },
  { ticker: 'LLY', name: 'Eli Lilly and Company', sector: 'Healthcare' },
  { ticker: 'TSLA', name: 'Tesla Inc', sector: 'Consumer Discretionary' },
  { ticker: 'V', name: 'Visa Inc', sector: 'Financials' },
  { ticker: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare' },
  { ticker: 'XOM', name: 'Exxon Mobil Corporation', sector: 'Energy' },
  { ticker: 'JPM', name: 'JPMorgan Chase & Co', sector: 'Financials' },
  { ticker: 'MA', name: 'Mastercard Inc', sector: 'Financials' },
  { ticker: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
  { ticker: 'PG', name: 'Procter & Gamble Co', sector: 'Consumer Staples' },
  { ticker: 'HD', name: 'The Home Depot Inc', sector: 'Consumer Discretionary' },
  { ticker: 'AVGO', name: 'Broadcom Inc', sector: 'Technology' },
  { ticker: 'MRK', name: 'Merck & Co Inc', sector: 'Healthcare' },
  { ticker: 'COST', name: 'Costco Wholesale Corporation', sector: 'Consumer Staples' },
  { ticker: 'ABBV', name: 'AbbVie Inc', sector: 'Healthcare' },
  { ticker: 'CVX', name: 'Chevron Corporation', sector: 'Energy' },
  { ticker: 'CRM', name: 'Salesforce Inc', sector: 'Technology' },
  { ticker: 'MCD', name: "McDonald's Corporation", sector: 'Consumer Discretionary' },
  { ticker: 'NFLX', name: 'Netflix Inc', sector: 'Communication Services' },
  { ticker: 'AMD', name: 'Advanced Micro Devices', sector: 'Technology' },
  { ticker: 'PEP', name: 'PepsiCo Inc', sector: 'Consumer Staples' },
  { ticker: 'TMO', name: 'Thermo Fisher Scientific', sector: 'Healthcare' },
  { ticker: 'ACN', name: 'Accenture plc', sector: 'Technology' },
  { ticker: 'LIN', name: 'Linde plc', sector: 'Materials' },
  { ticker: 'ADBE', name: 'Adobe Inc', sector: 'Technology' },
  { ticker: 'CSCO', name: 'Cisco Systems Inc', sector: 'Technology' },
  { ticker: 'WMT', name: 'Walmart Inc', sector: 'Consumer Staples' },
  { ticker: 'BAC', name: 'Bank of America Corp', sector: 'Financials' },
  { ticker: 'TXN', name: 'Texas Instruments Inc', sector: 'Technology' },
  { ticker: 'MS', name: 'Morgan Stanley', sector: 'Financials' },
  { ticker: 'ORCL', name: 'Oracle Corporation', sector: 'Technology' },
  { ticker: 'ABT', name: 'Abbott Laboratories', sector: 'Healthcare' },
  { ticker: 'DHR', name: 'Danaher Corporation', sector: 'Healthcare' },
  { ticker: 'NKE', name: 'Nike Inc', sector: 'Consumer Discretionary' },
  { ticker: 'NEE', name: 'NextEra Energy Inc', sector: 'Utilities' },
  { ticker: 'PM', name: 'Philip Morris International', sector: 'Consumer Staples' },
  { ticker: 'RTX', name: 'RTX Corporation', sector: 'Industrials' },
  { ticker: 'SPGI', name: 'S&P Global Inc', sector: 'Financials' },
  { ticker: 'HON', name: 'Honeywell International', sector: 'Industrials' },
  { ticker: 'UPS', name: 'United Parcel Service', sector: 'Industrials' },
  { ticker: 'AMGN', name: 'Amgen Inc', sector: 'Healthcare' },
  { ticker: 'IBM', name: 'IBM Corporation', sector: 'Technology' },
  { ticker: 'GE', name: 'GE Aerospace', sector: 'Industrials' },
  { ticker: 'CAT', name: 'Caterpillar Inc', sector: 'Industrials' },
  { ticker: 'INTU', name: 'Intuit Inc', sector: 'Technology' },
  { ticker: 'GS', name: 'Goldman Sachs Group', sector: 'Financials' },
  { ticker: 'QCOM', name: 'Qualcomm Inc', sector: 'Technology' },
  { ticker: 'LOW', name: "Lowe's Companies Inc", sector: 'Consumer Discretionary' },
  { ticker: 'BLK', name: 'BlackRock Inc', sector: 'Financials' },
  { ticker: 'SYK', name: 'Stryker Corporation', sector: 'Healthcare' },
  { ticker: 'T', name: 'AT&T Inc', sector: 'Communication Services' },
  { ticker: 'AXP', name: 'American Express Co', sector: 'Financials' },
  { ticker: 'ISRG', name: 'Intuitive Surgical Inc', sector: 'Healthcare' },
  { ticker: 'MDT', name: 'Medtronic plc', sector: 'Healthcare' },
  { ticker: 'GILD', name: 'Gilead Sciences Inc', sector: 'Healthcare' },
  { ticker: 'PLD', name: 'Prologis Inc', sector: 'Real Estate' },
  { ticker: 'TJX', name: 'TJX Companies Inc', sector: 'Consumer Discretionary' },
  { ticker: 'MMC', name: 'Marsh & McLennan Companies', sector: 'Financials' },
  { ticker: 'CB', name: 'Chubb Limited', sector: 'Financials' },
  { ticker: 'SO', name: 'Southern Company', sector: 'Utilities' },
  { ticker: 'DUK', name: 'Duke Energy Corporation', sector: 'Utilities' },
  { ticker: 'BMY', name: 'Bristol-Myers Squibb Co', sector: 'Healthcare' },
  { ticker: 'C', name: 'Citigroup Inc', sector: 'Financials' },
  { ticker: 'CME', name: 'CME Group Inc', sector: 'Financials' },
  { ticker: 'SCHW', name: 'Charles Schwab Corporation', sector: 'Financials' },
  { ticker: 'ZTS', name: 'Zoetis Inc', sector: 'Healthcare' },
  { ticker: 'MMM', name: '3M Company', sector: 'Industrials' },
  { ticker: 'ETN', name: 'Eaton Corporation', sector: 'Industrials' },
  { ticker: 'BSX', name: 'Boston Scientific Corp', sector: 'Healthcare' },
  { ticker: 'MO', name: 'Altria Group Inc', sector: 'Consumer Staples' },
  { ticker: 'ADP', name: 'Automatic Data Processing', sector: 'Technology' },
  { ticker: 'WFC', name: 'Wells Fargo & Company', sector: 'Financials' },
  { ticker: 'UBER', name: 'Uber Technologies Inc', sector: 'Technology' },
  { ticker: 'DE', name: 'Deere & Company', sector: 'Industrials' },
  { ticker: 'REGN', name: 'Regeneron Pharmaceuticals', sector: 'Healthcare' },
  { ticker: 'ELV', name: 'Elevance Health Inc', sector: 'Healthcare' },
  { ticker: 'AON', name: 'Aon plc', sector: 'Financials' },
  { ticker: 'CI', name: 'The Cigna Group', sector: 'Healthcare' },
  { ticker: 'PGR', name: 'Progressive Corporation', sector: 'Financials' },
  { ticker: 'MU', name: 'Micron Technology Inc', sector: 'Technology' },
  { ticker: 'PANW', name: 'Palo Alto Networks', sector: 'Technology' },
  { ticker: 'SLB', name: 'SLB (Schlumberger)', sector: 'Energy' },
  { ticker: 'ITW', name: 'Illinois Tool Works', sector: 'Industrials' },
  { ticker: 'VRTX', name: 'Vertex Pharmaceuticals', sector: 'Healthcare' },
  { ticker: 'LRCX', name: 'Lam Research Corporation', sector: 'Technology' },
  { ticker: 'AMAT', name: 'Applied Materials Inc', sector: 'Technology' },
  { ticker: 'MCO', name: "Moody's Corporation", sector: 'Financials' },
  { ticker: 'HCA', name: 'HCA Healthcare Inc', sector: 'Healthcare' },
  { ticker: 'F', name: 'Ford Motor Company', sector: 'Consumer Discretionary' },
  { ticker: 'GM', name: 'General Motors Company', sector: 'Consumer Discretionary' },
  { ticker: 'TGT', name: 'Target Corporation', sector: 'Consumer Discretionary' },
  { ticker: 'INTC', name: 'Intel Corporation', sector: 'Technology' },
  { ticker: 'COP', name: 'ConocoPhillips', sector: 'Energy' },
]

export async function GET() {
  try {
    const { data: existing } = await supabase.from('companies').select('ticker')
    const existingTickers = new Set((existing || []).map(c => c.ticker))
    const toInsert = TOP_100_COMPANIES.filter(c => !existingTickers.has(c.ticker))

    if (toInsert.length === 0) {
      return NextResponse.json({ success: true, message: 'All companies already exist', count: 0 })
    }

    const { error } = await supabase.from('companies').insert(toInsert)
    if (error) throw error

    return NextResponse.json({ success: true, message: `Seeded ${toInsert.length} companies`, count: toInsert.length })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}