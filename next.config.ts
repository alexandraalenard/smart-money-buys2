import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async redirects() {
          return [
                  // Legacy URL redirects -> The Hidden Ledger branded URLs
            { source: '/smart-money-buys', destination: '/the-hidden-ledger', permanent: true },
            { source: '/home', destination: '/the-hidden-ledger', permanent: false },
                ]
    },
    async rewrites() {
          return [
                  // /the-hidden-ledger maps to homepage
            { source: '/the-hidden-ledger', destination: '/' },
            { source: '/the-hidden-ledger/billionaires-corner', destination: '/billionaires-corner' },
            { source: '/the-hidden-ledger/buyers-corner', destination: '/buyers-corner' },
            { source: '/the-hidden-ledger/sell-alerts', destination: '/sell-alerts' },
            { source: '/the-hidden-ledger/market-pulse', destination: '/market-pulse' },
            { source: '/the-hidden-ledger/stock-screener', destination: '/stock-screener' },
            { source: '/the-hidden-ledger/congress', destination: '/congress' },
            { source: '/the-hidden-ledger/institutions', destination: '/institutions' },
            { source: '/the-hidden-ledger/pricing', destination: '/pricing' },
            { source: '/the-hidden-ledger/company/:ticker', destination: '/company/:ticker' },
                ]
    },
};

export default nextConfig;
