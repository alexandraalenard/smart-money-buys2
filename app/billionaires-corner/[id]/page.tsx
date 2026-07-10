'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'
import {
  nameMatches,
  aggregateHoldings,
  sortTxNewestFirst,
  txValue,
  txSide,
  fmtMoney,
  fmtNetWorth,
  fmtDate,
  categoryLabel,
  type BillTx,
  type Holding,
  type Side,
} from '../billionaires'

interface Profile {
  id: string
  name: string
  category: string | null
  country: string | null
  net_worth_usd: number | null
  firm: string | null
  rank: number | null
  bio: string | null
  updated_at: string | null
}

interface Insider {
  id: string
  name: string
  company_id: string | null
}

// Brand palette only — no new colors.
const DK = '#07130E', LT = '#F7F4EF', G = '#C9A84C', GN = '#2D6A4F', DG = '#1B4332'
const MD = '#DFC48B', CARD = '#0D1F16', MUTED = '#B9C4BC', DIM = '#7E8C83'

function scoreColor(s: number) {
  if (s >= 70) return G
  if (s >= 50) return MD
  return DIM
}

// The palette has no red: buys/positive in gold, sells/neutral in muted gray.
function sideColor(side: Side) {
  return side === 'BUY' ? G : DIM
}

export default function BillionaireDetailPage() {
  const params = useParams()
  const id = params?.id as string

  const [profile, setProfile] = useState<Profile | null>(null)
  const [txs, setTxs] = useState<BillTx[]>([])
  const [nowMs, setNowMs] = useState(0)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      try {
        setNowMs(Date.now())
        const { data: prof } = await supabase
          .from('billionaire_profiles')
          .select('id, name, category, country, net_worth_usd, firm, rank, bio, updated_at')
          .eq('id', id)
          .maybeSingle()
        if (cancelled) return
        if (!prof) { setNotFound(true); return }
        setProfile(prof as Profile)

        const { data: insiders } = await supabase.from('insiders').select('id, name, company_id')
        if (cancelled) return
        const matchedIds = ((insiders || []) as Insider[]).filter(i => nameMatches(prof.name, i.name)).map(i => i.id)

        if (matchedIds.length) {
          const { data: txData } = await supabase
            .from('insider_transactions')
            .select('id, insider_id, company_id, transaction_date, transaction_code, transaction_type, trade_type, shares, price_per_share, total_value, shares_owned_following, insider_name, insider_title, form4_url, companies(ticker, name, sector)')
            .in('insider_id', matchedIds)
            .order('transaction_date', { ascending: false })
          if (cancelled) return
          setTxs((txData || []) as unknown as BillTx[])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [id])

  const holdings = useMemo(() => aggregateHoldings(txs, nowMs || 0), [txs, nowMs])
  const recentTxs = useMemo(() => sortTxNewestFirst(txs), [txs])

  function shell(children: React.ReactNode) {
    return (
      <main style={{ background: DK, minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: LT }}>
        <nav style={{ background: DG, borderBottom: `1px solid ${GN}`, padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', background: GN, border: `1px solid ${G}`, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>📒</div>
            <div><span style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '0.08em', textTransform: 'uppercase', color: LT }}>THE </span><span style={{ fontStyle: 'italic', fontSize: '14px', color: G }}>HIDDEN </span><span style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '0.08em', textTransform: 'uppercase', color: LT }}>LEDGER</span></div>
          </Link>
          <Link href="/billionaires-corner" style={{ fontSize: '13px', color: MD, textTransform: 'uppercase', textDecoration: 'none' }}>← Billionaires</Link>
        </nav>
        {children}
      </main>
    )
  }

  if (loading) {
    return shell(<div style={{ textAlign: 'center', padding: '80px', color: G, fontStyle: 'italic', fontFamily: 'Georgia, serif', fontSize: '20px' }}>Retrieving filing data…</div>)
  }

  if (notFound || !profile) {
    return shell(
      <div style={{ textAlign: 'center', padding: '80px 32px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
        <div style={{ fontSize: '22px', fontFamily: 'Georgia, serif' }}>Profile not found</div>
        <Link href="/billionaires-corner" style={{ color: G }}>← Back to Billionaires Corner</Link>
      </div>
    )
  }

  return shell(
    <>
      {/* Profile header */}
      <section style={{ background: 'linear-gradient(180deg,#1B4332 0%,#07130E 100%)', padding: '40px 32px 28px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '34px', fontWeight: 700, color: LT, margin: 0 }}>{profile.name}</h1>
            <span style={{ border: `1px solid ${GN}`, color: G, borderRadius: '100px', padding: '3px 12px', fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{categoryLabel(profile.category)}</span>
          </div>
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', marginTop: '16px' }}>
            <div>
              <div style={{ fontSize: '10px', color: DIM, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Net Worth</div>
              <div style={{ color: profile.net_worth_usd ? G : DIM, fontSize: '16px', fontWeight: 700 }}>{fmtNetWorth(profile.net_worth_usd)}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: DIM, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Source of Wealth</div>
              <div style={{ color: profile.firm ? LT : DIM, fontSize: '16px' }}>{profile.firm || 'Not available'}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: DIM, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Country</div>
              <div style={{ color: profile.country ? LT : DIM, fontSize: '16px' }}>{profile.country || 'Not available'}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: DIM, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Last Updated</div>
              <div style={{ color: MUTED, fontSize: '16px' }}>{profile.updated_at ? fmtDate(profile.updated_at) : '—'}</div>
            </div>
          </div>
          {profile.bio ? <p style={{ color: MD, fontSize: '14px', lineHeight: 1.7, marginTop: '18px', maxWidth: '760px' }}>{profile.bio}</p> : null}
        </div>
      </section>

      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 32px 80px' }}>
        {txs.length === 0 ? (
          <div style={{ background: CARD, border: `1px solid ${GN}`, borderRadius: '12px', padding: '40px 28px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: '20px', color: LT, marginBottom: '10px' }}>No verified filings found yet</div>
            <p style={{ color: MUTED, fontSize: '14px', lineHeight: 1.6, maxWidth: '560px', margin: '0 auto' }}>
              We could not match any SEC Form 4 filings to this person by filer name. 13F and Schedule 13D/13G coverage is not yet ingested — once it is, verified holdings will appear here. Nothing is shown unless it comes from a real filing.
            </p>
          </div>
        ) : (
          <>
            {/* Verified holdings */}
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '24px', color: LT, margin: '0 0 6px' }}>Verified Holdings</h2>
            <p style={{ color: DIM, fontSize: '12px', margin: '0 0 18px' }}>
              SEC Form 4 filings matched to this person by filer name. Confidence score (0–100) reflects filing verification, recency, open-market activity, relative size, and clustering.
            </p>
            <div style={{ display: 'grid', gap: '12px', marginBottom: '40px' }}>
              {holdings.map((h: Holding) => (
                <div key={h.companyId} style={{ background: CARD, border: `1px solid ${GN}`, borderRadius: '10px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '18px', color: LT }}>{h.ticker}</span>
                        <span style={{ color: MUTED, fontSize: '14px' }}>{h.name}{h.sector ? ' · ' + h.sector : ''}</span>
                      </div>
                      <div style={{ color: MD, fontSize: '13px', marginTop: '4px' }}>Total filed value: <strong style={{ color: G }}>{fmtMoney(h.totalValue)}</strong> · Latest {fmtDate(h.txs[0]?.transaction_date)}</div>
                      <div style={{ color: DIM, fontSize: '11px', marginTop: '6px' }}>{h.reasons.join(' · ')}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'Georgia, serif', fontSize: '30px', fontWeight: 800, color: scoreColor(h.confidence), lineHeight: 1 }}>{h.confidence}<span style={{ fontSize: '14px', color: DIM }}>/100</span></div>
                      <div style={{ fontSize: '10px', color: DIM, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Confidence</div>
                    </div>
                  </div>

                  {/* Underlying filings, newest first */}
                  <div style={{ marginTop: '14px', borderTop: `1px solid ${GN}`, paddingTop: '12px', display: 'grid', gap: '8px' }}>
                    {h.txs.map(t => {
                      const side = txSide(t)
                      return (
                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '13px' }}>
                          <span style={{ border: `1px solid ${sideColor(side)}`, color: sideColor(side), borderRadius: '4px', padding: '1px 8px', fontSize: '11px', fontWeight: 700, minWidth: '64px', textAlign: 'center' }}>{side}</span>
                          <span style={{ color: MUTED, minWidth: '120px' }}>{fmtDate(t.transaction_date)}</span>
                          <span style={{ color: LT, fontFamily: 'monospace' }}>{fmtMoney(txValue(t))}</span>
                          <span style={{ color: DIM, flex: 1 }}>{t.insider_name || ''}{t.insider_title ? ' · ' + t.insider_title : ''}</span>
                          {t.form4_url ? <a href={t.form4_url} target="_blank" rel="noopener noreferrer" style={{ color: G, fontSize: '12px', textDecoration: 'none' }}>Form 4 ↗</a> : <span style={{ color: '#5E6E64', fontSize: '12px' }}>no link</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Latest purchases / sales, newest first */}
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '24px', color: LT, margin: '0 0 18px' }}>Latest Purchases &amp; Sales</h2>
            <div style={{ display: 'grid', gap: '8px' }}>
              {recentTxs.map(t => {
                const side = txSide(t)
                return (
                  <div key={t.id} style={{ background: CARD, border: `1px solid ${GN}`, borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '13px' }}>
                    <span style={{ border: `1px solid ${sideColor(side)}`, color: sideColor(side), borderRadius: '4px', padding: '1px 8px', fontSize: '11px', fontWeight: 700, minWidth: '64px', textAlign: 'center' }}>{side}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '14px', color: LT, minWidth: '64px' }}>{t.companies?.ticker || '—'}</span>
                    <span style={{ color: MUTED, minWidth: '120px' }}>{fmtDate(t.transaction_date)}</span>
                    <span style={{ color: LT, fontFamily: 'monospace' }}>{fmtMoney(txValue(t))}</span>
                    <span style={{ color: DIM, flex: 1 }}>{t.companies?.name || ''}</span>
                    {t.form4_url ? <a href={t.form4_url} target="_blank" rel="noopener noreferrer" style={{ color: G, fontSize: '12px', textDecoration: 'none' }}>Form 4 ↗</a> : <span style={{ color: '#5E6E64', fontSize: '12px' }}>no link</span>}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </section>

      <footer style={{ borderTop: `1px solid ${GN}`, padding: '24px 32px', textAlign: 'center', color: '#5E6E64', fontSize: '12px' }}>
        Holdings sourced from SEC EDGAR Form 4 filings, matched by filer name. Net-worth figures are estimates, not SEC data. Not financial advice.
      </footer>
    </>
  )
}
