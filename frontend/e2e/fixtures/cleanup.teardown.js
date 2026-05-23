import { test as teardown } from '@playwright/test';
import { readFileSync } from 'fs';

teardown('ลบ test data ถาวรหลังเทสจบ', async ({ request }) => {
  const authData = JSON.parse(readFileSync('e2e/.auth/admin.json', 'utf-8'));
  const token = authData.origins?.[0]?.localStorage?.find((i) => i.name === 'token')?.value;
  if (!token) return;

  const headers = { Authorization: `Bearer ${token}` };

  // ลบ test users (permanent delete)
  const usersRes = await request.get('http://localhost:3000/api/users?includeDeleted=true', { headers });
  if (usersRes.ok()) {
    const { data } = await usersRes.json();
    for (const user of data ?? []) {
      if (user.username.startsWith('testuser_')) {
        await request.delete(`http://localhost:3000/api/users/${user._id}/permanent`, { headers });
      }
    }
  }

  // ลบ test courts ที่ขึ้นต้นด้วย TCT (soft-delete เพียงพอ — ไม่ปรากฏในรายการอีก)
  const courtsRes = await request.get('http://localhost:3000/api/courts', { headers });
  if (courtsRes.ok()) {
    const { data: courts } = await courtsRes.json();
    for (const court of courts ?? []) {
      if (court.courtNumber.startsWith('TCT')) {
        await request.delete(`http://localhost:3000/api/courts/${court._id}`, { headers });
      }
    }
  }

  // ลบ test players ที่ชื่อขึ้นต้นด้วย "Test Player " (permanent delete ทั้ง active และ soft-deleted)
  const deleteTestPlayers = async (url) => {
    const res = await request.get(url, { headers });
    if (!res.ok()) return;
    const { data: players } = await res.json();
    for (const player of players ?? []) {
      if (player.name?.startsWith('Test Player ')) {
        await request.delete(`http://localhost:3000/api/players/${player._id}/permanent`, { headers }).catch(() => {});
      }
    }
  };
  await deleteTestPlayers('http://localhost:3000/api/players');
  await deleteTestPlayers('http://localhost:3000/api/players?includeDeleted=true');

  // ลบ test timeslots (ชั่วโมง 00:00–05:59 ไม่ใช่เวลาเปิดทำการจริง)
  const timeslotsRes = await request.get('http://localhost:3000/api/timeslots', { headers });
  if (timeslotsRes.ok()) {
    const { data: timeslots } = await timeslotsRes.json();
    for (const ts of timeslots ?? []) {
      const hour = parseInt(ts.startTime?.split(':')[0] ?? '99', 10);
      if (hour < 6) {
        await request.delete(`http://localhost:3000/api/timeslots/${ts._id}`, { headers });
      }
    }
  }
});
