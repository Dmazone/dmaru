import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Volume2, Share2, Download, Instagram, ChevronDown,
  BookOpen, MessageCircle, Lock, Star, Zap, Check,
  Globe, ArrowRight, X, Crown, Mic, MicOff, Keyboard,
  LogOut, Users, Plus, Send, Hash, User
} from 'lucide-react'
import { signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider } from 'firebase/auth'
import {
  collection, addDoc, onSnapshot, query, orderBy, where,
  serverTimestamp, doc, setDoc, getDocs, getDoc
} from 'firebase/firestore'
import { auth, googleProvider, db } from './firebase/config'

// ─── 지원 언어 ───────────────────────────────────────────────
const LANGUAGES = [
  { code: 'ko', label: '한국어', flag: '🇰🇷', native: '한국어' },
  { code: 'en', label: 'English', flag: '🇺🇸', native: 'English' },
  { code: 'ja', label: '日本語', flag: '🇯🇵', native: '日本語' },
  { code: 'th', label: 'ภาษาไทย', flag: '🇹🇭', native: 'ภาษาไทย' },
  { code: 'zh', label: '廣東話', flag: '🇭🇰', native: '廣東話' },
  { code: 'es', label: 'Español', flag: '🇪🇸', native: 'Español' },
]

// ─── 다국어 UI 텍스트 ─────────────────────────────────────────
const I18N = {
  ko: {
    greeting: '안녕하세요! 메인으로 사용하는 언어를 알려주세요.',
    selectPlaceholder: '언어 선택', confirm: '시작하기', warn: '언어를 선택해주세요!',
    learn: '외국어 공부하기', learnSub: '매일 10분, 네이티브처럼',
    translate: '외국인과 대화하기', translateSub: '실시간 3단 번역 킬러 기능',
    chatRoom: '번역 채팅방', chatRoomSub: '번역하며 실시간 대화',
    inputPlaceholder: '번역할 내용을 입력하세요...', voicePlaceholder: '번역할 내용을 말해보세요...',
    proLabel: 'PRO 전용', proTitle: '다른 앱 위에서 실시간 번역',
    proDesc: '카카오톡, 라인 위에 1줄 투명 번역 바가 뜹니다', proBtn: 'PRO 구독하기',
    adLabel: '광고', save: '저장', share: '공유',
    daily: '오늘의 학습', streak: '연속 학습', days: '일째',
    todayPhrase: '오늘의 회화', todayGrammar: '오늘의 문법', listen: '네이티브 발음 듣기', back: '뒤로',
    tapToSpeak: '탭하여 말하기', listening: '듣는 중...', processing: '변환 중...',
    voiceMode: '음성', textMode: '키보드',
    loginWith: 'Google로 시작하기', loginDesc: '로그인하면 채팅방 기능을 사용할 수 있어요',
    logout: '로그아웃', myRooms: '내 채팅방', newRoom: '방 만들기',
    roomName: '방 이름', createRoom: '생성', cancel: '취소',
    enterRoom: '입장', noRooms: '아직 채팅방이 없어요.\n새 방을 만들어보세요!',
    chatPlaceholder: '메시지를 입력하세요...', sendBtn: '전송',
    translating: '번역 중...', members: '명',
    roomNamePlaceholder: '방 이름을 입력하세요',
    joinRoom: '코드로 참여', joinPlaceholder: '6자리 초대 코드 입력',
    joinBtn: '참여', inviteCode: '초대 코드', copyCode: '복사', copied: '복사됨!',
    roomNotFound: '해당 코드의 방을 찾을 수 없어요.',
  },
  en: {
    greeting: 'Hello! Please select your main language.',
    selectPlaceholder: 'Select language', confirm: 'Get Started', warn: 'Please select a language!',
    learn: 'Learn a Language', learnSub: '10 minutes a day, speak like a native',
    translate: 'Talk to Foreigners', translateSub: 'Real-time 3-way live translation',
    chatRoom: 'Translation Chat', chatRoomSub: 'Chat with live translation',
    inputPlaceholder: 'Type something to translate...', voicePlaceholder: 'Say something to translate...',
    proLabel: 'PRO Only', proTitle: 'Translate Over Any App',
    proDesc: 'A 1-line transparent translation bar floats on top of any app', proBtn: 'Get PRO',
    adLabel: 'Ad', save: 'Save', share: 'Share',
    daily: 'Daily Study', streak: 'Streak', days: ' days',
    todayPhrase: "Today's Phrase", todayGrammar: "Today's Grammar", listen: 'Listen (Native)', back: 'Back',
    tapToSpeak: 'Tap to speak', listening: 'Listening...', processing: 'Processing...',
    voiceMode: 'Voice', textMode: 'Type',
    loginWith: 'Start with Google', loginDesc: 'Sign in to access chat rooms',
    logout: 'Sign Out', myRooms: 'My Rooms', newRoom: 'New Room',
    roomName: 'Room Name', createRoom: 'Create', cancel: 'Cancel',
    enterRoom: 'Enter', noRooms: 'No rooms yet.\nCreate a new room!',
    chatPlaceholder: 'Type a message...', sendBtn: 'Send',
    translating: 'Translating...', members: ' members',
    roomNamePlaceholder: 'Enter room name',
    joinRoom: 'Join by Code', joinPlaceholder: 'Enter 6-char invite code',
    joinBtn: 'Join', inviteCode: 'Invite Code', copyCode: 'Copy', copied: 'Copied!',
    roomNotFound: 'Room with that code not found.',
  },
  ja: {
    greeting: 'こんにちは！メインで使用する言語を教えてください。',
    selectPlaceholder: '言語を選択', confirm: 'はじめる', warn: '言語を選択してください！',
    learn: '外国語を学ぶ', learnSub: '毎日10分、ネイティブのように',
    translate: '外国人と話す', translateSub: 'リアルタイム3段翻訳',
    chatRoom: '翻訳チャット', chatRoomSub: 'リアルタイム翻訳でチャット',
    inputPlaceholder: '翻訳する内容を入力...', voicePlaceholder: '翻訳する内容を話してください...',
    proLabel: 'PRO限定', proTitle: 'どのアプリの上でもリアルタイム翻訳',
    proDesc: '他のアプリの上に1行の透明な翻訳バーが表示されます', proBtn: 'PROに登録',
    adLabel: '広告', save: '保存', share: 'シェア',
    daily: '今日の学習', streak: '連続学習', days: '日目',
    todayPhrase: '今日の会話', todayGrammar: '今日の文法', listen: 'ネイティブ発音を聴く', back: '戻る',
    tapToSpeak: 'タップして話す', listening: '聴いています...', processing: '変換中...',
    voiceMode: '音声', textMode: 'テキスト',
    loginWith: 'Googleで始める', loginDesc: 'ログインするとチャットルームが使えます',
    logout: 'ログアウト', myRooms: 'マイルーム', newRoom: '新規ルーム',
    roomName: 'ルーム名', createRoom: '作成', cancel: 'キャンセル',
    enterRoom: '入室', noRooms: 'まだルームがありません。\n新しく作ってみましょう！',
    chatPlaceholder: 'メッセージを入力...', sendBtn: '送信',
    translating: '翻訳中...', members: '名',
    roomNamePlaceholder: 'ルーム名を入力',
    joinRoom: 'コードで参加', joinPlaceholder: '6文字の招待コードを入力',
    joinBtn: '参加', inviteCode: '招待コード', copyCode: 'コピー', copied: 'コピー済み!',
    roomNotFound: 'そのコードのルームが見つかりません。',
  },
  th: {
    greeting: 'สวัสดี! กรุณาเลือกภาษาหลักของคุณ',
    selectPlaceholder: 'เลือกภาษา', confirm: 'เริ่มต้น', warn: 'กรุณาเลือกภาษา!',
    learn: 'เรียนภาษาต่างประเทศ', learnSub: '10 นาทีต่อวัน พูดเหมือนเจ้าของภาษา',
    translate: 'คุยกับชาวต่างชาติ', translateSub: 'แปลแบบเรียลไทม์ 3 ภาษา',
    chatRoom: 'แชทแปลภาษา', chatRoomSub: 'แชทพร้อมแปลแบบเรียลไทม์',
    inputPlaceholder: 'พิมพ์ข้อความที่ต้องการแปล...', voicePlaceholder: 'พูดเพื่อแปล...',
    proLabel: 'PRO เท่านั้น', proTitle: 'แปลบนทุกแอป',
    proDesc: 'แถบแปลโปร่งใส 1 บรรทัดลอยอยู่บนแอปอื่น', proBtn: 'สมัคร PRO',
    adLabel: 'โฆษณา', save: 'บันทึก', share: 'แชร์',
    daily: 'เรียนวันนี้', streak: 'เรียนต่อเนื่อง', days: ' วัน',
    todayPhrase: 'ประโยควันนี้', todayGrammar: 'ไวยากรณ์วันนี้', listen: 'ฟังสำเนียงเจ้าของภาษา', back: 'กลับ',
    tapToSpeak: 'แตะเพื่อพูด', listening: 'กำลังฟัง...', processing: 'กำลังแปลง...',
    voiceMode: 'เสียง', textMode: 'พิมพ์',
    loginWith: 'เริ่มด้วย Google', loginDesc: 'เข้าสู่ระบบเพื่อใช้ห้องแชท',
    logout: 'ออกจากระบบ', myRooms: 'ห้องของฉัน', newRoom: 'ห้องใหม่',
    roomName: 'ชื่อห้อง', createRoom: 'สร้าง', cancel: 'ยกเลิก',
    enterRoom: 'เข้าห้อง', noRooms: 'ยังไม่มีห้องแชท\nสร้างห้องใหม่เลย!',
    chatPlaceholder: 'พิมพ์ข้อความ...', sendBtn: 'ส่ง',
    translating: 'กำลังแปล...', members: ' คน',
    roomNamePlaceholder: 'ใส่ชื่อห้อง',
    joinRoom: 'เข้าด้วยโค้ด', joinPlaceholder: 'ใส่โค้ดเชิญ 6 ตัว',
    joinBtn: 'เข้าร่วม', inviteCode: 'โค้ดเชิญ', copyCode: 'คัดลอก', copied: 'คัดลอกแล้ว!',
    roomNotFound: 'ไม่พบห้องที่มีโค้ดนี้',
  },
  zh: {
    greeting: '你好！請選擇你常用嘅語言。',
    selectPlaceholder: '選擇語言', confirm: '開始', warn: '請選擇語言！',
    learn: '學外語', learnSub: '每日10分鐘，講嘢似本地人',
    translate: '同外國人傾偈', translateSub: '實時三語翻譯',
    chatRoom: '翻譯聊天室', chatRoomSub: '實時翻譯傾偈',
    inputPlaceholder: '輸入要翻譯嘅內容...', voicePlaceholder: '講嘢嚟翻譯...',
    proLabel: 'PRO專用', proTitle: '喺任何App上實時翻譯',
    proDesc: '一條透明翻譯條浮喺其他App上面', proBtn: '訂閱PRO',
    adLabel: '廣告', save: '儲存', share: '分享',
    daily: '今日學習', streak: '連續學習', days: '日',
    todayPhrase: '今日句子', todayGrammar: '今日文法', listen: '聽本地發音', back: '返回',
    tapToSpeak: '點擊講嘢', listening: '聽緊...', processing: '轉換中...',
    voiceMode: '語音', textMode: '打字',
    loginWith: '用Google開始', loginDesc: '登入即可使用聊天室',
    logout: '登出', myRooms: '我嘅房間', newRoom: '新房間',
    roomName: '房間名', createRoom: '建立', cancel: '取消',
    enterRoom: '入房', noRooms: '仲未有聊天室\n立即建立新房間！',
    chatPlaceholder: '輸入訊息...', sendBtn: '發送',
    translating: '翻譯中...', members: '人',
    roomNamePlaceholder: '輸入房間名',
    joinRoom: '用代碼加入', joinPlaceholder: '輸入6位邀請碼',
    joinBtn: '加入', inviteCode: '邀請碼', copyCode: '複製', copied: '已複製!',
    roomNotFound: '找唔到呢個代碼嘅房間。',
  },
  es: {
    greeting: '¡Hola! ¿Cuál es tu idioma principal?',
    selectPlaceholder: 'Seleccionar idioma', confirm: 'Comenzar', warn: '¡Por favor selecciona un idioma!',
    learn: 'Aprender Idiomas', learnSub: '10 minutos al día, habla como nativo',
    translate: 'Hablar con Extranjeros', translateSub: 'Traducción triple en tiempo real',
    chatRoom: 'Chat de Traducción', chatRoomSub: 'Chatea con traducción en vivo',
    inputPlaceholder: 'Escribe para traducir...', voicePlaceholder: 'Habla para traducir...',
    proLabel: 'Solo PRO', proTitle: 'Traduce sobre cualquier app',
    proDesc: 'Una barra de traducción flotante de 1 línea sobre cualquier app', proBtn: 'Obtener PRO',
    adLabel: 'Anuncio', save: 'Guardar', share: 'Compartir',
    daily: 'Estudio diario', streak: 'Racha', days: ' días',
    todayPhrase: 'Frase del día', todayGrammar: 'Gramática del día', listen: 'Escuchar (nativo)', back: 'Volver',
    tapToSpeak: 'Toca para hablar', listening: 'Escuchando...', processing: 'Procesando...',
    voiceMode: 'Voz', textMode: 'Texto',
    loginWith: 'Empezar con Google', loginDesc: 'Inicia sesión para acceder a salas de chat',
    logout: 'Cerrar sesión', myRooms: 'Mis salas', newRoom: 'Nueva sala',
    roomName: 'Nombre de sala', createRoom: 'Crear', cancel: 'Cancelar',
    enterRoom: 'Entrar', noRooms: 'Aún no hay salas.\n¡Crea una nueva sala!',
    chatPlaceholder: 'Escribe un mensaje...', sendBtn: 'Enviar',
    translating: 'Traduciendo...', members: ' miembros',
    roomNamePlaceholder: 'Ingresa el nombre de la sala',
    joinRoom: 'Unirse con código', joinPlaceholder: 'Ingresa código de 6 caracteres',
    joinBtn: 'Unirse', inviteCode: 'Código de invitación', copyCode: 'Copiar', copied: '¡Copiado!',
    roomNotFound: 'No se encontró sala con ese código.',
  },
}

// ─── Mock 번역 데이터 ──────────────────────────────────────────
const MOCK_TRANSLATIONS = {
  ko: { en: 'Hello, how much is this?', ja: 'これはいくらですか？', th: 'ราคาเท่าไหร่ครับ', zh: '呢個幾錢？', es: '¿Cuánto cuesta esto?' },
  en: { ko: '이거 얼마예요?', ja: 'これはいくらですか？', th: 'ราคาเท่าไหร่', zh: '呢個幾錢？', es: '¿Cuánto cuesta esto?' },
  ja: { ko: '이거 얼마예요?', en: 'How much is this?', th: 'ราคาเท่าไหร่', zh: '呢個幾錢？', es: '¿Cuánto cuesta esto?' },
  th: { ko: '이거 얼마예요?', en: 'How much is this?', ja: 'これはいくらですか？', zh: '呢個幾錢？', es: '¿Cuánto cuesta esto?' },
  zh: { ko: '이거 얼마예요?', en: 'How much is this?', ja: 'これはいくらですか？', th: 'ราคาเท่าไหร่', es: '¿Cuánto cuesta esto?' },
  es: { ko: '이거 얼마예요?', en: 'How much is this?', ja: 'これはいくらですか？', th: 'ราคาเท่าไหร่', zh: '呢個幾錢？' },
}
const MOCK_STT = {
  ko: '이거 얼마예요?', en: 'How much is this?', ja: 'これはいくらですか？',
  th: 'ราคาเท่าไหร่ครับ', zh: '呢個幾錢？', es: '¿Cuánto cuesta esto?',
}

// ─── Google Cloud Translation API (월 500,000자 무료) ──────────
const GOOGLE_TRANSLATE_KEY = 'AIzaSyAp_-TVwzZ-n3M0MfaetV8t0JVTWfA34Yw'
// 언어 코드 매핑 (Google BCP-47)
const GOOGLE_LANG = { ko: 'ko', en: 'en', ja: 'ja', th: 'th', zh: 'zh-TW', es: 'es' }

async function translateText(text, fromLang, toLang) {
  if (!text.trim() || fromLang === toLang) return ''
  const src = GOOGLE_LANG[fromLang] || fromLang
  const tgt = GOOGLE_LANG[toLang] || toLang
  try {
    const res = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, source: src, target: tgt, format: 'text' }),
      }
    )
    const data = await res.json()
    return data.data?.translations?.[0]?.translatedText || ''
  } catch {
    return ''
  }
}

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}


function detectLocale() {
  const lang = navigator.language || navigator.languages?.[0] || 'en'
  const code = lang.split('-')[0].toLowerCase()
  const map = { ko: 'ko', en: 'en', ja: 'ja', th: 'th', zh: 'zh', yue: 'zh', es: 'es' }
  return map[code] || 'en'
}

async function fetchGoogleLocale(accessToken) {
  try {
    const res = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`)
    const data = await res.json()
    const raw = (data.locale || '').split('-')[0].toLowerCase()
    const map = { ko: 'ko', en: 'en', ja: 'ja', th: 'th', zh: 'zh', yue: 'zh', es: 'es' }
    return map[raw] || null
  } catch {
    return null
  }
}

// 언어 확인 모달 문구 (감지 언어로 표시)
const LANG_CONFIRM_MSGS = {
  ko: { source: 'Google 계정 언어를 감지했어요', q: '이게 메인 언어가 맞나요?', yes: '맞아요!', no: '다른 언어로 변경' },
  en: { source: 'Detected your Google account language', q: 'Is this your main language?', yes: 'Yes, that\'s right!', no: 'Change language' },
  ja: { source: 'Googleアカウントの言語を検出しました', q: 'これがメイン言語ですか？', yes: 'はい、そうです！', no: '言語を変更' },
  th: { source: 'ตรวจพบภาษาบัญชี Google ของคุณ', q: 'นี่คือภาษาหลักของคุณใช่ไหม?', yes: 'ใช่, ถูกต้อง!', no: 'เปลี่ยนภาษา' },
  zh: { source: '已偵測你嘅Google帳號語言', q: '呢個係你嘅主要語言嗎？', yes: '係！', no: '改語言' },
  es: { source: 'Detectamos el idioma de tu cuenta Google', q: '¿Es este tu idioma principal?', yes: '¡Sí, correcto!', no: 'Cambiar idioma' },
}

// ─── 공통 컴포넌트 ────────────────────────────────────────────
function SpeakerBtn({ onClick }) {
  return (
    <button onClick={onClick}
      className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all">
      <Volume2 size={16} className="text-white/80" />
    </button>
  )
}

function AdBanner({ t }) {
  return (
    <div className="w-full bg-gray-900 border border-gray-700 rounded-xl flex items-center justify-center py-3 px-4 gap-2">
      <span className="text-xs text-gray-500 border border-gray-700 rounded px-1">{t.adLabel}</span>
      <span className="text-xs text-gray-400 flex-1 text-center">D.Maru Premium · {t.proBtn}</span>
    </div>
  )
}

function Waveform({ active }) {
  const heights = [30, 55, 40, 70, 45, 60, 35, 65, 50, 40, 75, 45]
  return (
    <div className="flex items-center justify-center gap-[3px] h-10">
      {heights.map((h, i) => (
        <div key={i}
          className={`w-[3px] rounded-full transition-all ${active ? 'bg-violet-400' : 'bg-white/20'}`}
          style={{
            height: active ? `${h}%` : '20%',
            animation: active ? `wavebar 0.8s ease-in-out ${i * 0.07}s infinite alternate` : 'none',
          }}
        />
      ))}
      <style>{`@keyframes wavebar{from{transform:scaleY(0.4);opacity:0.5}to{transform:scaleY(1);opacity:1}}`}</style>
    </div>
  )
}

function VoiceInputArea({ t, sourceLang, onTranscript }) {
  const [voiceState, setVoiceState] = useState('idle')
  const timerRef = useRef(null)

  function handleMicTap() {
    if (voiceState === 'listening') {
      clearTimeout(timerRef.current)
      setVoiceState('processing')
      timerRef.current = setTimeout(() => {
        onTranscript(MOCK_STT[sourceLang.code] || 'Hello')
        setVoiceState('idle')
      }, 700)
      return
    }
    setVoiceState('listening')
    timerRef.current = setTimeout(() => {
      setVoiceState('processing')
      setTimeout(() => {
        onTranscript(MOCK_STT[sourceLang.code] || 'Hello')
        setVoiceState('idle')
      }, 700)
    }, 2500)
  }

  useEffect(() => () => clearTimeout(timerRef.current), [])
  const isListening = voiceState === 'listening'
  const isProcessing = voiceState === 'processing'

  return (
    <div className="flex flex-col items-center gap-5 py-6">
      <Waveform active={isListening} />
      <div className="relative flex items-center justify-center">
        {isListening && (
          <>
            <div className="absolute w-32 h-32 rounded-full bg-violet-500/15 animate-ping" />
            <div className="absolute w-24 h-24 rounded-full bg-violet-500/20 animate-pulse" />
          </>
        )}
        <button onPointerDown={handleMicTap} disabled={isProcessing}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-2xl
            ${isListening ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/50'
              : isProcessing ? 'bg-gray-700'
              : 'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/30'}`}>
          {isListening ? <MicOff size={30} className="text-white" /> : <Mic size={30} className="text-white" />}
        </button>
      </div>
      <div className="text-center">
        {isProcessing ? <p className="text-gray-400 text-sm font-medium animate-pulse">{t.processing}</p>
          : isListening ? <p className="text-violet-300 text-sm font-semibold">{t.listening}</p>
          : <p className="text-gray-500 text-sm">{t.tapToSpeak}</p>}
        <p className="text-gray-600 text-xs mt-1">{sourceLang.flag} {sourceLang.native}</p>
      </div>
    </div>
  )
}

// ─── 언어 확인 모달 ───────────────────────────────────────────
function LangConfirmModal({ detectedLang, onConfirm }) {
  const [mode, setMode] = useState(detectedLang ? 'confirm' : 'pick')
  const langCode = detectedLang?.code || 'en'
  const msg = LANG_CONFIRM_MSGS[langCode] || LANG_CONFIRM_MSGS.en

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
      <div className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-3xl p-6 flex flex-col items-center gap-5 shadow-2xl">
        {mode === 'confirm' && detectedLang ? (
          <>
            <p className="text-gray-400 text-xs text-center">{msg.source}</p>
            <div className="flex flex-col items-center gap-3">
              <div className="w-28 h-28 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                <span className="text-6xl leading-none select-none">{detectedLang.flag}</span>
              </div>
              <p className="text-white text-2xl font-black">{detectedLang.native}</p>
            </div>
            <p className="text-white/70 text-base text-center leading-relaxed">{msg.q}</p>
            <div className="w-full flex flex-col gap-3">
              <button onClick={() => onConfirm(detectedLang)}
                className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold py-4 rounded-2xl active:scale-95 transition-all text-base shadow-lg shadow-indigo-500/30">
                {msg.yes}
              </button>
              <button onClick={() => setMode('pick')}
                className="w-full text-gray-400 text-sm py-2.5 hover:text-white transition-colors rounded-xl hover:bg-white/5">
                {msg.no}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-full text-center">
              <p className="text-white font-bold text-lg">언어를 선택해주세요</p>
              <p className="text-gray-400 text-sm mt-1">Select your main language</p>
            </div>
            <div className="w-full flex flex-col gap-2 max-h-72 overflow-y-auto">
              {LANGUAGES.map(lang => (
                <button key={lang.code} onClick={() => onConfirm(lang)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-98 transition-all text-left">
                  <span className="text-2xl leading-none">{lang.flag}</span>
                  <span className="text-white font-semibold">{lang.native}</span>
                  <ArrowRight size={16} className="text-gray-600 ml-auto" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Google 로그인 버튼 ────────────────────────────────────────
function GoogleLoginCard({ t, onLoginWithLang }) {
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const credential = GoogleAuthProvider.credentialFromResult(result)
      const accessToken = credential?.accessToken
      let detectedLang = null
      if (accessToken) {
        const code = await fetchGoogleLocale(accessToken)
        detectedLang = LANGUAGES.find(l => l.code === code) || null
      }
      onLoginWithLang?.(detectedLang)
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
        <Users size={24} className="text-white" />
      </div>
      <p className="text-white/60 text-sm text-center">{t.loginDesc}</p>
      <button onClick={handleLogin} disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-bold py-3 px-5 rounded-xl active:scale-95 transition-all shadow-lg disabled:opacity-60">
        <svg width="20" height="20" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        {loading ? '...' : t.loginWith}
      </button>
    </div>
  )
}

// ─── 채팅방 목록 ─────────────────────────────────────────────
function ChatRoomListScreen({ user, userLang, onEnterRoom, onBack }) {
  const t = I18N[userLang.code] || I18N.en
  const [rooms, setRooms] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [creating, setCreating] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'rooms'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  async function createRoom() {
    if (!newRoomName.trim()) return
    setCreating(true)
    try {
      const inviteCode = generateInviteCode()
      const ref = await addDoc(collection(db, 'rooms'), {
        name: newRoomName.trim(),
        inviteCode,
        createdBy: user.uid,
        createdByName: user.displayName,
        createdAt: serverTimestamp(),
        memberCount: 1,
      })
      setNewRoomName('')
      setShowCreate(false)
      onEnterRoom({ id: ref.id, name: newRoomName.trim(), inviteCode })
    } finally {
      setCreating(false)
    }
  }

  async function joinByCode() {
    const code = joinCode.trim().toUpperCase()
    if (code.length < 6) return
    setJoining(true)
    setJoinError(false)
    try {
      const q = query(collection(db, 'rooms'), where('inviteCode', '==', code))
      const snap = await getDocs(q)
      if (snap.empty) {
        setJoinError(true)
      } else {
        const roomDoc = snap.docs[0]
        setShowJoin(false)
        setJoinCode('')
        onEnterRoom({ id: roomDoc.id, ...roomDoc.data() })
      }
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="flex items-center gap-3 px-5 pt-10 pb-4 border-b border-white/5">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 active:scale-95">
          <X size={18} className="text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-bold">{t.chatRoom}</h1>
          <p className="text-gray-500 text-xs">{userLang.flag} {user.displayName}</p>
        </div>
        <button onClick={() => { setShowJoin(!showJoin); setShowCreate(false) }}
          className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold px-3 py-2 rounded-xl active:scale-95 transition-all">
          <Hash size={14} /> {t.joinRoom}
        </button>
        <button onClick={() => { setShowCreate(!showCreate); setShowJoin(false) }}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-2 rounded-xl active:scale-95 transition-all">
          <Plus size={14} /> {t.newRoom}
        </button>
      </div>

      {showJoin && (
        <div className="mx-5 mt-4 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              value={joinCode}
              onChange={e => { setJoinCode(e.target.value.toUpperCase().slice(0, 6)); setJoinError(false) }}
              onKeyDown={e => e.key === 'Enter' && joinByCode()}
              placeholder={t.joinPlaceholder}
              autoFocus
              maxLength={6}
              className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-sm font-mono tracking-widest uppercase"
            />
            <button onClick={() => { setShowJoin(false); setJoinCode(''); setJoinError(false) }}
              className="text-gray-500 text-xs px-2 hover:text-white">{t.cancel}</button>
            <button onClick={joinByCode} disabled={joining || joinCode.length < 6}
              className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 disabled:opacity-50">
              {joining ? '...' : t.joinBtn}
            </button>
          </div>
          {joinError && <p className="text-red-400 text-xs">{t.roomNotFound}</p>}
        </div>
      )}

      {showCreate && (
        <div className="mx-5 mt-4 bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-2">
          <input
            value={newRoomName}
            onChange={e => setNewRoomName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createRoom()}
            placeholder={t.roomNamePlaceholder}
            autoFocus
            className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-sm"
          />
          <button onClick={() => setShowCreate(false)}
            className="text-gray-500 text-xs px-2 hover:text-white">{t.cancel}</button>
          <button onClick={createRoom} disabled={creating}
            className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 disabled:opacity-50">
            {t.createRoom}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        {rooms.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
            <Hash size={40} className="text-white/20" />
            <p className="text-white/30 text-sm text-center whitespace-pre-line">{t.noRooms}</p>
          </div>
        ) : (
          rooms.map(room => (
            <button key={room.id} onClick={() => onEnterRoom(room)}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 text-left active:scale-98 transition-all flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-500/30 flex items-center justify-center flex-shrink-0">
                <Hash size={18} className="text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{room.name}</p>
                <p className="text-gray-500 text-xs">{room.createdByName}</p>
              </div>
              <ArrowRight size={16} className="text-gray-600 flex-shrink-0" />
            </button>
          ))
        )}
      </div>

      <div className="px-5 pb-6">
        <AdBanner t={t} />
      </div>
    </div>
  )
}

// ─── 채팅방 (번역 채팅) ───────────────────────────────────────
function ChatRoomScreen({ user, userLang, room, onBack }) {
  const t = I18N[userLang.code] || I18N.en
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  function copyInviteCode() {
    if (!room.inviteCode) return
    navigator.clipboard.writeText(room.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // 메시지 실시간 구독
  useEffect(() => {
    const q = query(
      collection(db, 'rooms', room.id, 'messages'),
      orderBy('createdAt', 'asc')
    )
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [room.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setInput('')

    // 다른 언어로 번역 (userLang → ko, en, ja 중 다른 것들)
    const targets = LANGUAGES.filter(l => l.code !== userLang.code).slice(0, 2)
    const translations = {}
    await Promise.all(
      targets.map(async lang => {
        translations[lang.code] = await translateText(text, userLang.code, lang.code)
      })
    )

    await addDoc(collection(db, 'rooms', room.id, 'messages'), {
      text,
      translations,
      fromLang: userLang.code,
      senderUid: user.uid,
      senderName: user.displayName,
      senderPhoto: user.photoURL,
      createdAt: serverTimestamp(),
    })
    setSending(false)
    inputRef.current?.focus()
  }

  function speak(text) {
    if (!text) return
    const u = new SpeechSynthesisUtterance(text)
    window.speechSynthesis.speak(u)
  }

  const isMe = uid => uid === user.uid

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-5 pt-10 pb-4 border-b border-white/5 flex-shrink-0">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 active:scale-95">
          <X size={18} className="text-white" />
        </button>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
          <Hash size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold truncate">{room.name}</p>
          <p className="text-gray-500 text-xs">{userLang.flag} {userLang.native}</p>
        </div>
        {room.inviteCode && (
          <button onClick={copyInviteCode}
            className="flex items-center gap-1.5 bg-white/8 hover:bg-white/15 border border-white/10 rounded-xl px-2.5 py-1.5 transition-all active:scale-95 flex-shrink-0">
            <span className="text-white/60 text-xs font-mono tracking-widest">{room.inviteCode}</span>
            <span className="text-indigo-400 text-xs">{copied ? t.copied : t.copyCode}</span>
          </button>
        )}
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <MessageCircle size={36} className="text-white/15" />
            <p className="text-white/25 text-sm">첫 메시지를 보내보세요!</p>
          </div>
        )}
        {messages.map(msg => {
          const mine = isMe(msg.senderUid)
          // 내 언어로 된 번역 찾기 (상대방 메시지일 경우)
          const myTranslation = !mine && msg.translations?.[userLang.code]

          return (
            <div key={msg.id} className={`flex gap-2 ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* 아바타 */}
              {!mine && (
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-1">
                  {msg.senderPhoto
                    ? <img src={msg.senderPhoto} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-indigo-600 flex items-center justify-center">
                        <User size={14} className="text-white" />
                      </div>
                  }
                </div>
              )}

              <div className={`flex flex-col gap-1 max-w-[75%] ${mine ? 'items-end' : 'items-start'}`}>
                {!mine && (
                  <p className="text-gray-500 text-xs px-1">{msg.senderName}</p>
                )}

                {/* 원문 */}
                <div className={`rounded-2xl px-4 py-2.5 ${mine
                  ? 'bg-gradient-to-br from-indigo-600 to-violet-600 rounded-tr-sm'
                  : 'bg-white/10 rounded-tl-sm'}`}>
                  <p className="text-white text-sm leading-relaxed">{msg.text}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-white/40 text-xs">
                      {LANGUAGES.find(l => l.code === msg.fromLang)?.flag}
                    </span>
                    <button onClick={() => speak(msg.text)}
                      className="text-white/40 hover:text-white/70 transition-colors">
                      <Volume2 size={11} />
                    </button>
                  </div>
                </div>

                {/* 번역 (상대방 메시지 + 내 언어 번역 있을 때) */}
                {myTranslation && (
                  <div className="bg-indigo-950/50 border border-indigo-500/20 rounded-xl rounded-tl-sm px-3 py-2 flex items-start gap-2">
                    <span className="text-xs text-indigo-400 flex-shrink-0 mt-0.5">
                      {userLang.flag}
                    </span>
                    <p className="text-indigo-200 text-xs leading-relaxed flex-1">{myTranslation}</p>
                    <button onClick={() => speak(myTranslation)}
                      className="text-indigo-400/60 hover:text-indigo-400 transition-colors flex-shrink-0">
                      <Volume2 size={11} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div className="flex-shrink-0 px-4 pb-6 pt-3 border-t border-white/5">
        <div className="flex items-end gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
            }}
            placeholder={t.chatPlaceholder}
            rows={1}
            className="flex-1 bg-transparent text-white text-sm placeholder-white/25 resize-none outline-none leading-relaxed"
            style={{ maxHeight: '100px' }}
          />
          <button onClick={sendMessage} disabled={!input.trim() || sending}
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-indigo-600 disabled:bg-white/10 disabled:text-white/20 text-white active:scale-95 transition-all">
            <Send size={16} />
          </button>
        </div>
        <p className="text-gray-600 text-xs text-center mt-2">
          {userLang.flag} {userLang.native} → 자동 번역
        </p>
      </div>
    </div>
  )
}

// ─── SCREEN 1: 온보딩 ────────────────────────────────────────
function OnboardingScreen({ onComplete }) {
  const detectedCode = detectLocale()
  const detectedLang = LANGUAGES.find(l => l.code === detectedCode) || LANGUAGES[1]
  const t = I18N[detectedCode] || I18N.en
  const [selected, setSelected] = useState(detectedLang)
  const [open, setOpen] = useState(false)
  const [warn, setWarn] = useState(false)

  function handleConfirm() {
    if (!selected) { setWarn(true); return }
    onComplete(selected)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-indigo-950 to-gray-950 flex flex-col items-center justify-center px-6 gap-8">
      <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl">
          <Globe size={40} className="text-white" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">D.Maru</h1>
        <p className="text-indigo-300 text-sm font-medium">디마루</p>
      </div>
      <div className="w-full max-w-sm bg-white/5 rounded-2xl p-5 border border-white/10">
        <p className="text-white text-lg font-semibold text-center leading-relaxed">{t.greeting}</p>
      </div>
      <div className="w-full max-w-sm relative">
        <button onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between bg-white/10 hover:bg-white/15 border border-white/20 rounded-2xl px-5 py-4 transition-all">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{selected?.flag}</span>
            <span className="text-white font-semibold">{selected?.native}</span>
          </div>
          <ChevronDown size={20} className={`text-white/60 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="absolute top-full mt-2 w-full bg-gray-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50">
            {LANGUAGES.map(lang => (
              <button key={lang.code}
                onClick={() => { setSelected(lang); setOpen(false); setWarn(false) }}
                className={`w-full flex items-center gap-3 px-5 py-4 hover:bg-white/10 transition-all ${selected?.code === lang.code ? 'bg-indigo-600/30' : ''}`}>
                <span className="text-2xl">{lang.flag}</span>
                <span className="text-white font-medium">{lang.native}</span>
                {selected?.code === lang.code && <Check size={16} className="text-indigo-400 ml-auto" />}
              </button>
            ))}
          </div>
        )}
      </div>
      {warn && <p className="text-red-400 text-sm font-medium -mt-4">{t.warn}</p>}
      <button onClick={handleConfirm}
        className="w-full max-w-sm bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold py-4 rounded-2xl text-lg flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-indigo-500/30">
        {t.confirm} <ArrowRight size={20} />
      </button>
    </div>
  )
}

// ─── SCREEN 2: 메인 메뉴 ────────────────────────────────────
function MainMenuScreen({ user, userLang, onLearn, onTranslate, onChatRoom, onLoginWithLang }) {
  const t = I18N[userLang.code] || I18N.en

  async function handleLogout() {
    await signOut(auth)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col px-5 pt-12 pb-6 gap-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
          <Globe size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-white font-black text-xl tracking-tight">D.Maru</h1>
          {/* 국기 뱃지 아이콘 */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-base leading-none">{userLang.flag}</span>
            <span className="text-gray-400 text-xs font-medium">{userLang.native}</span>
          </div>
        </div>
        {user ? (
          <div className="flex items-center gap-2">
            {/* 로그인 후: 국기 + 프로필 사진 뱃지 */}
            <div className="flex items-center gap-1 bg-white/8 border border-white/10 rounded-full pl-1 pr-2 py-0.5">
              <span className="text-lg leading-none">{userLang.flag}</span>
              {user.photoURL
                ? <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full" />
                : <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                    <User size={12} className="text-white" />
                  </div>
              }
            </div>
            <button onClick={handleLogout}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all">
              <LogOut size={15} className="text-gray-400" />
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 flex-1 mt-4">
        <button onClick={onLearn}
          className="w-full bg-gradient-to-br from-indigo-900 to-indigo-800 border border-indigo-700/50 rounded-3xl p-6 text-left active:scale-98 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/30 flex items-center justify-center">
              <BookOpen size={28} className="text-indigo-300" />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-lg">{t.learn}</p>
              <p className="text-indigo-300 text-sm mt-0.5">{t.learnSub}</p>
            </div>
            <ArrowRight size={20} className="text-indigo-400" />
          </div>
          <div className="mt-4 flex items-center gap-2 bg-indigo-500/20 rounded-xl px-3 py-2 w-fit">
            <Zap size={14} className="text-yellow-400" />
            <span className="text-yellow-300 text-xs font-bold">{t.streak} 7{t.days} 🔥</span>
          </div>
        </button>

        <button onClick={onTranslate}
          className="w-full bg-gradient-to-br from-violet-900 to-purple-900 border border-violet-700/50 rounded-3xl p-6 text-left active:scale-98 transition-all relative overflow-hidden">
          <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full px-2 py-0.5">
            <span className="text-black text-xs font-black">CORE</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-violet-500/30 flex items-center justify-center">
              <MessageCircle size={28} className="text-violet-300" />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-lg">{t.translate}</p>
              <p className="text-violet-300 text-sm mt-0.5">{t.translateSub}</p>
            </div>
            <ArrowRight size={20} className="text-violet-400" />
          </div>
        </button>

        {/* 채팅방 버튼 */}
        {user ? (
          <button onClick={onChatRoom}
            className="w-full bg-gradient-to-br from-emerald-900 to-teal-900 border border-emerald-700/50 rounded-3xl p-6 text-left active:scale-98 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/30 flex items-center justify-center">
                <Hash size={28} className="text-emerald-300" />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-lg">{t.chatRoom}</p>
                <p className="text-emerald-300 text-sm mt-0.5">{t.chatRoomSub}</p>
              </div>
              <ArrowRight size={20} className="text-emerald-400" />
            </div>
          </button>
        ) : (
          <GoogleLoginCard t={t} onLoginWithLang={onLoginWithLang} />
        )}
      </div>

      <ProBanner t={t} />
      <AdBanner t={t} />
    </div>
  )
}

// ─── SCREEN 3: 번역 화면 ─────────────────────────────────────
function TranslateScreen({ userLang, onBack }) {
  const t = I18N[userLang.code] || I18N.en
  const availableForTarget = LANGUAGES.filter(l => l.code !== userLang.code)
  const [sourceLang, setSourceLang] = useState(userLang)
  const [target1, setTarget1] = useState(availableForTarget[0])
  const [target2, setTarget2] = useState(availableForTarget[1])
  const [inputText, setInputText] = useState('')
  const [translations, setTranslations] = useState({ t1: '', t2: '' })
  const [inputMode, setInputMode] = useState('voice')
  const timerRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { if (inputMode === 'text') inputRef.current?.focus() }, [inputMode])

  const triggerTranslation = useCallback((val) => {
    clearTimeout(timerRef.current)
    if (!val.trim()) { setTranslations({ t1: '', t2: '' }); return }
    timerRef.current = setTimeout(async () => {
      const [r1, r2] = await Promise.all([
        translateText(val, sourceLang.code, target1.code),
        translateText(val, sourceLang.code, target2.code),
      ])
      setTranslations({ t1: r1, t2: r2 })
    }, 500)
  }, [sourceLang, target1, target2])

  function handleInput(val) { setInputText(val); triggerTranslation(val) }
  function handleTranscript(text) { setInputText(text); triggerTranslation(text) }
  function speak(text) { if (!text) return; const u = new SpeechSynthesisUtterance(text); window.speechSynthesis.speak(u) }

  const target1Options = LANGUAGES.filter(l => l.code !== sourceLang.code && l.code !== target2.code)
  const target2Options = LANGUAGES.filter(l => l.code !== sourceLang.code && l.code !== target1.code)

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="flex items-center gap-3 px-5 pt-10 pb-4 border-b border-white/5">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 active:scale-95">
          <X size={18} className="text-white" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Globe size={14} className="text-white" />
          </div>
          <span className="text-white font-bold">D.Maru</span>
        </div>
        <div className="ml-auto flex items-center bg-white/8 border border-white/10 rounded-xl p-1 gap-1">
          <button onClick={() => setInputMode('voice')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${inputMode === 'voice' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'text-gray-400 hover:text-white'}`}>
            <Mic size={13} /> {t.voiceMode}
          </button>
          <button onClick={() => setInputMode('text')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${inputMode === 'text' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-gray-400 hover:text-white'}`}>
            <Keyboard size={13} /> {t.textMode}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        <div className="flex gap-2">
          <LangPicker value={sourceLang} options={LANGUAGES.filter(l => l.code !== target1.code && l.code !== target2.code)} onChange={setSourceLang} label="FROM" />
          <LangPicker value={target1} options={target1Options} onChange={setTarget1} label="TO 1" />
          <LangPicker value={target2} options={target2Options} onChange={setTarget2} label="TO 2" />
        </div>

        {inputMode === 'voice' ? (
          <div className="bg-white/5 border border-violet-500/30 rounded-2xl overflow-hidden">
            <VoiceInputArea t={t} sourceLang={sourceLang} onTranscript={handleTranscript} />
            {inputText ? (
              <div className="border-t border-white/10 px-4 py-3 flex items-center gap-3">
                <p className="flex-1 text-white/80 text-sm leading-relaxed">{inputText}</p>
                <SpeakerBtn onClick={() => speak(inputText)} />
              </div>
            ) : (
              <div className="border-t border-white/5 px-4 py-3">
                <p className="text-white/20 text-sm italic">{t.voicePlaceholder}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <textarea ref={inputRef} value={inputText} onChange={e => handleInput(e.target.value)}
              placeholder={t.inputPlaceholder}
              className="w-full bg-transparent text-white text-lg placeholder-white/25 resize-none outline-none min-h-[90px] leading-relaxed" rows={3} />
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/10">
              <span className="text-gray-500 text-xs">{sourceLang.flag} {sourceLang.native}</span>
              <SpeakerBtn onClick={() => speak(inputText)} />
            </div>
          </div>
        )}

        <TranslationCard lang={target1} text={translations.t1} onSpeak={() => speak(translations.t1)} />
        <TranslationCard lang={target2} text={translations.t2} onSpeak={() => speak(translations.t2)} />
        <ViralBar t={t} />
        <ProBanner t={t} />
        <AdBanner t={t} />
      </div>
    </div>
  )
}

function LangPicker({ value, options, onChange, label }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative flex-1">
      <p className="text-gray-500 text-xs mb-1 font-medium px-1">{label}</p>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-center gap-1 bg-white/8 border border-white/10 rounded-xl py-2.5 px-2 active:scale-95 transition-all">
        <span className="text-base">{value.flag}</span>
        <span className="text-white text-xs font-semibold truncate">{value.code.toUpperCase()}</span>
        <ChevronDown size={12} className="text-white/40 flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 w-40 bg-gray-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
          {options.map(lang => (
            <button key={lang.code} onClick={() => { onChange(lang); setOpen(false) }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/10 transition-all text-left ${value.code === lang.code ? 'bg-indigo-600/30' : ''}`}>
              <span>{lang.flag}</span>
              <span className="text-white text-sm">{lang.native}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function TranslationCard({ lang, text, onSpeak }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-start gap-3">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{lang.flag}</span>
          <span className="text-gray-400 text-xs font-medium">{lang.native}</span>
        </div>
        <p className={`text-white text-base leading-relaxed min-h-[1.5rem] ${!text ? 'text-white/20 italic text-sm' : ''}`}>
          {text || '...'}
        </p>
      </div>
      <SpeakerBtn onClick={onSpeak} />
    </div>
  )
}

function ViralBar({ t }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
      <div className="flex items-center justify-around gap-2">
        <button className="flex flex-col items-center gap-1.5 flex-1 py-2 rounded-xl hover:bg-white/10 active:scale-95 transition-all">
          <Download size={20} className="text-indigo-400" />
          <span className="text-xs text-gray-400 font-medium">{t.save}</span>
        </button>
        <div className="w-px h-8 bg-white/10" />
        <button className="flex flex-col items-center gap-1.5 flex-1 py-2 rounded-xl hover:bg-white/10 active:scale-95 transition-all">
          <Share2 size={20} className="text-violet-400" />
          <span className="text-xs text-gray-400 font-medium">{t.share}</span>
        </button>
        <div className="w-px h-8 bg-white/10" />
        <button className="flex flex-col items-center gap-1.5 flex-1 py-2 rounded-xl hover:bg-white/10 active:scale-95 transition-all">
          <Instagram size={20} className="text-pink-400" />
          <span className="text-xs text-gray-400 font-medium">Instagram</span>
        </button>
      </div>
    </div>
  )
}

function ProBanner({ t }) {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-yellow-500/30">
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-950/80 to-orange-950/80 backdrop-blur-sm z-10 flex items-center justify-center gap-3 px-4">
        <Lock size={16} className="text-yellow-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-yellow-300 text-xs font-black uppercase tracking-wide">{t.proLabel}</p>
          <p className="text-white text-sm font-bold leading-tight">{t.proTitle}</p>
        </div>
        <button className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs font-black px-3 py-1.5 rounded-lg flex-shrink-0 active:scale-95 flex items-center gap-1">
          <Crown size={12} /> PRO
        </button>
      </div>
      <div className="px-4 py-4 opacity-30 select-none pointer-events-none">
        <div className="flex items-center gap-2 mb-1">
          <Star size={14} className="text-yellow-400" />
          <p className="text-white text-sm font-bold">{t.proTitle}</p>
        </div>
        <p className="text-gray-300 text-xs">{t.proDesc}</p>
      </div>
    </div>
  )
}

// ─── SCREEN 4: 학습 화면 ─────────────────────────────────────
function LearnScreen({ userLang, onBack }) {
  const t = I18N[userLang.code] || I18N.en
  const DAILY_DATA = {
    phrase: {
      ko: '이 근처에 편의점 있어요?', en: 'Is there a convenience store nearby?',
      ja: '近くにコンビニはありますか？', th: 'มีร้านสะดวกซื้อใกล้ๆ ไหมครับ',
      zh: '附近有便利店嗎？', es: '¿Hay una tienda de conveniencia cerca?',
    },
    grammar: {
      ko: '~て형 + もらえますか？ → 부탁 표현', en: 'May I ~? → Polite request',
      ja: '～ていただけますか → 丁寧な依頼表現', th: 'ขอ~ ได้ไหมครับ → การขอร้องสุภาพ',
      zh: '可唔可以幫我～？ → 客氣請求', es: '¿Podría ~? → Solicitud cortés',
    },
  }
  function speak(text) { if (!text) return; const u = new SpeechSynthesisUtterance(text); window.speechSynthesis.speak(u) }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="flex items-center gap-3 px-5 pt-10 pb-4 border-b border-white/5">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 active:scale-95">
          <X size={18} className="text-white" />
        </button>
        <span className="text-white font-bold">{t.learn}</span>
      </div>
      <div className="flex-1 px-5 py-5 flex flex-col gap-4 overflow-y-auto">
        <div className="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border border-yellow-700/30 rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-3xl">🔥</span>
          <div>
            <p className="text-white font-bold text-base">{t.streak} 7{t.days}</p>
            <p className="text-yellow-300 text-xs">{t.daily}</p>
          </div>
          <div className="ml-auto flex gap-1">
            {[1,2,3,4,5,6,7].map(i => (
              <div key={i} className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center">
                <Check size={10} className="text-black" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-indigo-400 text-xs font-bold uppercase tracking-wide mb-3">{t.todayPhrase}</p>
          <p className="text-white text-lg font-semibold leading-relaxed mb-4">{DAILY_DATA.phrase[userLang.code]}</p>
          <button onClick={() => speak(DAILY_DATA.phrase[userLang.code])}
            className="flex items-center gap-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-sm font-medium px-4 py-2 rounded-xl transition-all active:scale-95">
            <Volume2 size={16} /> {t.listen}
          </button>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-violet-400 text-xs font-bold uppercase tracking-wide mb-3">{t.todayGrammar}</p>
          <p className="text-white text-base leading-relaxed font-mono bg-white/5 rounded-xl px-4 py-3">
            {DAILY_DATA.grammar[userLang.code]}
          </p>
        </div>
        <ProBanner t={t} />
        <AdBanner t={t} />
      </div>
    </div>
  )
}

// ─── App 루트 ────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('onboarding')
  const [userLang, setUserLang] = useState(null)
  const [user, setUser] = useState(null)
  const [currentRoom, setCurrentRoom] = useState(null)
  const [pendingGoogleLang, setPendingGoogleLang] = useState(null)
  const [showLangConfirm, setShowLangConfirm] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u))
    return unsub
  }, [])

  function handleOnboardingComplete(lang) {
    setUserLang(lang)
    setScreen('main')
  }

  function handleEnterRoom(room) {
    setCurrentRoom(room)
    setScreen('chatRoom')
  }

  // Google 로그인 직후 계정 언어 감지 결과 수신
  function handleLoginWithLang(detectedLang) {
    setPendingGoogleLang(detectedLang)
    setShowLangConfirm(true)
  }

  // 모달에서 언어 확정
  function handleLangConfirm(lang) {
    setUserLang(lang)
    setPendingGoogleLang(null)
    setShowLangConfirm(false)
  }

  let currentScreen = null
  if (screen === 'onboarding') {
    currentScreen = <OnboardingScreen onComplete={handleOnboardingComplete} />
  } else if (screen === 'main') {
    currentScreen = (
      <MainMenuScreen
        user={user}
        userLang={userLang}
        onLearn={() => setScreen('learn')}
        onTranslate={() => setScreen('translate')}
        onChatRoom={() => setScreen('chatRoomList')}
        onLoginWithLang={handleLoginWithLang}
      />
    )
  } else if (screen === 'translate') {
    currentScreen = <TranslateScreen userLang={userLang} onBack={() => setScreen('main')} />
  } else if (screen === 'learn') {
    currentScreen = <LearnScreen userLang={userLang} onBack={() => setScreen('main')} />
  } else if (screen === 'chatRoomList') {
    currentScreen = (
      <ChatRoomListScreen
        user={user}
        userLang={userLang}
        onEnterRoom={handleEnterRoom}
        onBack={() => setScreen('main')}
      />
    )
  } else if (screen === 'chatRoom' && currentRoom) {
    currentScreen = (
      <ChatRoomScreen
        user={user}
        userLang={userLang}
        room={currentRoom}
        onBack={() => setScreen('chatRoomList')}
      />
    )
  }

  return (
    <div className="relative">
      {currentScreen}
      {showLangConfirm && userLang && (
        <LangConfirmModal
          detectedLang={pendingGoogleLang}
          onConfirm={handleLangConfirm}
        />
      )}
    </div>
  )
}
