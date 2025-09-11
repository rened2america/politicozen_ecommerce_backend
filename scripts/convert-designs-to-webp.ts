#!/usr/bin/env ts-node
import 'dotenv/config';
import http from 'http';
import https from 'https';
import sharp from 'sharp';
import pLimit from 'p-limit';
import AWS from 'aws-sdk';
import { PrismaClient, Design, Group } from '@prisma/client';
import type S3 from 'aws-sdk/clients/s3';
import { connectionAws } from '../src/utils/configAws';
// how to run
// npm run convert:webp:artist
const CONCURRENCY = Number(process.env.CONCURRENCY || 5);
const WEBP_QUALITY = Number(process.env.WEBP_QUALITY || 82);
const LOGO_LOSSLESS = String(process.env.WEBP_LOGO_LOSSLESS || 'true') === 'true';
const LOGO_QUALITY = Number(process.env.WEBP_LOGO_QUALITY || 90);
const MAX_W = Number(process.env.WEBP_MAX_W || 3000);
const MAX_H = Number(process.env.WEBP_MAX_H || 3000);
const PUBLIC_READ = process.env.S3_PUBLIC_READ === 'true';

// S3 throttling/retry
const S3_CONCURRENCY       = Number(process.env.S3_CONCURRENCY || 2);
const S3_QUEUE_SIZE        = Number(process.env.S3_QUEUE_SIZE   || 1);
const S3_PART_SIZE_BYTES   = Number(process.env.S3_PART_SIZE_MB ? Number(process.env.S3_PART_SIZE_MB) * 1024 * 1024 : 8 * 1024 * 1024);
const S3_MAX_ATTEMPTS      = Number(process.env.S3_MAX_ATTEMPTS || 8);
const S3_BASE_DELAY_MS     = Number(process.env.S3_BASE_DELAY_MS || 200);
const S3_MAX_DELAY_MS      = Number(process.env.S3_MAX_DELAY_MS  || 5000);
const S3_MIN_INTERVAL_MS   = Number(process.env.S3_MIN_INTERVAL_MS || 0);

// Configure AWS SDK v2 retry base BEFORE creating clients
AWS.config.update({
  // let SDK also retry with exponential backoff (base can be tuned)
  maxRetries: Math.max((AWS.config as any).maxRetries || 3, S3_MAX_ATTEMPTS),
  retryDelayOptions: { base: Math.max(100, S3_BASE_DELAY_MS) },
} as any);

const prisma = new PrismaClient();
const s3: S3 = connectionAws() as S3;

const limit = pLimit(CONCURRENCY);
const s3Limit = pLimit(S3_CONCURRENCY);

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
const isEmpty = (s?: string | null) => !s || s.trim() === '';

function isWebpUrl(url: string): boolean {
  try {
    const { pathname } = new URL(url);
    return /\.webp$/i.test(pathname);
  } catch {
    return false;
  }
}

function logSkip(scope: 'Design' | 'Group', id: number, reason: string) {
  console.log(`${scope} ${id}: skipped — ${reason}`);
}

function makeWebpKeyFromUrl(sourceUrl: string): { bucket: string; key: string } | null {
  try {
    const u = new URL(sourceUrl);
    const host = u.hostname.toLowerCase();
    const pathKey = decodeURIComponent(u.pathname.replace(/^\/+/, ''));

    const m = host.match(/^([^.]+)\.s3(?:[.-][a-z0-9-]+)?\.amazonaws\.com$/i);
    if (m) {
      const bucket = m[1];
      const base = pathKey.replace(/\.[^./]+$/, '');
      return { bucket, key: `${base}.webp` };
    }

    if (/^s3(?:[.-][a-z0-9-]+)?\.amazonaws\.com$/i.test(host)) {
      const [bucket, ...rest] = pathKey.split('/');
      if (!bucket || !rest.length) return null;
      const base = rest.join('/').replace(/\.[^./]+$/, '');
      return { bucket, key: `${base}.webp` };
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchUrlBuffer(url: string, redirects = 3): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, (res) => {
      const { statusCode, headers } = res;

      if (statusCode && statusCode >= 300 && statusCode < 400 && headers.location && redirects > 0) {
        res.resume();
        const next = new URL(headers.location, url).toString();
        return resolve(fetchUrlBuffer(next, redirects - 1));
      }

      if (statusCode !== 200) {
        res.resume();
        return reject(Object.assign(new Error(`HTTP ${statusCode} for ${url}`), { statusCode }));
      }

      const chunks: Uint8Array[] = [];
      res.on('data', (c: Buffer | Uint8Array) => {
        chunks.push(Buffer.isBuffer(c) ? new Uint8Array(c) : c);
      });
      res.on('end', () => resolve(Buffer.concat(chunks as readonly Uint8Array[])));
    });
    req.on('error', reject);
  });
}

const isRetryableS3 = (e: any) =>
  e?.retryable === true ||
  e?.statusCode >= 500 ||
  e?.code === 'SlowDown' || e?.code === 'Throttling' || e?.code === 'RequestTimeout';

// full-jitter exponential backoff
async function backoff(attemptIdx: number) {
  const base = S3_BASE_DELAY_MS * Math.pow(2, attemptIdx); // 0,1,2,...
  const jitter = base * (0.5 + Math.random());             // full jitter
  const wait = Math.min(S3_MAX_DELAY_MS, jitter);
  await sleep(wait);
}

// choose putObject for small payloads; ManagedUpload for larger
async function uploadWithRetry(params: S3.PutObjectRequest, bodyLen: number) {
  let attempt = 0;
  // limit *all* S3 uploads
  return s3Limit(async () => {
    for (;;) {
      try {
        if (S3_MIN_INTERVAL_MS) await sleep(S3_MIN_INTERVAL_MS);
        const result = await (bodyLen < S3_PART_SIZE_BYTES
          ? s3.putObject(params).promise()
          : (s3 as any).upload(params, { queueSize: S3_QUEUE_SIZE, partSize: S3_PART_SIZE_BYTES }).promise()
        );
        return result;
      } catch (e: any) {
        attempt++;
        if (!isRetryableS3(e) || attempt >= S3_MAX_ATTEMPTS) throw e;
        await backoff(attempt - 1); // attempt 1 => exponent 0
      }
    }
  });
}

async function uploadWebpNextToSource(sourceUrl: string, webpBuf: Buffer): Promise<string | null> {
  const dest = makeWebpKeyFromUrl(sourceUrl);
  if (!dest) {
    console.warn(`skip-upload: non-S3 source URL → ${sourceUrl}`);
    return null;
  }
  const params: S3.PutObjectRequest = {
    Bucket: dest.bucket,
    Key: dest.key,
    Body: webpBuf,
    ContentType: 'image/webp',
    CacheControl: 'public, max-age=31536000, immutable',
    ...(PUBLIC_READ ? { ACL: 'public-read' as any } : {}),
  };

  const out: any = await uploadWithRetry(params, webpBuf.length);

  // ManagedUpload returns Location; putObject doesn't. Build fallback URL if needed.
  if (out?.Location) return out.Location;

  const region = (s3 as any).config?.region || process.env.AWS_REGION || 'us-east-1';
  const host = region === 'us-east-1'
    ? `${dest.bucket}.s3.amazonaws.com`
    : `${dest.bucket}.s3.${region}.amazonaws.com`;
  return `https://${host}/${encodeURI(dest.key)}`;
}

// main converter: source = URL, upload = S3.upload/putObject, return Location
async function convertUrlToWebp(url: string, opts: sharp.WebpOptions): Promise<string | null> {
  if (isWebpUrl(url)) {
    console.log(`no-convert: already .webp → ${url}`);
    return url;
  }

  let buf: Buffer;
  try {
    buf = await fetchUrlBuffer(url);
  } catch (e: any) {
    console.warn(`skip-convert: fetch failed for ${url}`, e?.statusCode ? `(HTTP ${e.statusCode})` : e);
    return null;
  }

  const meta = await sharp(buf).metadata();
  const outBuf =
    meta.format === 'webp'
      ? buf
      : await sharp(buf)
          .rotate()
          .resize({ width: MAX_W, height: MAX_H, fit: 'inside', withoutEnlargement: true })
          .webp(opts)
          .toBuffer();

  const uploaded = await uploadWebpNextToSource(url, outBuf);
  if (!uploaded) {
    console.warn(`skip-upload: could not determine S3 destination for ${url}`);
    return null;
  }
  return uploaded;
}

// ---------- Counters ----------
let designUpdated = 0;
let groupUpdated = 0;
let designLogoPropagated = 0;

const isMissing = (field: 'urlWebp' | 'urlLogoWebp' | 'urlImageWebp') => ({
  OR: [{ [field]: null as any }, { [field]: '' as any }],
});

// ---------- Processors ----------
async function processDesign(d: Design) {
  const updates: Partial<Design> = {};

  // main image
  if (isEmpty(d.url)) {
    logSkip('Design', d.id, 'main: empty url');
  } else if (d.urlWebp) {
    logSkip('Design', d.id, 'main: urlWebp already set');
  } else {
    if (isWebpUrl(d.url)) {
      updates.urlWebp = d.url;
      console.log(`Design ${d.id}: main already .webp (saved without converting)`);
    } else {
      const url = await convertUrlToWebp(d.url, { quality: WEBP_QUALITY, effort: 4 });
      if (!url) logSkip('Design', d.id, 'main: fetch/upload failed');
      else updates.urlWebp = url;
    }
  }

  // logo
  if (isEmpty(d.urlLogo)) {
    logSkip('Design', d.id, 'logo: empty url');
  } else if (d.urlLogoWebp) {
    logSkip('Design', d.id, 'logo: urlLogoWebp already set');
  } else {
    if (isWebpUrl(d.urlLogo)) {
      updates.urlLogoWebp = d.urlLogo;
      console.log(`Design ${d.id}: logo already .webp (saved without converting)`);
    } else {
      const opts = LOGO_LOSSLESS ? { lossless: true } : { quality: LOGO_QUALITY, alphaQuality: 100, effort: 4 };
      const url = await convertUrlToWebp(d.urlLogo, opts);
      if (!url) logSkip('Design', d.id, 'logo: fetch/upload failed');
      else updates.urlLogoWebp = url;
    }
  }

  if (Object.keys(updates).length === 0) {
    logSkip('Design', d.id, 'nothing to update');
    return;
  }

  // 👇 race-safe conditional write — only update if fields are STILL missing
  const and: any[] = [];
  if ('urlWebp' in updates)  and.push(isMissing('urlWebp')  as any);
  if ('urlLogoWebp' in updates) and.push(isMissing('urlLogoWebp') as any);

  const whereGuard: any = { id: d.id, ...(and.length ? { AND: and } : {}) };

  const res = await prisma.design.updateMany({
    where: whereGuard,
    data: updates,
  });

  if (res.count === 0) {
    logSkip('Design', d.id, 'lost race/already updated');
    return;
  }

  designUpdated++;
  console.log(`Design ${d.id}: updated`);
}

async function processGroup(g: Group) {
  if (isEmpty(g.urlImage)) {
    logSkip('Group', g.id, 'image: empty url');
    return;
  }

  // Ensure group has urlImageWebp (convert if needed)
  let imageWebp = g.urlImageWebp || null;

  if (imageWebp) {
    logSkip('Group', g.id, 'image: urlImageWebp already set');
  } else if (isWebpUrl(g.urlImage)) {
    await prisma.group.update({ where: { id: g.id }, data: { urlImageWebp: g.urlImage } });
    imageWebp = g.urlImage;
    groupUpdated++;
    console.log(`Group ${g.id}: image already .webp (saved without converting)`);
  } else {
    const url = await convertUrlToWebp(g.urlImage, { quality: WEBP_QUALITY, effort: 4 });
    if (!url) {
      logSkip('Group', g.id, 'image: fetch/upload failed');
      return;
    }
    await prisma.group.update({ where: { id: g.id }, data: { urlImageWebp: url } });
    imageWebp = url;
    groupUpdated++;
    console.log(`Group ${g.id}: converted`);
  }

  // Propagate to designs in this group:
  // Set Design.urlLogoWebp = Group.urlImageWebp for designs that (a) belong to this group via Product,
  // (b) have urlLogo equal to the group's urlImage, and (c) are missing urlLogoWebp.
  if (imageWebp) {
    const assign = await prisma.design.updateMany({
      where: {
        product: { is: { groupId: g.id } }, // relation filter
        AND: [isMissing('urlLogoWebp') as any, { urlLogo: g.urlImage }],
      },
      data: { urlLogoWebp: imageWebp },
    });
    if (assign.count > 0) {
      designLogoPropagated += assign.count;
      console.log(`Group ${g.id}: propagated urlLogoWebp to ${assign.count} design(s)`);
    }
  }
}

// ---------- Main ----------
async function main() {
  const artistIdArg = process.argv.find((a) => a.startsWith('--artistId='));
  const artistId = artistIdArg ? Number(artistIdArg.split('=')[1]) : undefined;

  console.log(`start convert:webp (artistId=${artistId ?? 'ALL'})`);

  const designsToDo = await prisma.design.count({
    where: {
      ...(artistId ? { artistId } : {}),
      OR: [
        { AND: [{ url: { not: '' } }, isMissing('urlWebp') as any] },
        { AND: [{ urlLogo: { not: '' } }, isMissing('urlLogoWebp') as any] },
      ],
    },
  });

  const groupsToDo = await prisma.group.count({
    where: {
      ...(artistId ? { artistId } : {}),
      AND: [{ urlImage: { not: '' } }, isMissing('urlImageWebp') as any],
    },
  });

  console.log(`to process → designs=${designsToDo}, groups=${groupsToDo}`);
  if (designsToDo === 0 && groupsToDo === 0) {
    console.log('nothing to do');
  }

  // 1) GROUPS FIRST (convert once, then propagate to designs)
  let cursorG: number | undefined;
  for (;;) {
    const batch = await prisma.group.findMany({
      where: {
        ...(artistId ? { artistId } : {}),
        AND: [{ urlImage: { not: '' } }],
      },
      orderBy: { id: 'asc' },
      take: 200,
      ...(cursorG ? { skip: 1, cursor: { id: cursorG } } : {}),
    });
    if (!batch.length) break;
    await Promise.all(batch.map((g) => limit(() => processGroup(g))));
    cursorG = batch[batch.length - 1].id;
  }

  // 2) DESIGNS (finish anything still missing)
  let cursorD: number | undefined;
  for (;;) {
    const batch = await prisma.design.findMany({
      where: {
        ...(artistId ? { artistId } : {}),
        OR: [
          { AND: [{ url: { not: '' } }, isMissing('urlWebp') as any] },
          { AND: [{ urlLogo: { not: '' } }, isMissing('urlLogoWebp') as any] },
        ],
      },
      orderBy: { id: 'asc' },
      take: 200,
      ...(cursorD ? { skip: 1, cursor: { id: cursorD } } : {}),
    });
    if (!batch.length) break;
    await Promise.all(batch.map((d) => limit(() => processDesign(d))));
    cursorD = batch[batch.length - 1].id;
  }

  console.log(
    `done. updated → designs=${designUpdated}, groups=${groupUpdated}, propagated_design_logos=${designLogoPropagated}`
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect().finally(() => process.exit(1));
});
