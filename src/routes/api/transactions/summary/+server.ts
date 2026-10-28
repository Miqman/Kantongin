import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { normalizeDateStr } from '$lib/cycle';

export const GET: RequestHandler = async (event) => {
  try {
    const user = event.locals.user;
    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = event.url.searchParams;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const prevStartDate = searchParams.get('prev_start_date');
    const prevEndDate = searchParams.get('prev_end_date');
    const todayStr = searchParams.get('today');

    if (!startDate || !endDate) {
      return json({ error: 'start_date and end_date are required' }, { status: 400 });
    }

    // Query lightweight columns only: user_id & amount (no table joins, minimal network payload)
    const [allTimeRes, monthRes, prevRes] = await Promise.all([
      event.locals.supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id),
      event.locals.supabase
        .from('transactions')
        .select('amount, date')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate),
      prevStartDate && prevEndDate
        ? event.locals.supabase
            .from('transactions')
            .select('amount')
            .eq('user_id', user.id)
            .gte('date', prevStartDate)
            .lte('date', prevEndDate)
        : Promise.resolve({ data: [] }),
    ]);

    const allData = allTimeRes.data ?? [];
    const monthData = monthRes.data ?? [];
    const prevData = prevRes.data ?? [];

    // All-time balance
    let atIncome = 0;
    let atExpense = 0;
    for (const t of allData) {
      const amt = Number(t.amount);
      if (amt < 0) atIncome += Math.abs(amt);
      else if (amt > 0) atExpense += amt;
    }
    const totalDanaAllTime = atIncome - atExpense;

    // Current month / cycle balance & expense
    let mIncome = 0;
    let mExpense = 0;
    let todayExp = 0;
    for (const t of monthData) {
      const amt = Number(t.amount);
      if (amt < 0) mIncome += Math.abs(amt);
      else if (amt > 0) {
        mExpense += amt;
        const dStr = normalizeDateStr(t.date);
        if (todayStr && dStr === todayStr) {
          todayExp += amt;
        }
      }
    }
    const totalDanaBulanIni = mIncome - mExpense;
    const totalBulanIni = mExpense;

    // Previous cycle balance & growth percentage
    let pIncome = 0;
    let pExpense = 0;
    for (const t of prevData) {
      const amt = Number(t.amount);
      if (amt < 0) pIncome += Math.abs(amt);
      else if (amt > 0) pExpense += amt;
    }
    const pBalance = pIncome - pExpense;

    let growthBulanIni = 0;
    if (pBalance !== 0) {
      growthBulanIni = ((totalDanaBulanIni - pBalance) / Math.abs(pBalance)) * 100;
    } else if (totalDanaBulanIni !== 0) {
      growthBulanIni = 100;
    }

    return json({
      totalDanaAllTime,
      totalDanaBulanIni,
      totalBulanIni,
      totalHariIni: todayExp,
      growthBulanIni,
    });
  } catch (err) {
    console.error('[/api/transactions/summary GET] Server Error:', err);
    return json({ error: 'Gagal mengambil ringkasan transaksi' }, { status: 500 });
  }
};

