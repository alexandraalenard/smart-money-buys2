'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [rankings, setRankings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRankings()
  }, [])

  async function fetchRankings() {
    const { data } = await supabase
      .from('rankings')
      .select(`*, companies (ticker, name, sector)`)
      .order('score', { ascending: false })
      .limit(10)
    if (data) setRankings(data)
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#0a0f1e] text-white">
      <header className="border-b border-[#1e2a45] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#f0b429]">Smart Money Buys</h1>
            <p className="text-sm text-gray-400">Insider Confidence Rankings</p>
          </div>
          <div className="text-sm text-gray-400">Updated daily from SEC Form 4 filings</div>
        </div>
      </header>
      <section className="max-w-7xl mx-auto px-6 py-16 text-center">
        <h2 className="text-5xl font-bold mb-4">
          Rank stocks by <span className="text-[#f0b429]">unusual insider confidence</span> signals.
        </h2>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Smart Money Buys continuously monitors SEC Form 4 filings and ranks companies using an AI confidence score.
        </p>
      </section>
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <h3 className="text-2xl font-bold mb-6 text-[#f0b429]">Top Ranked Companies</h3>
        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading rankings...</div>
        ) : rankings.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p className="text-lg">No rankings yet.</p>
            <p className="text-sm mt-2">Data will appear once the SEC filing pipeline runs.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rankings.map((item, index) => (
              <div key={item.id} className="bg-[#111827] border border-[#1e2a45] rounded-xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <span className="text-3xl font-bold text-[#f0b429]">#{index + 1}</span>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold">{item.companies?.ticker}</span>
                      <span className="text-gray-400">{item.companies?.name}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{item.reason}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-[#f0b429]">{item.score}</div>
                  <div className="text-sm text-gray-400">Confidence Score</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}