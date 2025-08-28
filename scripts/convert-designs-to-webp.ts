#!/usr/bin/env ts-node
import 'dotenv/config';
import http from 'http';
import https from 'https';
import sharp from 'sharp';
import pLimit from 'p-limit';
import { PrismaClient, Design, Group } from '@prisma/client';
import type S3 from 'aws-sdk/clients/s3';
import { connectionAws } from '../src/utils/configAws';

const prisma = new PrismaClient();
const s3: S3 = connectionAws() as S3;

const CONCURRENCY = Number(process.env.CONCURRENCY || 5);
const WEBP_QUALITY = Number(process.env.WEBP_QUALITY || 82);
const LOGO_LOSSLESS = String(process.env.WEBP_LOGO_LOSSLESS || 'true') === 'true';
const LOGO_QUALITY = Number(process.env.WEBP_LOGO_QUALITY || 90);
const MAX_W = Number(process.env.WEBP_MAX_W || 3000);
const MAX_H = Number(process.env.WEBP_MAX_H || 3000);
const PUBLIC_READ = process.env.S3_PUBLIC_READ === 'true';

const limit = pLimit(CONCURRENCY);

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
    // keep '+' as literal; decode %xx sequences
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

      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
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
    ...(PUBLIC_READ ? { ACL: 'public-read' as any } : {}), // optional
  };

  const out: any = await (s3 as any).upload(params).promise();
  // out.Location is the exact, working URL (region-correct)
  return out?.Location || null;
}

// main converter: source = URL, upload = S3.upload, return Location
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

  // if the bytes are already webp, just re-upload them with `.webp` key (no recompression)
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

let designUpdated = 0;
let groupUpdated = 0;

async function processDesign(d: Design) {
  const updates: Partial<Design> = {};

  // main image
  if (isEmpty(d.url)) {
    logSkip('Design', d.id, 'main: empty url');
  } else if (d.urlWebp) {
    logSkip('Design', d.id, 'main: urlWebp already set');
  } else {
    if (isWebpUrl(d.url)) {
      updates.urlWebp = d.url; // already webp, just store it
      console.log(`Design ${d.id}: main already .webp (saved without converting)`);
    } else {
      const url = await convertUrlToWebp(d.url, { quality: WEBP_QUALITY, effort: 4 });
      if (!url) logSkip('Design', d.id, 'main: fetch/upload failed');
      else updates.urlWebp = url;
    }
  }

  // logo / overlay
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

  await prisma.design.update({ where: { id: d.id }, data: updates });
  designUpdated++;
  console.log(`Design ${d.id}: updated`);
}

async function processGroup(g: Group) {
  if (isEmpty(g.urlImage)) {
    logSkip('Group', g.id, 'image: empty url');
    return;
  }
  if (g.urlImageWebp) {
    logSkip('Group', g.id, 'image: urlImageWebp already set');
    return;
  }

  if (isWebpUrl(g.urlImage)) {
    await prisma.group.update({ where: { id: g.id }, data: { urlImageWebp: g.urlImage } });
    groupUpdated++;
    console.log(`Group ${g.id}: image already .webp (saved without converting)`);
    return;
  }

  const url = await convertUrlToWebp(g.urlImage, { quality: WEBP_QUALITY, effort: 4 });
  if (!url) {
    logSkip('Group', g.id, 'image: fetch/upload failed');
    return;
  }

  await prisma.group.update({ where: { id: g.id }, data: { urlImageWebp: url } });
  groupUpdated++;
  console.log(`Group ${g.id}: converted`);
}

const isMissing = (field: 'urlWebp' | 'urlLogoWebp' | 'urlImageWebp') => ({
  OR: [{ [field]: null as any }, { [field]: '' as any }],
});

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

  // Designs
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

  // Groups
  let cursorG: number | undefined;
  for (;;) {
    const batch = await prisma.group.findMany({
      where: {
        ...(artistId ? { artistId } : {}),
        AND: [{ urlImage: { not: '' } }, isMissing('urlImageWebp') as any],
      },
      orderBy: { id: 'asc' },
      take: 200,
      ...(cursorG ? { skip: 1, cursor: { id: cursorG } } : {}),
    });
    if (!batch.length) break;
    await Promise.all(batch.map((g) => limit(() => processGroup(g))));
    cursorG = batch[batch.length - 1].id;
  }

  console.log(`done. updated → designs=${designUpdated}, groups=${groupUpdated}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect().finally(() => process.exit(1));
});
