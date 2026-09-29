import test, { after } from 'node:test';
import assert from 'node:assert/strict';

import { buildRuntimeLogEntry, db, getMongoCollectionName } from './db.ts';

after(async () => {
  await db.closeConnection();
});

test('buildRuntimeLogEntry adds timestamp and runtime metadata', () => {
  const entry = buildRuntimeLogEntry({ source: 'api', status: 'ok' });

  assert.equal(entry.source, 'api');
  assert.equal(entry.status, 'ok');
  assert.ok(entry.timestamp);
  assert.ok(entry.runtime);
  assert.ok(entry.runtime.nodeVersion);
  assert.ok(entry.runtime.platform);
});

test('Mongo collection name is configured as medtech3', () => {
  assert.equal(getMongoCollectionName(), 'medtech3');
});

test('the supplied six accounts replace old role accounts', () => {
  const users = db.getUsers();

  assert.equal(users.length, 6);
  assert.deepEqual(users.map(user => user.email).sort(), [
    '2425001@saec.ac.in',
    '2425002@saec.ac.in',
    '2425006@saec.ac.in',
    '2425013@saec.ac.in',
    '2425025@saec.ac.in',
    '2425042@saec.ac.in'
  ]);
});

test('imported account passwords are checked without storing plaintext', () => {
  assert.equal(db.verifyUserPassword('pat_2425013', 'Harish'), true);
  assert.equal(db.verifyUserPassword('pat_2425013', 'wrong-password'), false);
  assert.equal(db.verifyUserPassword('doc_2425002', 'Amarnath'), true);
  assert.equal(db.verifyUserPassword('doc_2425042', 'Sashank'), true);
  assert.equal(db.verifyUserPassword('pat_2425025', 'Madeshwar'), true);
  assert.equal(db.verifyUserPassword('pat_2425006', 'Charukesh'), true);
  assert.equal(db.verifyUserPassword('admin_2425001', 'Abishek'), true);
});
