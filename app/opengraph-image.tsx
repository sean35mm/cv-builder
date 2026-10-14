import { ImageResponse } from 'next/og';
import { SITE_TITLE } from '@/lib/site';

export const alt = SITE_TITLE;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const PAPER = '#f7f5f0';
const INK = '#1b1a17';
const ROSE = '#a23a4c';

const CARDS = [
  {
    name: 'Amara Obi',
    title: 'Architect',
    accent: '#3d6a44',
    background: '#fafbf8',
    left: 650,
    top: 120,
    rotate: -7,
  },
  {
    name: 'Ken Ito',
    title: 'Product designer',
    accent: '#82b2f1',
    background: '#171b21',
    left: 880,
    top: 110,
    rotate: 8,
  },
  {
    name: 'Noor Haddad',
    title: 'Staff software engineer',
    accent: ROSE,
    background: '#fdfafa',
    left: 765,
    top: 90,
    rotate: 0,
  },
];

const SERIF_TEXT = `Your work, at one address.${CARDS.map((card) => card.name + card.title).join('')}`;

// Satori needs TrueType, which Google Fonts serves when no browser user agent
// is sent. If the fetch fails the image falls back to the default font.
async function loadNewsreader(italic: boolean): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@${italic ? 1 : 0},72,400&text=${encodeURIComponent(SERIF_TEXT)}`
    ).then((response) => response.text());
    const url = css.match(/src: url\((.+?)\) format\('truetype'\)/)?.[1];
    return url
      ? await fetch(url).then((response) => response.arrayBuffer())
      : null;
  } catch {
    return null;
  }
}

function Card({ card }: { card: (typeof CARDS)[number] }) {
  const dark = card.background === '#171b21';
  const line = dark ? '#2a303a' : '#ebe6df';
  return (
    <div
      style={{
        position: 'absolute',
        left: card.left,
        top: card.top,
        width: 300,
        height: 400,
        display: 'flex',
        flexDirection: 'column',
        padding: 28,
        borderRadius: 18,
        background: card.background,
        color: dark ? '#e8ebf0' : INK,
        transform: `rotate(${card.rotate}deg)`,
        boxShadow: '0 30px 60px -20px rgba(40,30,20,0.35)',
        border: `1px solid ${dark ? '#262b33' : '#e9e3d9'}`,
      }}
    >
      <div style={{ fontFamily: 'Newsreader', fontSize: 34 }}>{card.name}</div>
      <div
        style={{
          fontFamily: 'Newsreader Italic',
          fontSize: 18,
          color: card.accent,
          marginTop: 4,
        }}
      >
        {card.title}
      </div>
      <div
        style={{
          width: 70,
          height: 6,
          borderRadius: 3,
          background: card.accent,
          opacity: 0.6,
          marginTop: 30,
        }}
      />
      {[100, 92, 70, 100, 84, 60].map((width, index) => (
        <div
          key={index}
          style={{
            width: `${width}%`,
            height: 8,
            borderRadius: 4,
            background: line,
            marginTop: index === 3 ? 30 : 14,
          }}
        />
      ))}
    </div>
  );
}

export default async function OpengraphImage() {
  const [regular, italic] = await Promise.all([
    loadNewsreader(false),
    loadNewsreader(true),
  ]);
  const fonts = [
    ...(regular
      ? [{ name: 'Newsreader', data: regular, weight: 400 as const }]
      : []),
    ...(italic
      ? [{ name: 'Newsreader Italic', data: italic, weight: 400 as const }]
      : []),
  ];

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        background: PAPER,
        backgroundImage:
          'radial-gradient(circle at 85% 20%, rgba(162,58,76,0.16), rgba(247,245,240,0) 55%), radial-gradient(circle at 70% 90%, rgba(61,106,68,0.14), rgba(247,245,240,0) 45%)',
        color: INK,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 72px',
          width: 680,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 20,
            letterSpacing: 3,
            color: '#8a5a2b',
          }}
        >
          <div
            style={{
              width: 36,
              height: 2,
              background: '#8a5a2b',
              marginRight: 14,
            }}
          />
          A CV THAT LIVES AT A LINK
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'Newsreader',
            fontSize: 84,
            lineHeight: 0.95,
            letterSpacing: -4,
            marginTop: 28,
          }}
        >
          <div>Your work,</div>
          <div style={{ display: 'flex' }}>
            <span style={{ marginRight: 22 }}>at</span>
            <span style={{ fontFamily: 'Newsreader Italic', color: ROSE }}>
              one
            </span>
            <span style={{ marginLeft: 24 }}>address.</span>
          </div>
        </div>
        <div style={{ fontSize: 26, color: '#5b574f', marginTop: 40 }}>
          opencv.app · free
        </div>
      </div>
      {CARDS.map((card) => (
        <Card key={card.name} card={card} />
      ))}
    </div>,
    { ...size, fonts }
  );
}
