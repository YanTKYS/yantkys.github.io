#!/usr/bin/env node
// 公開リポジトリの一覧を GitHub REST API から取得し、repositories.json を生成する。
// 依存パッケージなし（Node.js 20 以上）。
//
//   node scripts/fetch-repos.mjs [--out repositories.json] [--owner YanTKYS] [--fallback-url URL]
//
// 環境変数: GITHUB_TOKEN（任意。未指定でも公開リポジトリは取得可）, GITHUB_API_URL
//
// 取得に失敗した場合は終了コード 1 で終了し、出力ファイルを作成しない（空データを書き出さない）。
// --fallback-url を指定した場合に限り、取得失敗時は公開済みの repositories.json を
// 検証したうえで再利用する。

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).flatMap((a, i, all) =>
  a.startsWith('--') ? [[a.slice(2), all[i + 1]]] : []));
const OWNER = args.owner || process.env.REPO_OWNER || 'YanTKYS';
const OUT = args.out || 'repositories.json';
const API = (process.env.GITHUB_API_URL || 'https://api.github.com').replace(/\/$/, '');
const PER_PAGE = 100;

async function request(url, { retries = 2 } = {}) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'portfolio-data-generator'
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) });
      if (res.ok) return res;
      // 一時的な失敗のみ再試行（認証・存在エラーなどは即失敗）
      if (res.status < 500 && res.status !== 429 || attempt >= retries) {
        throw new Error(`GitHub API ${res.status} ${res.statusText}: ${url}`);
      }
    } catch (e) {
      if (attempt >= retries || /GitHub API 4(?!29)\d\d/.test(String(e.message))) throw e;
    }
    await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
  }
}

function pagesUrl(name) {
  const host = `${OWNER.toLowerCase()}.github.io`;
  return name.toLowerCase() === host ? `https://${host}/` : `https://${host}/${encodeURIComponent(name)}/`;
}

async function fetchAll() {
  const all = [];
  let url = `${API}/users/${encodeURIComponent(OWNER)}/repos?type=owner&sort=pushed&direction=desc&per_page=${PER_PAGE}`;
  while (url) {
    const res = await request(url);
    const page = await res.json();
    if (!Array.isArray(page)) throw new Error('GitHub API の応答が配列ではありません');
    all.push(...page);
    const next = /<([^>]+)>;\s*rel="next"/.exec(res.headers.get('link') || '');
    url = next ? next[1] : null;
  }
  return all;
}

function toEntry(r) {
  return {
    name: r.name,
    description: r.description || '',
    language: r.language || '',
    pushed_at: r.pushed_at || null,
    html_url: r.html_url,
    fork: !!r.fork,
    archived: !!r.archived,
    pages_url: r.has_pages ? pagesUrl(r.name) : ''
  };
}

function build(raw) {
  const repos = raw
    // 公開リポジトリのみ（/users/{owner}/repos は公開のみを返すが、念のため二重に除外する）
    .filter((r) => r && r.private === false && (r.visibility == null || r.visibility === 'public'))
    .filter((r) => r.owner && String(r.owner.login).toLowerCase() === OWNER.toLowerCase())
    .map(toEntry)
    .sort((a, b) => (b.pushed_at || '').localeCompare(a.pushed_at || '') || a.name.localeCompare(b.name));
  if (!repos.length) throw new Error(`公開リポジトリが 1 件も取得できませんでした（owner: ${OWNER}）`);
  return { owner: OWNER, generated_at: new Date().toISOString(), repositories: repos };
}

function write(data) {
  mkdirSync(dirname(OUT) || '.', { recursive: true });
  writeFileSync(OUT, JSON.stringify(data, null, 2) + '\n');
}

async function fallback(url, cause) {
  console.log(`::warning::GitHub API から取得できませんでした（${cause}）。公開中の ${url} を再利用します`);
  const res = await request(url, { retries: 1 });
  const data = await res.json();
  if (!data || !Array.isArray(data.repositories) || !data.repositories.length ||
      data.repositories.some((r) => !r || typeof r.name !== 'string' || typeof r.html_url !== 'string')) {
    throw new Error('公開中の repositories.json が不正または空のため、再利用できません');
  }
  return data;
}

try {
  const data = build(await fetchAll());
  write(data);
  console.log(`${data.repositories.length} 件の公開リポジトリを ${OUT} に出力しました`);
} catch (e) {
  console.error(`取得に失敗しました: ${e.message}`);
  if (args['fallback-url']) {
    try {
      const data = await fallback(args['fallback-url'], e.message);
      write(data);
      console.log(`${data.repositories.length} 件（生成: ${data.generated_at}）を ${OUT} に出力しました`);
      process.exit(0);
    } catch (e2) {
      console.error(`フォールバックにも失敗しました: ${e2.message}`);
    }
  }
  process.exit(1);
}
