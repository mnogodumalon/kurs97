import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, GraduationCap, DoorOpen, ClipboardList, TrendingUp, Euro, CheckCircle2, ArrowRight, CalendarDays } from 'lucide-react';
import { LivingAppsService } from '@/services/livingAppsService';
import type { Kurse, Anmeldungen } from '@/types/app';
import { format, parseISO, isAfter, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface Stats {
  kurse: number;
  dozenten: number;
  teilnehmer: number;
  raeume: number;
  anmeldungen: number;
  bezahlt: number;
  unbezahlt: number;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats>({
    kurse: 0, dozenten: 0, teilnehmer: 0, raeume: 0,
    anmeldungen: 0, bezahlt: 0, unbezahlt: 0,
  });
  const [aktiveKurse, setAktiveKurse] = useState<Kurse[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<{ name: string; anmeldungen: number }[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [kurseData, dozentenData, teilnehmerData, raeumeData, anmeldungenData] = await Promise.all([
          LivingAppsService.getKurse(),
          LivingAppsService.getDozenten(),
          LivingAppsService.getTeilnehmer(),
          LivingAppsService.getRaeume(),
          LivingAppsService.getAnmeldungen(),
        ]);

        const now = new Date();
        const bezahlt = anmeldungenData.filter((a: Anmeldungen) => a.fields.bezahlt).length;
        const unbezahlt = anmeldungenData.filter((a: Anmeldungen) => !a.fields.bezahlt).length;

        // Active/upcoming courses
        const active = kurseData.filter((k: Kurse) => {
          if (!k.fields.enddatum && !k.fields.startdatum) return false;
          const endDate = k.fields.enddatum
            ? parseISO(k.fields.enddatum)
            : k.fields.startdatum
            ? addDays(parseISO(k.fields.startdatum), 30)
            : now;
          return isAfter(endDate, now);
        }).slice(0, 4);

        // Monthly signup data (last 6 months)
        const months: { name: string; anmeldungen: number }[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = format(d, 'yyyy-MM');
          const count = anmeldungenData.filter((a: Anmeldungen) => {
            return a.fields.anmeldedatum && a.fields.anmeldedatum.startsWith(key);
          }).length;
          months.push({ name: format(d, 'MMM', { locale: de }), anmeldungen: count });
        }

        setStats({
          kurse: kurseData.length,
          dozenten: dozentenData.length,
          teilnehmer: teilnehmerData.length,
          raeume: raeumeData.length,
          anmeldungen: anmeldungenData.length,
          bezahlt,
          unbezahlt,
        });
        setAktiveKurse(active);
        setMonthlyData(months);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const kpiCards = [
    { label: 'Kurse', value: stats.kurse, icon: BookOpen, href: '/kurse', color: 'oklch(0.52 0.22 268)', bg: 'oklch(0.95 0.04 268)' },
    { label: 'Dozenten', value: stats.dozenten, icon: GraduationCap, href: '/dozenten', color: 'oklch(0.48 0.18 195)', bg: 'oklch(0.94 0.04 195)' },
    { label: 'Teilnehmer', value: stats.teilnehmer, icon: Users, href: '/teilnehmer', color: 'oklch(0.45 0.17 152)', bg: 'oklch(0.93 0.05 152)' },
    { label: 'Räume', value: stats.raeume, icon: DoorOpen, href: '/raeume', color: 'oklch(0.50 0.18 55)', bg: 'oklch(0.95 0.04 55)' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-full border-[3px] border-t-transparent animate-spin"
            style={{ borderColor: 'oklch(0.52 0.22 268)', borderTopColor: 'transparent' }}
          />
          <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Daten werden geladen…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div
        className="relative overflow-hidden rounded-2xl p-8"
        style={{ background: 'var(--gradient-hero)', boxShadow: 'var(--shadow-hero)' }}
      >
        <div className="relative z-10">
          <p className="text-sm font-semibold tracking-widest uppercase" style={{ color: 'oklch(0.82 0.08 268)' }}>
            Willkommen im
          </p>
          <h1 className="text-4xl font-bold mt-1 tracking-tight" style={{ color: 'oklch(1 0 0)' }}>
            KursVerwaltungssystem
          </h1>
          <p className="mt-2 text-base" style={{ color: 'oklch(0.84 0.06 268)' }}>
            Alles auf einen Blick — Kurse, Teilnehmer, Dozenten und Anmeldungen.
          </p>
          <div className="mt-6 flex items-center gap-4 flex-wrap">
            <Link
              to="/kurse"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                color: 'oklch(1 0 0)',
                background: 'oklch(1 0 0 / 0.15)',
                border: '1px solid oklch(1 0 0 / 0.25)',
              }}
            >
              <BookOpen size={16} /> Kurse verwalten <ArrowRight size={14} />
            </Link>
            <Link
              to="/anmeldungen"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                color: 'oklch(0.92 0.04 268)',
                background: 'oklch(1 0 0 / 0.08)',
                border: '1px solid oklch(1 0 0 / 0.15)',
              }}
            >
              <ClipboardList size={16} /> Anmeldungen <ArrowRight size={14} />
            </Link>
          </div>
        </div>
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full" style={{ background: 'oklch(1 0 0 / 0.04)' }} />
        <div className="absolute -right-4 -bottom-20 w-48 h-48 rounded-full" style={{ background: 'oklch(1 0 0 / 0.06)' }} />
        <div className="absolute right-32 top-4 w-24 h-24 rounded-full" style={{ background: 'oklch(1 0 0 / 0.05)' }} />
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(card => (
          <Link key={card.href} to={card.href} className="stat-card p-5 flex flex-col gap-4 no-underline group">
            <div className="flex items-center justify-between">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: card.bg }}
              >
                <card.icon size={20} style={{ color: card.color }} />
              </div>
              <ArrowRight
                size={14}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: 'var(--muted-foreground)' }}
              />
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
                {card.value}
              </p>
              <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                {card.label}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Anmeldungen Summary */}
        <div className="stat-card p-6 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'oklch(0.95 0.04 268)' }}>
              <TrendingUp size={18} style={{ color: 'oklch(0.52 0.22 268)' }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Anmeldungen</h3>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Zahlungsstatus</p>
            </div>
          </div>
          <div className="text-5xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            {stats.anmeldungen}
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} style={{ color: 'oklch(0.55 0.16 152)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Bezahlt</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color: 'oklch(0.45 0.15 152)' }}>{stats.bezahlt}</span>
                <span className="badge-paid text-xs px-2 py-0.5 rounded-full font-medium">
                  {stats.anmeldungen > 0 ? Math.round((stats.bezahlt / stats.anmeldungen) * 100) : 0}%
                </span>
              </div>
            </div>
            <div className="w-full h-2 rounded-full" style={{ background: 'var(--muted)' }}>
              <div
                className="h-2 rounded-full transition-all duration-700"
                style={{
                  width: stats.anmeldungen > 0 ? `${(stats.bezahlt / stats.anmeldungen) * 100}%` : '0%',
                  background: 'oklch(0.6 0.16 152)',
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Euro size={14} style={{ color: 'oklch(0.55 0.16 35)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Ausstehend</span>
              </div>
              <span className="badge-unpaid text-xs px-2 py-0.5 rounded-full font-medium">{stats.unbezahlt}</span>
            </div>
          </div>
          <Link
            to="/anmeldungen"
            className="mt-auto text-xs font-semibold flex items-center gap-1"
            style={{ color: 'oklch(0.52 0.22 268)' }}
          >
            Alle Anmeldungen <ArrowRight size={12} />
          </Link>
        </div>

        {/* Monthly Chart */}
        <div className="stat-card p-6 col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Anmeldungen — letzte 6 Monate</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Monatliche Übersicht</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.012 265 / 1)" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'oklch(0.52 0.03 265)', fontFamily: 'Plus Jakarta Sans' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'oklch(0.52 0.03 265)', fontFamily: 'Plus Jakarta Sans' }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid oklch(0.91 0.012 265)',
                  borderRadius: '10px',
                  fontFamily: 'Plus Jakarta Sans',
                  fontSize: 12,
                }}
                cursor={{ fill: 'oklch(0.52 0.22 268 / 0.05)' }}
              />
              <Bar dataKey="anmeldungen" radius={[6, 6, 0, 0]} name="Anmeldungen">
                {monthlyData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={i === monthlyData.length - 1 ? 'oklch(0.52 0.22 268)' : 'oklch(0.52 0.22 268 / 0.35)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Aktive Kurse */}
      <div className="stat-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'oklch(0.95 0.04 268)' }}>
              <CalendarDays size={18} style={{ color: 'oklch(0.52 0.22 268)' }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Aktive & kommende Kurse</h3>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Laufende und geplante Kurse</p>
            </div>
          </div>
          <Link
            to="/kurse"
            className="text-xs font-semibold flex items-center gap-1"
            style={{ color: 'oklch(0.52 0.22 268)' }}
          >
            Alle anzeigen <ArrowRight size={12} />
          </Link>
        </div>

        {aktiveKurse.length === 0 ? (
          <div className="text-center py-10">
            <BookOpen size={32} className="mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Keine aktiven Kurse vorhanden.</p>
            <Link
              to="/kurse"
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold"
              style={{ color: 'oklch(0.52 0.22 268)' }}
            >
              Kurs anlegen <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {aktiveKurse.map(kurs => (
              <div
                key={kurs.record_id}
                className="flex items-start gap-4 p-4 rounded-xl"
                style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
              >
                <div
                  className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-xs font-bold"
                  style={{ background: 'var(--gradient-hero)', color: 'oklch(1 0 0)' }}
                >
                  {(kurs.fields.titel || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--foreground)' }}>
                    {kurs.fields.titel || '—'}
                  </p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {kurs.fields.startdatum && (
                      <span className="text-xs flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
                        <CalendarDays size={11} />
                        {format(parseISO(kurs.fields.startdatum), 'dd. MMM yyyy', { locale: de })}
                      </span>
                    )}
                    {kurs.fields.preis != null && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: 'oklch(0.95 0.04 268)', color: 'oklch(0.42 0.2 268)' }}
                      >
                        {kurs.fields.preis.toFixed(2)} €
                      </span>
                    )}
                    {kurs.fields.max_teilnehmer != null && (
                      <span className="text-xs flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
                        <Users size={11} /> max. {kurs.fields.max_teilnehmer}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
