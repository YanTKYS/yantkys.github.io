#!/usr/bin/env node
// 配信するデータファイルの形式を検証する。問題があれば終了コード 1。
//   node scripts/check-data.mjs [dir]   （既定: カレントディレクトリ）
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2] || '.';
const errors = [];
const warnings = [];
const load = (name) => {
  try { return JSON.parse(readFileSync(join(dir, name), 'utf8')); }
  catch (e) { errors.push(`${name}: ${e.message}`); return null; }
};

const sites = load('sites.json');
if (sites && !Array.isArray(sites.sites)) errors.push('sites.json: "sites" が配列ではありません');

const featured = load('featured.json');
if (featured && (!Array.isArray(featured.featured) || featured.featured.some((n) => typeof n !== 'string' || !n.trim()))) {
  errors.push('featured.json: "featured" はリポジトリ名（文字列）の配列にしてください');
}

const repos = load('repositories.json');
if (repos) {
  if (!Array.isArray(repos.repositories) || !repos.repositories.length) errors.push('repositories.json: repositories が空、または配列ではありません');
  else {
    const names = new Set();
    repos.repositories.forEach((r, i) => {
      if (!r || typeof r.name !== 'string' || !/^https:\/\/github\.com\//.test(r.html_url || '')) errors.push(`repositories[${i}]: name / html_url が不正です`);
      else if (names.has(r.name.toLowerCase())) errors.push(`repositories[${i}]: 名前が重複しています (${r.name})`);
      else names.add(r.name.toLowerCase());
    });
    for (const n of (featured && Array.isArray(featured.featured) ? featured.featured : [])) {
      if (!names.has(n.toLowerCase())) warnings.push(`featured.json: 「${n}」は公開リポジトリに存在しないため、代表作品に表示されません`);
    }
  }
}

warnings.forEach((w) => console.log(`::warning::${w}`));
if (errors.length) { errors.forEach((e) => console.error(`::error::${e}`)); process.exit(1); }
console.log('データファイルの検証に成功しました');
