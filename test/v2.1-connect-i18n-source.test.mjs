import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source=readFileSync(new URL('../app/projects/[id]/connect/page.tsx',import.meta.url),'utf8');

test('project connection onboarding follows global EN/VI language state',()=>{
  assert.match(source,/useI18n/);
  assert.match(source,/const \{lang\}=useI18n\(\)/);
  assert.match(source,/const c=copy\[lang\]/);
  assert.match(source,/KÍCH HOẠT DỰ ÁN/);
  assert.match(source,/Kiểm tra kết nối/);
  assert.match(source,/Đang chờ sự kiện đầu tiên/);
  assert.match(source,/Sao chép mã/);
  assert.match(source,/guides\[lang\]/);
});

test('all three onboarding install paths have localized copy',()=>{
  assert.match(source,/Tôi sẽ tự cài/);
  assert.match(source,/Tôi có developer/);
  assert.match(source,/Gửi hướng dẫn/);
  assert.match(source,/Checklist cho developer/);
  assert.match(source,/Hướng dẫn sẵn để gửi/);
});
