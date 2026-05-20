import { test as teardown } from '@playwright/test';
import { readFileSync } from 'fs';

teardown('ลบ test users ถาวรหลังเทสจบ', async ({ request }) => {
  const authData = JSON.parse(readFileSync('e2e/.auth/admin.json', 'utf-8'));
  const token = authData.origins?.[0]?.localStorage?.find((i) => i.name === 'token')?.value;
  if (!token) return;

  const res = await request.get('http://localhost:3000/api/users?includeDeleted=true', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) return;

  const { data } = await res.json();
  for (const user of data ?? []) {
    if (user.username.startsWith('testuser_')) {
      await request.delete(`http://localhost:3000/api/users/${user._id}/permanent`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  }
});
