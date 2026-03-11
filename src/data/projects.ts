import buildcard from "../assets/projects/buildcard.png";
import una_exam from "../assets/projects/una-exam.png";
import starrail_manager from "../assets/projects/starrail-manager.png";
import rua_bot from "../assets/projects/rua-bot.png";
import minicraft from "../assets/projects/minicraft.png";
import wep_to_png from "../assets/projects/webp-to-png.png";
import textloid from "../assets/projects/textloid.png";

export const projects = [
  {
    slug: "buildcard",
    title: "ビルドカード生成機",
    image: buildcard,
    description: "崩壊: スターレイルのビルドカードを生成できるツールです。",
    links: [
      {
        href: "https://hsr.hoyoverse.com/ja-jp/home",
        label: "崩壊スターレイル",
      },
      {
        href: "https://str-buildcard.vercel.app/",
        label: "ビルドカード生成機",
      },
      {
        href: "https://zenn.dev/shicoku/articles/26805d5a1ef715",
        label: "制作記事",
      },
    ],
  },
  {
    slug: "una-exam",
    title: "音街ウナ総合学力試験",
    image: una_exam,
    description:
      "響立うなうな学院 で主催している試験イベントの公式サイトです。",
    links: [
      {
        href: "https://discord.gg/Xh3mJ4AFgc",
        label: "響立うなうな学院",
      },
      {
        href: "https://una-exam.vercel.app/",
        label: "音街ウナ総合学力試験",
      },
    ],
  },
  {
    slug: "starrail-manager",
    title: "StarRail Manager",
    image: starrail_manager,
    description: "崩壊: スターレイル のデータを取得できる NPM パッケージです。",
    links: [
      {
        href: "https://hsr.hoyoverse.com/ja-jp/home",
        label: "崩壊スターレイル",
      },
      {
        href: "https://www.npmjs.com/package/starrail-manager",
        label: "StarRail Manager",
      },
    ],
  },
  {
    slug: "rua-bot",
    title: "学生証生成 BOT",
    image: rua_bot,
    description: "響立うなうな学院 のために作った学生証を生成する BOT です。",
    links: [
      {
        href: "https://discord.gg/Xh3mJ4AFgc",
        label: "響立うなうな学院",
      },
    ],
  },
  {
    slug: "minicraft",
    title: "minicraft",
    image: minicraft,
    description: "私が所属しているグループ minicraft の公式サイトです。",
    links: [
      {
        href: "https://mini-craft.vercel.app/",
        label: "minicraft",
      },
    ],
  },
  {
    slug: "webp-to-png",
    title: "Webp to Png",
    image: wep_to_png,
    description: "Webp 形式の画像を Png 形式の画像に変換するツールです。",
    links: [
      {
        href: "https://github.com/Shicoku/webp-to-png",
        label: "Webp to Png",
      },
    ],
  },
  {
    slug: "textloid",
    title: "textloid",
    image: textloid,
    description: "VOICEROID で複数のファイルを一気に保存できるツールです。",
    links: [
      {
        href: "https://github.com/Shicoku/TextLoid",
        label: "textloid",
      },
    ],
  },
];
