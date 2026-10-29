import { createServer } from "node:http";
import { access, readFile, readdir, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { extname, join } from "node:path";

const root = process.cwd();
const dataFile = join(root, "src", "data", "projects.json");
const imagesDir = join(root, "src", "assets", "projects");
const port = Number(process.env.PROJECT_EDITOR_PORT || 4178);
const html = String.raw`<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Projects 管理</title>
<style>
:root{color-scheme:dark;font:16px/1.5 system-ui,sans-serif;background:#101923;color:#eef4fa}*{box-sizing:border-box}body{margin:0}header{padding:22px max(24px,calc((100vw - 1180px)/2));background:#172536;border-bottom:1px solid #2a3b4e;display:flex;justify-content:space-between;align-items:center}h1{font-size:21px;margin:0}header p{margin:3px 0 0;color:#aab9c9;font-size:13px}.status{color:#aab9c9;font-size:13px}main{max-width:1180px;margin:28px auto;padding:0 24px;display:grid;grid-template-columns:310px minmax(0,1fr);gap:24px}.panel{background:#172536;border:1px solid #2a3b4e;border-radius:14px;padding:20px}.panel h2{margin:0 0 16px;font-size:17px}.list{display:grid;gap:9px}.item{display:flex;gap:10px;align-items:center;border:1px solid #33475e;background:#1c2d41;border-radius:10px;padding:8px;text-align:left;color:inherit;width:100%;cursor:pointer}.item.selected{border-color:#72a9e5;box-shadow:0 0 0 1px #72a9e5}.item img{width:64px;height:36px;object-fit:cover;border-radius:6px}.item span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.actions{display:flex;gap:8px;margin-top:14px}button,.file-button{font:inherit;border:0;border-radius:8px;background:#345a80;color:white;padding:9px 13px;cursor:pointer}button:hover,.file-button:hover{background:#4273a4}button.secondary{background:#293c51}button.danger{background:#793f48}button.small{padding:7px 10px}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:15px}.field{display:flex;flex-direction:column;gap:6px}.field.full{grid-column:1/-1}label{font-size:13px;color:#c1cfdd}input,textarea,select{font:inherit;color:#eef4fa;background:#101923;border:1px solid #40566e;border-radius:8px;padding:10px;width:100%}textarea{min-height:110px;resize:vertical}.help{font-size:12px;color:#91a3b6}.image-row{display:flex;gap:12px;align-items:center}.preview{width:160px;height:90px;object-fit:cover;border-radius:8px;background:#101923;border:1px solid #40566e}.file-button{display:inline-block}.file-button input{display:none}.form-actions{display:flex;gap:10px;margin-top:20px}.links-help{margin:0}.empty{color:#9fb0c1;padding:14px}.order{display:flex;gap:6px;margin-left:auto}.notice{min-height:22px;color:#98d5aa;font-size:13px;margin-top:12px}.notice.error{color:#ff9b9b}@media(max-width:760px){main{grid-template-columns:1fr;margin-top:15px;padding:0 14px}.form-grid{grid-template-columns:1fr}.field.full{grid-column:auto}header{padding:18px 16px}}
</style></head><body><header><div><h1>Projects 管理</h1><p>作品の内容や表示順をブラウザから編集できます</p></div><div id="status" class="status">読み込み中…</div></header>
<main><aside class="panel"><h2>登録済みの作品</h2><div id="list" class="list"></div><div class="actions"><button id="new">＋ 新しい作品</button><button id="up" class="secondary small" title="上へ">↑</button><button id="down" class="secondary small" title="下へ">↓</button></div></aside>
<section class="panel"><h2 id="formTitle">作品を選択</h2><form id="form"><div class="form-grid">
<div class="field"><label for="slug">URL の末尾 (slug)</label><input id="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="my-project"><span class="help">/projects/my-project に使われます</span></div>
<div class="field"><label for="title">作品名</label><input id="title" required></div>
<div class="field full"><label for="description">説明</label><textarea id="description" required></textarea></div>
<div class="field full"><label>サムネイル画像</label><div class="image-row"><img id="preview" class="preview" alt="画像プレビュー"><div><select id="image"></select><label class="file-button">画像を追加<input id="upload" type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/gif"></label><div class="help">画像は中央を 16:9 に切り抜き、1024 × 576 px の PNG にそろえます。</div></div></div></div>
<div class="field full"><label for="links">リンク (1 行に「ラベル | URL」)</label><textarea id="links" placeholder="公式サイト | https://example.com"></textarea><span class="help">外部リンクを1行ずつ入力します。URL は https:// または http:// で始めてください。</span></div></div>
<div class="form-actions"><button id="save" type="submit">保存</button><button id="delete" type="button" class="danger">この作品を削除</button></div><div id="notice" class="notice" role="status"></div></form></section></main>
<script>
const $=id=>document.getElementById(id);let projects=[],selected=-1,images=[];
async function request(url,options){const r=await fetch(url,options);const body=await r.json();if(!r.ok)throw Error(body.error||'処理に失敗しました');return body}
function say(text,error=false){$('notice').textContent=text;$('notice').classList.toggle('error',error)}
function draw(){const list=$('list');list.innerHTML='';projects.forEach((p,i)=>{const b=document.createElement('button');b.className='item'+(i===selected?' selected':'');b.innerHTML='<img src="/image/'+encodeURIComponent(p.image)+'" alt=""><span></span>';b.querySelector('span').textContent=p.title;b.onclick=()=>select(i);list.append(b)});$('status').textContent=projects.length+' 件';$('up').disabled=selected<=0;$('down').disabled=selected<0||selected>=projects.length-1;$('delete').hidden=selected<0}
function select(i){selected=i;const p=projects[i];$('formTitle').textContent='作品を編集';$('slug').value=p.slug;$('title').value=p.title;$('description').value=p.description;$('image').value=p.image;$('links').value=p.links.map(l=>l.label+' | '+l.href).join('\n');$('slug').disabled=false;say('');draw();preview()}
function preview(){$('preview').src=$('image').value?'/image/'+encodeURIComponent($('image').value):''}
function fresh(){selected=-1;$('formTitle').textContent='新しい作品';$('form').reset();$('slug').disabled=false;$('image').value=images[0]||'';$('delete').hidden=true;say('');draw();preview();$('slug').focus()}
async function load(){const d=await request('/api/projects');projects=d.projects;images=d.images;$('image').innerHTML=images.map(x=>'<option></option>').join('');[...$('image').options].forEach((o,i)=>o.value=o.textContent=images[i]);if(projects.length)select(0);else fresh();draw()}
$('new').onclick=fresh;$('image').onchange=preview;
$('up').onclick=()=>move(-1);$('down').onclick=()=>move(1);function move(step){if(selected<0)return;const next=selected+step;[projects[selected],projects[next]]=[projects[next],projects[selected]];selected=next;draw()}
async function cropToThumbnail(file){const source=await createImageBitmap(file);const ratio=16/9;let sx=0,sy=0,sw=source.width,sh=source.height;if(sw/sh>ratio){sw=sh*ratio;sx=(source.width-sw)/2}else{sh=sw/ratio;sy=(source.height-sh)/2}const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=576;canvas.getContext('2d').drawImage(source,sx,sy,sw,sh,0,0,1024,576);source.close();return await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('画像を変換できませんでした。')),'image/png'))}
$('upload').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{say('画像を 16:9 に調整しています…');const thumbnail=await cropToThumbnail(file);const name=file.name.replace(/\.[^.]+$/,'')+'-thumbnail.png';const r=await request('/api/images?name='+encodeURIComponent(name),{method:'POST',headers:{'Content-Type':'image/png'},body:thumbnail});images.push(r.image);const o=document.createElement('option');o.value=o.textContent=r.image;$('image').append(o);$('image').value=r.image;preview();say('画像を追加しました。中央を 16:9 に切り抜き、1024 × 576 px に調整しました。')}catch(err){say(err.message,true)}e.target.value=''};
$('form').onsubmit=async e=>{e.preventDefault();try{const links=$('links').value.split('\n').map(x=>x.trim()).filter(Boolean).map((line,n)=>{const i=line.indexOf('|');if(i<1)throw Error((n+1)+' 行目: ラベル | URL の形式で入力してください');return{label:line.slice(0,i).trim(),href:line.slice(i+1).trim()}});const entry={slug:$('slug').value.trim(),title:$('title').value.trim(),image:$('image').value,description:$('description').value.trim(),links};const next=projects.slice();if(selected<0)next.push(entry);else next[selected]=entry;const r=await request('/api/projects',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(next)});projects=r.projects;images=r.images;selected=projects.findIndex(p=>p.slug===entry.slug);select(selected);say('保存しました。')}catch(err){say(err.message,true)}};
$('delete').onclick=async()=>{if(selected<0)return;const name=projects[selected].title;if(!confirm('「'+name+'」を一覧から削除しますか？'))return;projects.splice(selected,1);try{const r=await request('/api/projects',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(projects)});projects=r.projects;selected=projects.length?Math.min(selected,projects.length-1):-1;if(selected>=0)select(selected);else fresh();say('削除しました。')}catch(err){say(err.message,true)}};
load().catch(e=>{$('status').textContent='読み込みエラー';say(e.message,true)});
</script></body></html>`;

async function json(res, status, value) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(value));
}

async function readProjects() {
  return JSON.parse(await readFile(dataFile, "utf8"));
}

function validateProjects(value, imageNames) {
  if (!Array.isArray(value))
    throw new Error("データの形式が正しくありません。");
  const slugs = new Set();
  for (const [index, p] of value.entries()) {
    if (!p || typeof p !== "object")
      throw new Error(`${index + 1} 件目のデータが不正です。`);
    if (
      typeof p.slug !== "string" ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug)
    )
      throw new Error(`${index + 1} 件目の URL の末尾が不正です。`);
    if (slugs.has(p.slug))
      throw new Error(`URL の末尾「${p.slug}」が重複しています。`);
    slugs.add(p.slug);
    if (
      typeof p.title !== "string" ||
      !p.title.trim() ||
      typeof p.description !== "string" ||
      !p.description.trim()
    )
      throw new Error(`${index + 1} 件目の作品名と説明を入力してください。`);
    if (typeof p.image !== "string" || !imageNames.includes(p.image))
      throw new Error(`${index + 1} 件目の画像を選択してください。`);
    if (!Array.isArray(p.links))
      throw new Error(`${index + 1} 件目のリンク形式が不正です。`);
    for (const link of p.links) {
      let url;
      try {
        url = new URL(link.href);
      } catch {
        throw new Error(`${index + 1} 件目のリンク URL が不正です。`);
      }
      if (!link.label?.trim() || !["http:", "https:"].includes(url.protocol))
        throw new Error(
          `${index + 1} 件目のリンクにはラベルと http(s) URL が必要です。`,
        );
    }
  }
  return value;
}

const server = createServer(async (req, res) => {
  try {
    const host = req.headers.host || "";
    if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host))
      return json(res, 403, { error: "ローカルからのみ利用できます。" });
    const url = new URL(req.url, `http://${host}`);
    if (req.method === "GET" && url.pathname === "/") {
      res.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      });
      return res.end(html);
    }
    if (req.method === "GET" && url.pathname === "/api/projects") {
      const [projects, images] = await Promise.all([
        readProjects(),
        readdir(imagesDir),
      ]);
      return json(res, 200, {
        projects,
        images: images
          .filter((n) => /\.(png|jpe?g|webp|avif|gif)$/i.test(n))
          .sort(),
      });
    }
    if (req.method === "GET" && url.pathname.startsWith("/image/")) {
      const name = decodeURIComponent(url.pathname.slice(7));
      if (name !== name.split(/[\\/]/).pop())
        return json(res, 400, { error: "画像名が不正です。" });
      const path = join(imagesDir, name);
      await access(path, constants.R_OK);
      const ext = extname(name).toLowerCase();
      res.writeHead(200, {
        "content-type":
          {
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".webp": "image/webp",
            ".avif": "image/avif",
            ".gif": "image/gif",
          }[ext] || "application/octet-stream",
        "cache-control": "no-store",
      });
      return res.end(await readFile(path));
    }
    if (req.method === "POST" && url.pathname === "/api/images") {
      const original = url.searchParams.get("name") || "";
      const ext = extname(original).toLowerCase();
      const allowed = new Set([
        ".png",
        ".jpg",
        ".jpeg",
        ".webp",
        ".avif",
        ".gif",
      ]);
      if (!allowed.has(ext))
        return json(res, 400, {
          error: "対応している画像形式を選択してください。",
        });
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 10 * 1024 * 1024)
          return json(res, 413, { error: "画像は10MB以下にしてください。" });
        chunks.push(chunk);
      }
      if (!size)
        return json(res, 400, {
          error: "画像ファイルを読み込めませんでした。",
        });
      const base = (
        original
          .slice(0, original.length - ext.length)
          .normalize("NFKC")
          .replace(/[^a-zA-Z0-9_-]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .toLowerCase() || "project-image"
      ).slice(0, 60);
      let name = `${base}${ext}`,
        suffix = 2;
      while (true) {
        try {
          await access(join(imagesDir, name));
          name = `${base}-${suffix++}${ext}`;
        } catch {
          break;
        }
      }
      await writeFile(join(imagesDir, name), Buffer.concat(chunks), {
        flag: "wx",
      });
      return json(res, 201, { image: name });
    }
    if (req.method === "POST" && url.pathname === "/api/projects") {
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 1024 * 1024)
          return json(res, 413, { error: "データが大きすぎます。" });
        chunks.push(chunk);
      }
      const images = await readdir(imagesDir);
      const value = validateProjects(
        JSON.parse(Buffer.concat(chunks).toString("utf8")),
        images,
      );
      await writeFile(dataFile, `${JSON.stringify(value, null, 2)}\n`, "utf8");
      return json(res, 200, {
        projects: value,
        images: images
          .filter((n) => /\.(png|jpe?g|webp|avif|gif)$/i.test(n))
          .sort(),
      });
    }
    return json(res, 404, { error: "ページが見つかりません。" });
  } catch (error) {
    return json(res, 400, {
      error: error instanceof Error ? error.message : "処理に失敗しました。",
    });
  }
});

server.listen(port, "127.0.0.1", () => {
  const address = `http://127.0.0.1:${port}`;
  console.log(`Projects 管理ツール: ${address}`);
  console.log("終了するには Ctrl+C を押してください。");
  import("node:child_process").then(({ exec }) => {
    const command =
      process.platform === "win32"
        ? `start "" "${address}"`
        : process.platform === "darwin"
          ? `open "${address}"`
          : `xdg-open "${address}"`;
    exec(command);
  });
});
