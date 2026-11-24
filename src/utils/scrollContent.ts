export interface ScrollStanza {
  id: string;
  heading?: string;
  text: string;
  /** Normalized cumulative weight [0..1] for highlighting along voiceover progress */
  weight: number;
}

export const OPENING_SCROLL_TITLE = 'NGÀY VĂN HÓA VIỆT NAM';
export const OPENING_SCROLL_SUBTITLE = 'Kỷ niệm Hội nghị Văn hóa Toàn quốc · 24 tháng 11 năm 1946';

export const OPENING_SCROLL_STANZAS: readonly ScrollStanza[] = [
  {
    id: 'stanza-1',
    text: 'Ngày hai mươi bốn tháng mười một năm một nghìn chín trăm bốn mươi sáu, giữa mùa thu lịch sử của nước Việt Nam độc lập, Hội nghị Văn hóa Toàn quốc lần thứ nhất đã khai mạc tại Thủ đô Hà Nội.',
    weight: 0.27,
  },
  {
    id: 'stanza-2',
    text: 'Từ diễn đàn thiêng liêng ấy, Chủ tịch Hồ Chí Minh đã khẳng định chân lý bất hủ: “Văn hóa soi đường cho quốc dân đi”, thắp lên ngọn đuốc dẫn lối cho hồn cốt dân tộc qua bao mùa dâu bể.',
    weight: 0.56,
  },
  {
    id: 'stanza-3',
    text: 'Ngàn năm văn hiến lắng đọng trong tiếng trống đồng Đông Sơn, dáng Khuê Văn Các, nét Chùa Một Cột, sắc hoa đào hoa mai và nhịp đoàn kết son sắt của năm mươi tư dân tộc anh em.',
    weight: 0.83,
  },
  {
    id: 'stanza-4',
    text: 'Văn hóa còn thì dân tộc còn. Kính mời bạn khẽ chạm ấn son, cùng khai mở bức họa sơn thủy và hòa vào khúc ca Thịnh Vượng Việt Nam Sáng Ngời.',
    weight: 1.0,
  },
];

export const OPENING_SCROLL_NARRATION_TEXT = [
  'Kính chào mừng Ngày Văn Hóa Việt Nam, hai mươi bốn tháng mười một.',
  ...OPENING_SCROLL_STANZAS.map((s) => s.text),
].join(' ');

export const CLOSING_SCROLL_QUOTE =
  '“Văn hóa còn thì dân tộc còn, văn hóa mất thì dân tộc mất.”';
export const CLOSING_SCROLL_QUOTE_AUTHOR = 'Cố Tổng Bí thư Nguyễn Phú Trọng';
export const CLOSING_SCROLL_CLOSING_LINE =
  'Ngàn năm văn hiến rạng rỡ non sông · Năm mươi tư dân tộc chung một nhịp tim · Chúc Ngày Văn Hóa Việt Nam 24 tháng 11 trọn vẹn niềm tự hào.';

/**
 * Maps audio playback progress [0..1] to the currently highlighted stanza index
 * on the opening Imperial Brocade Scroll.
 */
export function getActiveScrollStanzaIndex(progress01: number): number {
  const clamped = Math.max(0, Math.min(1, progress01));
  for (let i = 0; i < OPENING_SCROLL_STANZAS.length; i++) {
    if (clamped <= OPENING_SCROLL_STANZAS[i].weight) {
      return i;
    }
  }
  return OPENING_SCROLL_STANZAS.length - 1;
}

/**
 * Builds an optional personalized closing line when the page was opened from a shared greeting link.
 */
export function formatClosingPersonalDedication(
  recipient: string,
  sender: string,
  message: string,
): { heading: string; body: string } | null {
  const cleanRecipient = recipient.trim();
  const cleanSender = sender.trim();
  const cleanMessage = message.trim();
  if (!cleanRecipient && !cleanSender && !cleanMessage) {
    return null;
  }
  const heading = cleanRecipient
    ? `Thân gửi ${cleanRecipient}${cleanSender ? ` · Từ ${cleanSender}` : ''}`
    : cleanSender
      ? `Lời chúc từ ${cleanSender}`
      : 'Lời chúc Ngày Văn Hóa Việt Nam';
  return {
    heading,
    body: cleanMessage || CLOSING_SCROLL_CLOSING_LINE,
  };
}
