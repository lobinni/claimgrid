import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, CheckCircle2, CircleHelp, Grid2X2, ShieldCheck, Sparkles, Wallet, X } from 'lucide-react';
import { CONTRACT_ADDRESS, EXPLORER_URL, NETWORK_NAME, isConfigured } from './config';
import { getCurrentAccount, connectWallet } from './wallet';
import { asAddress, asU256, readContract, writeContract } from './lib';
import { shortAddress, toGen, toNumber, type Provider, type Item, type Claim } from '@claimgrid/shared';
import './styles.css';

type Tab = 'overview' | 'provider' | 'customer';

const zeroAddress = '0x0000000000000000000000000000000000000000';

function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [provider, setProvider] = useState<Provider | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [providerAddress, setProviderAddress] = useState('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  async function refresh(address = account) {
    if (!address || !isConfigured) return;
    try {
      const p = await readContract('get_provider', [asAddress(address)]) as Provider | null;
      setProvider(p);
      const ids = await readContract('get_customer_items', [asAddress(address), 0, 50]) as any[];
      const loaded: Item[] = [];
      for (const id of ids || []) {
        const item = await readContract('get_item', [asU256(id)]) as Item | null;
        if (item) loaded.push(item);
      }
      setItems(loaded);
      const loadedClaims: Claim[] = [];
      for (const item of loaded) {
        if (toNumber(item.open_claim)) {
          const claim = await readContract('get_claim', [asU256(item.open_claim)]) as Claim | null;
          if (claim) loadedClaims.push(claim);
        }
      }
      setClaims(loadedClaims);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to refresh chain state.');
    }
  }

  useEffect(() => {
    getCurrentAccount().then(setAccount).catch(() => undefined);
  }, []);

  useEffect(() => { refresh(); }, [account]);

  async function connect() {
    try {
      setBusy(true);
      const address = await connectWallet();
      setAccount(address);
      setNotice('Wallet connected to Studionet.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Wallet connection failed.');
    } finally { setBusy(false); }
  }

  async function execute(fn: string, args: unknown[] = [], value?: bigint) {
    if (!account) return setNotice('Connect MetaMask first.');
    try {
      setBusy(true);
      setNotice('Transaction submitted. Waiting for network response…');
      await writeContract(account, fn, args, value);
      setNotice('Transaction accepted. Refreshing state…');
      await refresh(account);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Transaction failed.');
    } finally { setBusy(false); }
  }

  const stats = useMemo(() => ({
    coverage: items.filter(i => i.status === 'ACTIVE').length,
    open: claims.filter(c => c.status === 'OPEN').length,
    approved: claims.filter(c => c.status === 'APPROVED').length,
  }), [items, claims]);

  return <div className="app-shell">
    <div className="noise" />
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><Grid2X2 size={18}/></div><span>ClaimGrid</span></div>
      <nav><button className={tab === 'overview' ? 'nav-active' : ''} onClick={() => setTab('overview')}>Overview</button><button className={tab === 'provider' ? 'nav-active' : ''} onClick={() => setTab('provider')}>Provider</button><button className={tab === 'customer' ? 'nav-active' : ''} onClick={() => setTab('customer')}>Customer</button></nav>
      <button className="wallet-btn" onClick={connect} disabled={busy}><Wallet size={16}/>{account ? shortAddress(account) : 'Connect wallet'}</button>
    </header>

    <main>
      <section className="hero">
        <div className="eyebrow"><span className="pulse"/> {NETWORK_NAME} · Chain 61999</div>
        <h1>Coverage that <em>holds.</em></h1>
        <p>Lock value behind clear policies. Register coverage. Let validator consensus resolve real-world incidents.</p>
        <div className="hero-actions"><button className="primary" onClick={() => setTab('customer')}>Open coverage <ArrowUpRight size={16}/></button><button className="ghost" onClick={() => setTab('provider')}>Create a provider</button></div>
      </section>

      {!isConfigured && <div className="warning"><CircleHelp size={18}/><div><strong>Contract address required</strong><span>Deploy the Intelligent Contract in Studio, then set VITE_CONTRACT_ADDRESS before using writes.</span></div></div>}
      {notice && <div className="notice"><span>{notice}</span><button onClick={() => setNotice('')}><X size={15}/></button></div>}

      <section className="stats-grid">
        <Stat label="Active coverage" value={String(stats.coverage)} detail="Your registered items" />
        <Stat label="Open reviews" value={String(stats.open)} detail="Waiting for resolution" />
        <Stat label="Approved claims" value={String(stats.approved)} detail="Ready for settlement" />
        <Stat label="Network" value="61999" detail="Studionet" />
      </section>

      {tab === 'overview' && <Overview account={account} provider={provider} items={items} claims={claims} />}
      {tab === 'provider' && <ProviderPanel account={account} provider={provider} execute={execute} />}
      {tab === 'customer' && <CustomerPanel account={account} providerAddress={providerAddress} setProviderAddress={setProviderAddress} execute={execute} items={items} selectedItem={selectedItem} setSelectedItem={setSelectedItem} claims={claims} />}
    </main>

    <footer><span>ClaimGrid · Open coverage infrastructure</span><a href={`${EXPLORER_URL}/address/${CONTRACT_ADDRESS}`} target="_blank">Contract <ArrowUpRight size={13}/></a></footer>
  </div>
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="stat-card"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
}

function Overview({ account, provider, items, claims }: { account: string | null; provider: Provider | null; items: Item[]; claims: Claim[] }) {
  return <section className="content-grid">
    <div className="panel panel-large"><div className="panel-head"><div><span className="kicker">Your activity</span><h2>Coverage board</h2></div><span className="badge">Live</span></div>
      {!account ? <Empty title="Connect a wallet" text="Your provider and customer activity will appear here." /> : items.length === 0 ? <Empty title="No coverage yet" text="Register an item with a provider to start your first coverage record." /> : <div className="list">{items.map(item => <div className="row" key={String(item.id)}><div className="row-icon"><ShieldCheck size={18}/></div><div className="row-main"><strong>{item.name}</strong><span>{item.status} · {toGen(item.value)} GEN ceiling</span></div><span className={`status ${item.status.toLowerCase()}`}>{item.status}</span></div>)}</div>}
    </div>
    <div className="panel"><div className="panel-head"><div><span className="kicker">Provider profile</span><h2>{provider?.name || 'Not registered'}</h2></div><Sparkles size={20}/></div>{provider ? <div className="metric-stack"><Metric label="Pool" value={`${toGen(provider.pool)} GEN`} /><Metric label="Reserved" value={`${toGen(provider.reserved)} GEN`} /><Metric label="Policy version" value={String(toNumber(provider.policy_version))} /></div> : <Empty title="Become a provider" text="Lock GEN and publish a policy from the Provider tab." />}</div>
    <div className="panel panel-wide"><div className="panel-head"><div><span className="kicker">Claims</span><h2>Recent decisions</h2></div></div>{claims.length ? <div className="list">{claims.map(c => <div className="row" key={String(c.id)}><div className="row-icon"><CheckCircle2 size={18}/></div><div className="row-main"><strong>Claim #{String(c.id)}</strong><span>{c.status} · {toNumber(c.awarded_pct)}% awarded</span></div><span className={`status ${c.status.toLowerCase()}`}>{c.status}</span></div>)}</div> : <Empty title="No open claims" text="Claims become visible here while your active coverage is being reviewed." />}</div>
  </section>
}

function ProviderPanel({ account, provider, execute }: { account: string | null; provider: Provider | null; execute: (fn: string, args?: unknown[], value?: bigint) => Promise<void> }) {
  const [name, setName] = useState('Atlas Coverage');
  const [policy, setPolicy] = useState('Coverage applies to manufacturing defects and functional failures during ordinary use. Cosmetic wear, deliberate damage, and unauthorized modifications are excluded. A customer should provide a clear description and any available public evidence. Awards are proportional to the affected function and may not exceed the requested amount.');
  const [stake, setStake] = useState('10');
  return <section className="form-layout"><div className="panel form-card"><div className="panel-head"><div><span className="kicker">Provider console</span><h2>{provider ? 'Manage your pool' : 'Open a provider pool'}</h2></div><ShieldCheck size={21}/></div>{provider ? <div className="form-stack"><div className="metric-stack"><Metric label="Available pool" value={`${toGen(provider.pool)} GEN`} /><Metric label="Reserved" value={`${toGen(provider.reserved)} GEN`} /></div><button className="primary wide" onClick={() => execute('add_pool', [], BigInt(Math.floor(Number(stake) * 1e18)))}>Add {stake || '0'} GEN</button><label>Top-up amount<input value={stake} onChange={e => setStake(e.target.value)} type="number" min="0" step="0.1" /></label><label>Coverage policy<textarea value={policy} onChange={e => setPolicy(e.target.value)} /></label><button className="ghost wide" onClick={() => execute('update_policy', [policy])}>Update policy</button></div> : <div className="form-stack"><label>Provider name<input value={name} onChange={e => setName(e.target.value)} /></label><label>Coverage policy<textarea value={policy} onChange={e => setPolicy(e.target.value)} /></label><label>Initial pool (GEN)<input value={stake} onChange={e => setStake(e.target.value)} type="number" min="0" step="0.1" /></label><button className="primary wide" disabled={!account} onClick={() => execute('register_provider', [name, policy], BigInt(Math.floor(Number(stake) * 1e18)))}>Register provider</button></div>}</div><div className="side-note"><span className="kicker">Design principle</span><h3>Liquidity follows the promise.</h3><p>Reserved coverage cannot be withdrawn. Policy versions protect customers from retroactive rule changes.</p></div></section>
}

function CustomerPanel({ account, providerAddress, setProviderAddress, execute, items, selectedItem, setSelectedItem, claims }: any) {
  const [name, setName] = useState('Device Coverage'); const [value, setValue] = useState('2'); const [proof, setProof] = useState('https://example.com/receipt'); const [days, setDays] = useState('30'); const [description, setDescription] = useState('The covered device stopped functioning during ordinary use and the failure affects a core function.'); const [evidence, setEvidence] = useState('https://example.com/evidence'); const [pct, setPct] = useState('100');
  return <section className="form-layout"><div className="panel form-card"><div className="panel-head"><div><span className="kicker">Customer console</span><h2>Register coverage</h2></div><Grid2X2 size={20}/></div><div className="form-stack"><label>Provider address<input value={providerAddress} onChange={e => setProviderAddress(e.target.value)} placeholder="0x…" /></label><label>Item name<input value={name} onChange={e => setName(e.target.value)} /></label><label>Coverage value (GEN)<input value={value} onChange={e => setValue(e.target.value)} type="number" min="0" step="0.1" /></label><label>Proof URL<input value={proof} onChange={e => setProof(e.target.value)} /></label><button className="primary wide" disabled={!account} onClick={() => execute('register_item', [asAddress(providerAddress || zeroAddress), name, BigInt(Math.floor(Number(value) * 1e18)), proof])}>Register item</button></div></div><div className="panel form-card"><div className="panel-head"><div><span className="kicker">Provider action</span><h2>Approve coverage</h2></div></div><div className="form-stack"><label>Item ID<input value={selectedItem ? String(selectedItem.id) : ''} readOnly placeholder="Select an item below" /></label><label>Duration (days)<input value={days} onChange={e => setDays(e.target.value)} type="number" min="7" max="1095" /></label><button className="ghost wide" disabled={!selectedItem} onClick={() => execute('approve_item', [asU256(selectedItem.id), BigInt(days)])}>Approve selected item</button><div className="divider"/><span className="kicker">Your items</span>{items.map((item: Item) => <button className={`select-row ${selectedItem?.id === item.id ? 'selected' : ''}`} key={String(item.id)} onClick={() => setSelectedItem(item)}><span>{item.name}</span><small>#{String(item.id)} · {item.status}</small></button>)}</div></div><div className="panel form-card"><div className="panel-head"><div><span className="kicker">Incident review</span><h2>File a claim</h2></div></div><div className="form-stack"><label>Selected item<input value={selectedItem ? String(selectedItem.id) : ''} readOnly /></label><label>Incident description<textarea value={description} onChange={e => setDescription(e.target.value)} /></label><label>Evidence URLs<textarea value={evidence} onChange={e => setEvidence(e.target.value)} /></label><label>Requested coverage %<input value={pct} onChange={e => setPct(e.target.value)} type="number" min="1" max="100" /></label><button className="primary wide" disabled={!selectedItem} onClick={() => execute('file_claim', [asU256(selectedItem.id), description, evidence, Number(pct)])}>Submit claim</button>{claims.map((claim: Claim) => <div className="claim-box" key={String(claim.id)}><strong>Claim #{String(claim.id)} · {claim.status}</strong><p>{claim.reason || 'Validator review is in progress.'}</p>{claim.status === 'APPROVED' && <button className="ghost wide" onClick={() => execute('settle_claim', [asU256(claim.id)])}>Settle approved claim</button>}</div>)}</div></div></section>
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="metric"><span>{label}</span><strong>{value}</strong></div> }
function Empty({ title, text }: { title: string; text: string }) { return <div className="empty"><div className="empty-icon"><CircleHelp size={18}/></div><strong>{title}</strong><span>{text}</span></div> }

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
